"""
知识条目服务。
优先使用 Supabase 数据库，不可用时降级为静态 JSON 文件。
"""

import json
import os
from typing import List, Optional, Tuple

from config import settings

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
ARTICLES_FILE = os.path.join(DATA_DIR, "knowledge_articles.json")

ALLOWED_CATEGORIES = {"节气", "节日", "诗词", "典籍", "非遗", "民俗", "人物"}


class ArticleServiceError(Exception):
    def __init__(self, message: str, code: str = "ERROR", status_code: int = 400):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)


class ArticleService:
    def __init__(self):
        self._client = None

    # ------------------------------------------------------------------
    # Supabase 连接（懒加载，失败时返回 None）
    # ------------------------------------------------------------------
    async def _get_client(self):
        if self._client is not None:
            return self._client

        url = settings.SUPABASE_URL
        key = settings.SUPABASE_SERVICE_ROLE_KEY

        if not url or not key:
            return None

        try:
            from supabase import create_async_client

            self._client = await create_async_client(url, key)
            # 轻量探活
            await self._client.table("knowledge_articles").select("id").limit(1).execute()
            return self._client
        except Exception:
            self._client = None
            return None

    # ------------------------------------------------------------------
    # 静态数据加载
    # ------------------------------------------------------------------
    def _load_all(self) -> List[dict]:
        if not os.path.exists(ARTICLES_FILE):
            return []
        with open(ARTICLES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)

    # ------------------------------------------------------------------
    # 列表
    # ------------------------------------------------------------------
    async def list_articles(
        self,
        category: Optional[str] = None,
        keyword: Optional[str] = None,
        limit: int = 12,
        offset: int = 0,
    ) -> Tuple[int, List[dict]]:
        if category and category not in ALLOWED_CATEGORIES:
            raise ArticleServiceError(
                f"category must be one of {ALLOWED_CATEGORIES}",
                code="INVALID_CATEGORY",
            )

        # 1) 尝试 Supabase
        client = await self._get_client()
        if client is not None:
            try:
                return await self._list_from_supabase(client, category, keyword, limit, offset)
            except Exception:
                pass  # 降级到静态

        # 2) 静态降级
        return self._list_from_static(category, keyword, limit, offset)

    async def _list_from_supabase(
        self, client, category, keyword, limit, offset
    ) -> Tuple[int, List[dict]]:
        base_select = "id,title,category,excerpt,cover,favorites,author,created_at"

        if keyword:
            # 无向量搜索时用内存过滤
            MAX_SEARCH = max(1000, offset + limit)
            q = client.table("knowledge_articles").select(base_select)
            if category:
                q = q.eq("category", category)
            q = q.order("created_at", desc=True)
            result = await q.range(0, MAX_SEARCH - 1).execute()
            rows = result.data or []

            k = keyword.lower().strip()
            filtered = []
            for r in rows:
                title = (r.get("title") or "").lower()
                excerpt = (r.get("excerpt") or "").lower()
                if k in title or k in excerpt:
                    filtered.append(r)

            total = len(filtered)
            items = filtered[offset: offset + limit]
            return total, items

        query = client.table("knowledge_articles").select(base_select)
        if category:
            query = query.eq("category", category)
        query = query.order("created_at", desc=True)

        # 取总数
        count_query = client.table("knowledge_articles").select("id", count="exact")
        if category:
            count_query = count_query.eq("category", category)
        count_result = await count_query.execute()
        total = count_result.count or 0

        result = await query.range(offset, offset + limit - 1).execute()
        items = result.data or []
        return total, items

    def _list_from_static(
        self, category, keyword, limit, offset
    ) -> Tuple[int, List[dict]]:
        articles = self._load_all()

        if category:
            articles = [a for a in articles if a.get("category") == category]

        if keyword:
            k = keyword.lower().strip()
            articles = [
                a
                for a in articles
                if k in (a.get("title") or "").lower()
                or k in (a.get("excerpt") or "").lower()
            ]

        articles.sort(key=lambda a: a.get("created_at", ""), reverse=True)

        total = len(articles)
        items = articles[offset: offset + limit]

        mapped = []
        for a in items:
            mapped.append({
                "id": a["id"],
                "title": a["title"],
                "category": a["category"],
                "excerpt": a["excerpt"],
                "cover": a.get("cover"),
                "favorites": a.get("favorites", 0),
                "author": a.get("author", "溯光编辑部"),
                "created_at": a.get("created_at", ""),
            })

        return total, mapped

    # ------------------------------------------------------------------
    # 详情
    # ------------------------------------------------------------------
    async def get_article(self, article_id: str) -> Optional[dict]:
        client = await self._get_client()
        if client is not None:
            try:
                return await self._get_article_supabase(client, article_id)
            except Exception:
                pass
        return self._get_article_static(article_id)

    async def _get_article_supabase(self, client, article_id: str) -> Optional[dict]:
        result = (
            await client.table("knowledge_articles")
            .select("*")
            .eq("id", article_id)
            .execute()
        )
        if not result.data:
            return None

        article = result.data[0]

        related_result = (
            await client.table("knowledge_articles")
            .select("id,title,category")
            .eq("category", article["category"])
            .neq("id", article_id)
            .limit(3)
            .execute()
        )
        article["related"] = related_result.data or []
        return article

    def _get_article_static(self, article_id: str) -> Optional[dict]:
        articles = self._load_all()
        for a in articles:
            if a["id"] == article_id:
                # 确保字段名与路由期望一致
                result = dict(a)
                if "content" in result and "body" not in result:
                    result["body"] = result.pop("content")
                # 生成相关推荐
                result["related"] = [
                    {"id": r["id"], "title": r["title"], "category": r["category"]}
                    for r in articles
                    if r["id"] != article_id and r.get("category") == a.get("category")
                ][:3]
                return result
        return None

    # ------------------------------------------------------------------
    # 收藏 / 取消收藏（仅 Supabase 模式）
    # ------------------------------------------------------------------
    async def toggle_favorite(self, article_id: str, user_id: str) -> dict:
        client = await self._get_client()
        if client is None:
            raise ArticleServiceError(
                "收藏功能需要数据库支持", code="DB_UNAVAILABLE", status_code=503
            )

        article_result = (
            await client.table("knowledge_articles")
            .select("id,favorites")
            .eq("id", article_id)
            .execute()
        )
        if not article_result.data:
            raise ArticleServiceError(
                "ARTICLE_NOT_FOUND", code="ARTICLE_NOT_FOUND", status_code=404
            )

        fav_result = (
            await client.table("article_favorites")
            .select("id")
            .eq("article_id", article_id)
            .eq("user_id", user_id)
            .execute()
        )

        current_favorites = article_result.data[0].get("favorites", 0)

        if fav_result.data:
            await (
                client.table("article_favorites")
                .delete()
                .eq("id", fav_result.data[0]["id"])
                .execute()
            )
            new_count = max(0, current_favorites - 1)
            is_favorited = False
        else:
            await (
                client.table("article_favorites")
                .insert({"article_id": article_id, "user_id": user_id})
                .execute()
            )
            new_count = current_favorites + 1
            is_favorited = True

        await (
            client.table("knowledge_articles")
            .update({"favorites": new_count})
            .eq("id", article_id)
            .execute()
        )

        return {
            "article_id": article_id,
            "is_favorited": is_favorited,
            "favorites_count": new_count,
        }

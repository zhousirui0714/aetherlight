"""
知识条目服务。
优先使用 Supabase 数据库，不可用时降级为静态 JSON 文件。

v2 升级：
  - 详情返回 10 个结构化字段（history/related_*/faq 等）
  - 新增 ai_fill 懒加载补全接口
  - 新增 stats 统计
"""
import json
import os
from typing import List, Optional, Tuple

from config import settings

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
ARTICLES_FILE = os.path.join(DATA_DIR, "knowledge_articles.json")

ALLOWED_CATEGORIES = {
    "节气", "节日", "诗词", "典籍", "非遗", "民俗",
    "人物", "建筑", "神话", "艺术", "哲学", "医学",
    "科技", "饮食", "服饰",
}

ALLOWED_AI_FILL_FIELDS = {"history", "influence", "faq"}


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
    # 字段标准化（DB / 静态数据统一返回结构）
    # ------------------------------------------------------------------
    @staticmethod
    def _normalize(article: dict) -> dict:
        """统一字段名 + 默认值（前端可按契约直接消费）"""
        if "content" in article and "body" not in article:
            article["body"] = article.pop("content")
        # 默认值
        article.setdefault("body", "")
        article.setdefault("body_extended", article.get("body", ""))
        article.setdefault("excerpt", "")
        article.setdefault("source", "")
        article.setdefault("history", "")
        article.setdefault("influence", "")
        article.setdefault("era", "")
        article.setdefault("dynasty", "")
        article.setdefault("region", "")
        article.setdefault("tags", [])
        article.setdefault("favorites", 0)
        article.setdefault("author", "溯光编辑部")
        article.setdefault("related_people", [])
        article.setdefault("related_books", [])
        article.setdefault("related_events", [])
        article.setdefault("related_poems", [])
        article.setdefault("related_articles", [])
        article.setdefault("faq", [])
        article.setdefault("cover", None)
        return article

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

        client = await self._get_client()
        if client is not None:
            try:
                return await self._list_from_supabase(client, category, keyword, limit, offset)
            except Exception:
                pass

        return self._list_from_static(category, keyword, limit, offset)

    async def _list_from_supabase(
        self, client, category, keyword, limit, offset
    ) -> Tuple[int, List[dict]]:
        base_select = "id,title,category,excerpt,cover,favorites,author,created_at"

        if keyword:
            MAX_SEARCH = max(1000, offset + limit)
            q = client.table("knowledge_articles").select(base_select)
            if category:
                q = q.eq("category", category)
            q = q.order("created_at", desc=True)
            result = await q.range(0, MAX_SEARCH - 1).execute()
            rows = result.data or []

            k = keyword.lower().strip()
            filtered = [
                r for r in rows
                if k in (r.get("title") or "").lower()
                or k in (r.get("excerpt") or "").lower()
            ]
            total = len(filtered)
            items = filtered[offset: offset + limit]
            return total, items

        query = client.table("knowledge_articles").select(base_select)
        if category:
            query = query.eq("category", category)
        query = query.order("created_at", desc=True)

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
                a for a in articles
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
                "excerpt": a.get("excerpt", ""),
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

        article = self._normalize(result.data[0])

        # 相关推荐（同分类其他条目，最多 6 条）
        related_result = (
            await client.table("knowledge_articles")
            .select("id,title,category,excerpt,cover")
            .eq("category", article["category"])
            .neq("id", article_id)
            .limit(6)
            .execute()
        )
        article["related"] = related_result.data or []
        return article

    def _get_article_static(self, article_id: str) -> Optional[dict]:
        articles = self._load_all()
        for a in articles:
            if a["id"] == article_id:
                result = self._normalize(dict(a))
                result["related"] = [
                    {
                        "id": r["id"],
                        "title": r["title"],
                        "category": r.get("category", ""),
                        "excerpt": r.get("excerpt", ""),
                        "cover": r.get("cover"),
                    }
                    for r in articles
                    if r["id"] != article_id and r.get("category") == a.get("category")
                ][:6]
                return result
        return None

    # ------------------------------------------------------------------
    # 统计
    # ------------------------------------------------------------------
    async def stats(self) -> dict:
        articles = self._load_all()
        client = await self._get_client()

        by_category: dict = {}
        by_dynasty: dict = {}

        if client is not None:
            try:
                result = await client.table("knowledge_articles").select("category,dynasty").execute()
                rows = result.data or []
                for r in rows:
                    cat = r.get("category") or "未分类"
                    by_category[cat] = by_category.get(cat, 0) + 1
                    dy = r.get("dynasty") or ""
                    if dy:
                        by_dynasty[dy] = by_dynasty.get(dy, 0) + 1
                return {"total": sum(by_category.values()), "by_category": by_category, "by_dynasty": by_dynasty}
            except Exception:
                pass

        for a in articles:
            cat = a.get("category", "未分类")
            by_category[cat] = by_category.get(cat, 0) + 1
            dy = a.get("dynasty", "")
            if dy:
                by_dynasty[dy] = by_dynasty.get(dy, 0) + 1

        return {
            "total": len(articles),
            "by_category": by_category,
            "by_dynasty": by_dynasty,
        }

    # ------------------------------------------------------------------
    # AI 懒加载补全（history/influence/faq）
    # ------------------------------------------------------------------
    async def ai_fill(self, article_id: str, fields: List[str]) -> dict:
        if not fields:
            raise ArticleServiceError("至少传 1 个字段", code="INVALID_FIELD")
        invalid = [f for f in fields if f not in ALLOWED_AI_FILL_FIELDS]
        if invalid:
            raise ArticleServiceError(
                f"不支持的字段: {invalid}，只允许 {ALLOWED_AI_FILL_FIELDS}",
                code="INVALID_FIELD",
            )

        article = await self.get_article(article_id)
        if article is None:
            raise ArticleServiceError("ARTICLE_NOT_FOUND", code="ARTICLE_NOT_FOUND", status_code=404)

        filled: dict = {}
        status: dict = {}
        tokens_used = 0
        cached = False

        # 1) 先看是否已存在
        for f in fields:
            existing = article.get(f, "")
            if f == "faq":
                if isinstance(existing, list) and len(existing) > 0:
                    filled[f] = existing
                    status[f] = "ready"
            elif existing:
                filled[f] = existing
                status[f] = "ready"

        missing = [f for f in fields if status.get(f) != "ready"]

        if not missing:
            return {
                "article_id": article_id,
                "filled": filled,
                "status": status,
                "cached": True,
                "tokens_used": 0,
            }

        # 2) 调用 LLM
        llm = self._get_llm_provider()
        if llm is None:
            raise ArticleServiceError(
                "LLM 未配置，请先设置 BAILIAN_API_KEY",
                code="LLM_UNAVAILABLE",
                status_code=503,
            )

        for f in missing:
            try:
                content, tokens = await self._llm_fill(article, f, llm)
                filled[f] = content
                status[f] = "ready"
                tokens_used += tokens
            except Exception as exc:
                status[f] = f"error: {str(exc)[:100]}"
                filled[f] = article.get(f, "")

        return {
            "article_id": article_id,
            "filled": filled,
            "status": status,
            "cached": False,
            "tokens_used": tokens_used,
        }

    def _get_llm_provider(self):
        api_key = getattr(settings, "BAILIAN_API_KEY", None) or getattr(settings, "OPENAI_API_KEY", None)
        base_url = getattr(settings, "BAILIAN_BASE_URL", None) or getattr(settings, "OPENAI_BASE_URL", None) or "https://dashscope.aliyuncs.com/compatible-mode/v1"
        model = getattr(settings, "BAILIAN_MODEL", None) or "qwen-turbo"

        if not api_key:
            return None

        try:
            from openai import AsyncOpenAI
        except ImportError:
            return None

        return AsyncOpenAI(api_key=api_key, base_url=base_url), model

    async def _llm_fill(self, article: dict, field: str, provider) -> Tuple[object, int]:
        client, model = provider
        title = article.get("title", "")
        cat = article.get("category", "")
        excerpt = article.get("excerpt", "")
        body = (article.get("body") or "")[:300]

        prompts = {
            "history": f"请为以下中华文化条目撰写一段 200-400 字的「历史背景」，语言典雅、可引用古籍（《XX》·作者），可作为知识库长文使用。\n\n标题：{title}\n分类：{cat}\n简介：{excerpt}\n原文片段：{body}\n\n要求：\n1. 起源+演变+关键节点+重要典籍/人物引用\n2. 不使用 Markdown 标题（不写##），用流畅的散文体\n3. 末尾引用 1-2 部典籍来源（用《书名》·作者 格式）",
            "influence": f"请为以下中华文化条目撰写一段 200-300 字的「现代解读」，包含：1）总论（100 字内）；2）3 条「现代应用/价值」短句；3）2 条「当代视角」短句。\n\n标题：{title}\n分类：{cat}\n简介：{excerpt}\n\n请用 JSON 严格返回，格式：\n{{\"summary\":\"...\",\"applications\":[\"...\",\"...\",\"...\"],\"perspectives\":[\"...\",\"...\"]}}",
            "faq": f"请为以下中华文化条目生成 3-5 个「常见问题」，要求贴近大众兴趣、有教育意义。\n\n标题：{title}\n分类：{cat}\n简介：{excerpt}\n\n请用 JSON 严格返回，格式：\n[{{\"question\":\"...\",\"answer\":\"...\"}}, ...]\n\nanswer 控制在 60-120 字。",
        }

        try:
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "你是溯光 Aetherlight 的中华文化编辑。"},
                    {"role": "user", "content": prompts[field]},
                ],
                temperature=0.7,
                max_tokens=800 if field != "faq" else 1000,
            )
            text = response.choices[0].message.content.strip()
            tokens = response.usage.total_tokens if response.usage else 0

            if field == "faq":
                import re
                m = re.search(r"\[.*\]", text, re.S)
                content = json.loads(m.group()) if m else []
            elif field == "influence":
                import re
                m = re.search(r"\{.*\}", text, re.S)
                content = json.loads(m.group()) if m else {"summary": text, "applications": [], "perspectives": []}
            else:
                content = text

            return content, tokens
        except Exception:
            return article.get(field, ""), 0

    # ------------------------------------------------------------------
    # 收藏
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

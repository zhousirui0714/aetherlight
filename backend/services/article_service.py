"""
知识条目服务 v3。
- 10 顶级分类 (figures/poems/classics/festivals/mythology/intangible/artifacts/lifestyle/philosophy/technology)
- 2 级子类 (sub_category) + 3 级标签 (tags)
- 全文/翻译/注释 (full_text/full_text_lang)
- 知识图谱关联 (knowledge_relations)
- AI 懒加载补全 (history/influence/faq/translation/annotation)

优先使用 Supabase 数据库，不可用时降级为静态 JSON 文件 (knowledge_articles_v3.json)。
"""
import json
import os
from typing import List, Optional, Tuple

from config import settings

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
ARTICLES_FILE = os.path.join(DATA_DIR, "knowledge_articles_v3.json")

# v3 顶级分类 (英文 key)
ALLOWED_CATEGORIES = {
    "figures", "poems", "classics", "festivals", "mythology",
    "intangible", "artifacts", "lifestyle", "philosophy", "technology",
}

# 分类中文名映射 (前端展示用)
CATEGORY_CN = {
    "figures":    "人物",
    "poems":      "诗词文章",
    "classics":   "典籍经典",
    "festivals":  "节日节气",
    "mythology":  "神话传说",
    "intangible": "非遗艺术",
    "artifacts":  "建筑器物",
    "lifestyle":  "饮食服饰",
    "philosophy": "思想智慧",
    "technology": "古代科技",
}

# 顶级分类默认子类映射 (前端三段式分类用)
CATEGORY_SUB_CATEGORIES = {
    "figures":    ["帝王将相", "文人墨客", "思想家", "科学家", "艺术家", "民族英雄"],
    "poems":      ["诗经楚辞", "唐诗", "宋词", "元曲", "散文", "赋", "骈文"],
    "classics":   ["经部", "史部", "子部", "集部", "蒙学", "医典", "兵法"],
    "festivals":  ["传统节日", "节气", "祭祀日", "纪念日"],
    "mythology":  ["创世神话", "神仙体系", "民间传说", "志怪故事"],
    "intangible": ["传统戏曲", "民间美术", "传统技艺", "民俗节庆", "曲艺杂技"],
    "artifacts":  ["宫殿", "园林", "陵墓", "桥梁", "塔寺", "器物", "家具"],
    "lifestyle":  ["茶文化", "酒文化", "食文化", "丝绸", "服饰", "妆容", "古代家具"],
    "philosophy": ["儒家", "道家", "法家", "墨家", "阴阳", "禅宗", "兵家"],
    "technology": ["天文历法", "农学", "医学", "数学", "四大发明", "水利", "营造"],
}

ALLOWED_AI_FILL_FIELDS = {"history", "influence", "faq", "translation", "annotation"}


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
    # Supabase 连接
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
    # 静态数据
    # ------------------------------------------------------------------
    def _load_all(self) -> List[dict]:
        if not os.path.exists(ARTICLES_FILE):
            return []
        with open(ARTICLES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)

    # ------------------------------------------------------------------
    # 字段归一化
    # ------------------------------------------------------------------
    @staticmethod
    def _normalize(article: dict) -> dict:
        if "content" in article and "body" not in article:
            article["body"] = article.pop("content")
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
        article.setdefault("cover_url", None)
        article.setdefault("sub_category", "")
        article.setdefault("full_text", None)
        article.setdefault("full_text_lang", "classical")
        article.setdefault("view_count", 0)
        article.setdefault("sort_weight", 0)
        return article

    # ------------------------------------------------------------------
    # 列表
    # ------------------------------------------------------------------
    async def list_articles(
        self,
        category: Optional[str] = None,
        sub_category: Optional[str] = None,
        tag: Optional[str] = None,
        keyword: Optional[str] = None,
        limit: int = 12,
        offset: int = 0,
    ) -> Tuple[int, List[dict]]:
        if category and category not in ALLOWED_CATEGORIES:
            raise ArticleServiceError(
                f"category must be one of {sorted(ALLOWED_CATEGORIES)}",
                code="INVALID_CATEGORY",
            )

        client = await self._get_client()
        if client is not None:
            try:
                return await self._list_from_supabase(
                    client, category, sub_category, tag, keyword, limit, offset
                )
            except Exception:
                pass

        return self._list_from_static(category, sub_category, tag, keyword, limit, offset)

    async def _list_from_supabase(
        self, client, category, sub_category, tag, keyword, limit, offset
    ) -> Tuple[int, List[dict]]:
        base_select = "id,title,category,sub_category,tags,excerpt,cover,cover_url,favorites,author,sort_weight,view_count,created_at"

        # 关键词搜索: 拉所有后过滤
        if keyword:
            q = client.table("knowledge_articles").select(base_select)
            if category:
                q = q.eq("category", category)
            if sub_category:
                q = q.eq("sub_category", sub_category)
            if tag:
                q = q.contains("tags", [tag])
            q = q.order("sort_weight", desc=True).order("created_at", desc=True)
            result = await q.range(0, 2000).execute()
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

        # 普通分页
        query = client.table("knowledge_articles").select(base_select)
        if category:
            query = query.eq("category", category)
        if sub_category:
            query = query.eq("sub_category", sub_category)
        if tag:
            query = query.contains("tags", [tag])
        query = query.order("sort_weight", desc=True).order("created_at", desc=True)

        count_query = client.table("knowledge_articles").select("id", count="exact")
        if category:
            count_query = count_query.eq("category", category)
        if sub_category:
            count_query = count_query.eq("sub_category", sub_category)
        if tag:
            count_query = count_query.contains("tags", [tag])
        count_result = await count_query.execute()
        total = count_result.count or 0

        result = await query.range(offset, offset + limit - 1).execute()
        items = result.data or []
        return total, items

    def _list_from_static(
        self, category, sub_category, tag, keyword, limit, offset
    ) -> Tuple[int, List[dict]]:
        articles = self._load_all()
        if category:
            articles = [a for a in articles if a.get("category") == category]
        if sub_category:
            articles = [a for a in articles if a.get("sub_category") == sub_category]
        if tag:
            articles = [a for a in articles if tag in (a.get("tags") or [])]
        if keyword:
            k = keyword.lower().strip()
            articles = [
                a for a in articles
                if k in (a.get("title") or "").lower()
                or k in (a.get("excerpt") or "").lower()
            ]

        articles.sort(key=lambda a: (-(a.get("sort_weight", 0) or 0), a.get("created_at", "")), reverse=False)
        total = len(articles)
        items = articles[offset: offset + limit]

        mapped = []
        for a in items:
            mapped.append({
                "id": a["id"],
                "title": a["title"],
                "category": a.get("category", ""),
                "sub_category": a.get("sub_category", ""),
                "tags": a.get("tags", []),
                "excerpt": a.get("excerpt", ""),
                "cover": a.get("cover"),
                "cover_url": a.get("cover_url"),
                "favorites": a.get("favorites", 0),
                "author": a.get("author", "溯光编辑部"),
                "sort_weight": a.get("sort_weight", 0),
                "view_count": a.get("view_count", 0),
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

        # 相关推荐（同分类 + 排除自己, 最多 6 条）
        related_result = (
            await client.table("knowledge_articles")
            .select("id,title,category,sub_category,excerpt,cover,cover_url")
            .eq("category", article["category"])
            .neq("id", article_id)
            .order("sort_weight", desc=True)
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
                        "sub_category": r.get("sub_category", ""),
                        "excerpt": r.get("excerpt", ""),
                        "cover": r.get("cover"),
                        "cover_url": r.get("cover_url"),
                    }
                    for r in articles
                    if r["id"] != article_id and r.get("category") == a.get("category")
                ][:6]
                return result
        return None

    # ------------------------------------------------------------------
    # 分类树
    # ------------------------------------------------------------------
    async def get_categories(self) -> List[dict]:
        """返回 10 顶级分类 + 子类 + 每个子类下的条目数"""
        client = await self._get_client()
        if client is not None:
            try:
                result = await client.table("knowledge_articles").select("category,sub_category,id").execute()
                rows = result.data or []
            except Exception:
                rows = []
        else:
            rows = [{"category": a.get("category"), "sub_category": a.get("sub_category"), "id": a.get("id")} for a in self._load_all()]

        # 聚合
        cat_data: dict = {}
        for r in rows:
            cat = r.get("category") or "未分类"
            sub = r.get("sub_category") or ""
            if cat not in cat_data:
                cat_data[cat] = {"id": cat, "name_cn": CATEGORY_CN.get(cat, cat), "total": 0, "sub_categories": {}}
            cat_data[cat]["total"] += 1
            if sub:
                if sub not in cat_data[cat]["sub_categories"]:
                    cat_data[cat]["sub_categories"][sub] = 0
                cat_data[cat]["sub_categories"][sub] += 1

        # 合并默认子类 (即使没数据也展示)
        out: List[dict] = []
        for cat_key in ["figures", "poems", "classics", "festivals", "mythology", "intangible", "artifacts", "lifestyle", "philosophy", "technology"]:
            if cat_key in cat_data:
                subs_default = CATEGORY_SUB_CATEGORIES.get(cat_key, [])
                subs_data = cat_data[cat_key]["sub_categories"]
                sub_list = []
                for sn in subs_default:
                    sub_list.append({"name": sn, "count": subs_data.get(sn, 0)})
                for sn, cnt in subs_data.items():
                    if sn not in subs_default:
                        sub_list.append({"name": sn, "count": cnt})
                out.append({
                    "id": cat_key,
                    "name_cn": CATEGORY_CN[cat_key],
                    "total": cat_data[cat_key]["total"],
                    "sub_categories": sub_list,
                })
            else:
                out.append({
                    "id": cat_key,
                    "name_cn": CATEGORY_CN[cat_key],
                    "total": 0,
                    "sub_categories": [{"name": sn, "count": 0} for sn in CATEGORY_SUB_CATEGORIES.get(cat_key, [])],
                })
        return out

    # ------------------------------------------------------------------
    # 标签
    # ------------------------------------------------------------------
    async def get_tags(self, category: Optional[str] = None) -> List[dict]:
        """返回所有标签 + 每个标签出现次数"""
        client = await self._get_client()
        if client is not None:
            try:
                q = client.table("knowledge_articles").select("tags")
                if category:
                    q = q.eq("category", category)
                result = await q.execute()
                rows = result.data or []
            except Exception:
                rows = []
        else:
            rows = [{"tags": a.get("tags", [])} for a in self._load_all()]

        tag_count: dict = {}
        for r in rows:
            for t in r.get("tags") or []:
                tag_count[t] = tag_count.get(t, 0) + 1
        sorted_tags = sorted(tag_count.items(), key=lambda x: -x[1])
        return [{"tag": t, "count": c} for t, c in sorted_tags]

    # ------------------------------------------------------------------
    # 知识图谱
    # ------------------------------------------------------------------
    async def get_relations(self, article_id: str, depth: int = 1) -> dict:
        """返回某条目的关联图 (nodes + edges)

        depth=1: 直接关联
        depth=2: 二次关联 (推荐用于力导向图)
        """
        client = await self._get_client()
        if client is not None:
            try:
                # 1) 拉出 from=id 的关联
                result_from = (
                    await client.table("knowledge_relations")
                    .select("from_article_id,to_article_id,relation_type,weight,description")
                    .eq("from_article_id", article_id)
                    .execute()
                )
                # 2) 拉出 to=id 的关联
                result_to = (
                    await client.table("knowledge_relations")
                    .select("from_article_id,to_article_id,relation_type,weight,description")
                    .eq("to_article_id", article_id)
                    .execute()
                )
                rels = (result_from.data or []) + (result_to.data or [])
            except Exception:
                rels = []
        else:
            # 静态 fallback: relations_v3.json
            REL_FILE = os.path.join(DATA_DIR, "knowledge_relations_v3.json")
            if os.path.exists(REL_FILE):
                with open(REL_FILE, "r", encoding="utf-8") as f:
                    all_rels = json.load(f)
                rels = [
                    {
                        "from_article_id": r["from_id"],
                        "to_article_id": r["to_id"],
                        "relation_type": r["relation_type"],
                        "weight": r.get("weight", 1),
                        "description": r.get("description", ""),
                    }
                    for r in all_rels
                    if r.get("from_id") == article_id or r.get("to_id") == article_id
                ]
            else:
                rels = []

        # 收集相关 ID
        related_ids = set()
        for r in rels:
            related_ids.add(r["from_article_id"])
            related_ids.add(r["to_article_id"])
        related_ids.discard(article_id)

        # 拉出相关条目基本信息
        article_map = {article_id: {"id": article_id}}
        if related_ids:
            if client is not None:
                try:
                    result = (
                        await client.table("knowledge_articles")
                        .select("id,title,category,excerpt,cover,cover_url")
                        .in_("id", list(related_ids))
                        .execute()
                    )
                    for a in (result.data or []):
                        article_map[a["id"]] = a
                except Exception:
                    pass
            else:
                for a in self._load_all():
                    if a.get("id") in related_ids:
                        article_map[a["id"]] = {
                            "id": a["id"],
                            "title": a["title"],
                            "category": a.get("category", ""),
                            "excerpt": a.get("excerpt", ""),
                            "cover": a.get("cover"),
                            "cover_url": a.get("cover_url"),
                        }

        # 构造 nodes/edges
        nodes = []
        for nid in related_ids:
            if nid in article_map and nid != article_id:
                info = article_map[nid]
                nodes.append({
                    "id": nid,
                    "title": info.get("title", ""),
                    "category": info.get("category", ""),
                    "excerpt": info.get("excerpt", ""),
                    "cover": info.get("cover"),
                    "cover_url": info.get("cover_url"),
                })

        edges = []
        for r in rels:
            other = r["to_article_id"] if r["from_article_id"] == article_id else r["from_article_id"]
            edges.append({
                "source": r["from_article_id"],
                "target": r["to_article_id"],
                "type": r["relation_type"],
                "weight": r.get("weight", 1),
                "description": r.get("description", ""),
            })

        # 中心节点
        center_article = await self.get_article(article_id)
        center = None
        if center_article:
            center = {
                "id": center_article["id"],
                "title": center_article.get("title", ""),
                "category": center_article.get("category", ""),
                "excerpt": center_article.get("excerpt", ""),
                "cover": center_article.get("cover"),
                "cover_url": center_article.get("cover_url"),
            }

        return {"center": center, "nodes": nodes, "edges": edges}

    # ------------------------------------------------------------------
    # 统计
    # ------------------------------------------------------------------
    async def stats(self) -> dict:
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

        for a in self._load_all():
            cat = a.get("category", "未分类")
            by_category[cat] = by_category.get(cat, 0) + 1
            dy = a.get("dynasty", "")
            if dy:
                by_dynasty[dy] = by_dynasty.get(dy, 0) + 1

        return {
            "total": sum(by_category.values()),
            "by_category": by_category,
            "by_dynasty": by_dynasty,
        }

    # ------------------------------------------------------------------
    # AI 懒加载补全 (history/influence/faq/translation/annotation)
    # ------------------------------------------------------------------
    async def ai_fill(self, article_id: str, fields: List[str]) -> dict:
        if not fields:
            raise ArticleServiceError("至少传 1 个字段", code="INVALID_FIELD")
        invalid = [f for f in fields if f not in ALLOWED_AI_FILL_FIELDS]
        if invalid:
            raise ArticleServiceError(
                f"不支持的字段: {invalid}，只允许 {sorted(ALLOWED_AI_FILL_FIELDS)}",
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
        full_text = article.get("full_text") or ""

        prompts = {
            "history": f"请为以下中华文化条目撰写一段 200-400 字的「历史背景」，语言典雅、可引用古籍（《XX》·作者）。\n\n标题：{title}\n分类：{cat}\n简介：{excerpt}\n原文片段：{body}\n\n要求：\n1. 起源+演变+关键节点+重要典籍/人物引用\n2. 不使用 Markdown 标题（不写##），用流畅的散文体\n3. 末尾引用 1-2 部典籍来源（用《书名》·作者 格式）",
            "influence": f"请为以下中华文化条目撰写一段 200-300 字的「现代解读」，包含：1）总论（100 字内）；2）3 条「现代应用/价值」短句；3）2 条「当代视角」短句。\n\n标题：{title}\n分类：{cat}\n简介：{excerpt}\n\n请用 JSON 严格返回，格式：\n{{\"summary\":\"...\",\"applications\":[\"...\",\"...\",\"...\"],\"perspectives\":[\"...\",\"...\"]}}",
            "faq": f"请为以下中华文化条目生成 3-5 个「常见问题」，要求贴近大众兴趣、有教育意义。\n\n标题：{title}\n分类：{cat}\n简介：{excerpt}\n\n请用 JSON 严格返回，格式：\n[{{\"question\":\"...\",\"answer\":\"...\"}}, ...]\n\nanswer 控制在 60-120 字。",
            "translation": f"请将以下文言文/古诗词翻译成现代白话文，要求：\n1. 逐句翻译，保留原诗节奏\n2. 关键典故用括号说明\n3. 末尾附'整体意境'说明（50字）\n\n标题：{title}\n原文：\n{full_text or body}\n\n请用 JSON 严格返回，格式：\n{{\"verse_by_verse\":[{{\"original\":\"...\",\"modern\":\"...\"}}],\"overall\":\"...\"}}",
            "annotation": f"请为以下文言文/古诗词生成关键词注释，要求：\n1. 挑选 8-15 个关键文言词/典故/地名/人物\n2. 给出'原词'/'解释'/'出处'三栏\n3. 适合初学者阅读\n\n标题：{title}\n原文：\n{full_text or body}\n\n请用 JSON 严格返回，格式：\n[{{\"term\":\"...\",\"meaning\":\"...\",\"source\":\"...\"}}, ...]",
        }

        try:
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "你是溯光 Aetherlight 的中华文化编辑。"},
                    {"role": "user", "content": prompts[field]},
                ],
                temperature=0.7,
                max_tokens=800 if field in ("history", "translation", "annotation") else 1000,
            )
            text = response.choices[0].message.content.strip()
            tokens = response.usage.total_tokens if response.usage else 0

            import re
            if field == "faq":
                m = re.search(r"\[.*\]", text, re.S)
                content = json.loads(m.group()) if m else []
            elif field == "influence":
                m = re.search(r"\{.*\}", text, re.S)
                content = json.loads(m.group()) if m else {"summary": text, "applications": [], "perspectives": []}
            elif field in ("translation", "annotation"):
                m = re.search(r"[\[{].*[\]}]", text, re.S)
                content = json.loads(m.group()) if m else text
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
            raise ArticleServiceError("ARTICLE_NOT_FOUND", code="ARTICLE_NOT_FOUND", status_code=404)
        fav_result = (
            await client.table("article_favorites")
            .select("id")
            .eq("article_id", article_id)
            .eq("user_id", user_id)
            .execute()
        )
        current_favorites = article_result.data[0].get("favorites", 0)
        if fav_result.data:
            await client.table("article_favorites").delete().eq("id", fav_result.data[0]["id"]).execute()
            new_count = max(0, current_favorites - 1)
            is_favorited = False
        else:
            await client.table("article_favorites").insert({"article_id": article_id, "user_id": user_id}).execute()
            new_count = current_favorites + 1
            is_favorited = True
        await client.table("knowledge_articles").update({"favorites": new_count}).eq("id", article_id).execute()
        return {
            "article_id": article_id,
            "is_favorited": is_favorited,
            "favorites_count": new_count,
        }

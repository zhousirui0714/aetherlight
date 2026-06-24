from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from services.article_service import ArticleService, ArticleServiceError
from services.auth_service import get_current_user

router = APIRouter()
service = ArticleService()


# ---------- Pydantic 模型 ----------

class ArticleListItem(BaseModel):
    id: str
    title: str
    category: str
    sub_category: Optional[str] = ""
    tags: List[str] = Field(default_factory=list)
    excerpt: str
    cover: Optional[str] = None
    cover_url: Optional[str] = None
    favorites: int
    author: str
    sort_weight: int = 0
    view_count: int = 0
    created_at: str


class ArticleListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: List[ArticleListItem]


class RelatedItem(BaseModel):
    id: str
    title: str
    category: Optional[str] = None
    sub_category: Optional[str] = ""
    brief: Optional[str] = None
    external: bool = False
    externalUrl: Optional[str] = None


class FAQItem(BaseModel):
    question: str
    answer: str
    link: Optional[str] = None


class RelatedArticle(BaseModel):
    id: str
    title: str
    category: str
    sub_category: Optional[str] = ""


class ArticleDetailResponse(BaseModel):
    id: str
    title: str
    category: str
    sub_category: str = ""
    cover: Optional[str] = None
    cover_url: Optional[str] = None
    excerpt: str
    body: str
    body_extended: str = ""
    full_text: Optional[str] = None
    full_text_lang: str = "classical"
    source: str = ""
    history: str = ""
    influence: str = ""
    author: str
    era: str = ""
    dynasty: str = ""
    region: str = ""
    tags: List[str] = Field(default_factory=list)
    favorites: int
    view_count: int = 0
    sort_weight: int = 0
    related_people: List[RelatedItem] = Field(default_factory=list)
    related_books: List[RelatedItem] = Field(default_factory=list)
    related_events: List[RelatedItem] = Field(default_factory=list)
    related_poems: List[RelatedItem] = Field(default_factory=list)
    related_articles: List[RelatedItem] = Field(default_factory=list)
    faq: List[FAQItem] = Field(default_factory=list)
    related: List["RelatedArticle"] = Field(default_factory=list)
    created_at: str


ArticleDetailResponse.model_rebuild()


# ---------- 分类/标签/图谱 ----------

class SubCategoryItem(BaseModel):
    name: str
    count: int


class CategoryItem(BaseModel):
    id: str
    name_cn: str
    total: int
    sub_categories: List[SubCategoryItem]


class TagItem(BaseModel):
    tag: str
    count: int


class GraphNode(BaseModel):
    id: str
    title: str
    category: Optional[str] = ""
    excerpt: Optional[str] = ""
    cover: Optional[str] = None
    cover_url: Optional[str] = None


class GraphEdge(BaseModel):
    source: str
    target: str
    type: str
    weight: int = 1
    description: str = ""


class GraphResponse(BaseModel):
    center: Optional[GraphNode] = None
    nodes: List[GraphNode] = Field(default_factory=list)
    edges: List[GraphEdge] = Field(default_factory=list)


class FavoriteResponse(BaseModel):
    article_id: str
    is_favorited: bool
    favorites_count: int


# ---------- AI 补全 ----------

class AIFillRequest(BaseModel):
    fields: List[str] = Field(..., description="要补全的字段: history / influence / faq / translation / annotation")


class AIFillResponse(BaseModel):
    article_id: str
    filled: dict
    status: dict
    cached: bool = False
    tokens_used: int = 0


class ArticleStatsResponse(BaseModel):
    total: int
    by_category: dict
    by_dynasty: dict = Field(default_factory=dict)


# ---------- 路由 ----------

@router.get(
    "/articles/stats",
    response_model=ArticleStatsResponse,
    summary="知识条目统计",
)
async def article_stats():
    try:
        return await service.stats()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get(
    "/articles/categories",
    response_model=List[CategoryItem],
    summary="获取分类树 (10 顶级 + 子类 + 条目数)",
)
async def list_categories():
    try:
        return await service.get_categories()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get(
    "/articles/tags",
    response_model=List[TagItem],
    summary="获取标签列表",
)
async def list_tags(
    category: Optional[str] = Query(None, description="可选: 按分类过滤"),
    limit: int = Query(100, ge=1, le=500),
):
    try:
        tags = await service.get_tags(category=category)
        return tags[:limit]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get(
    "/articles",
    response_model=ArticleListResponse,
    summary="获取知识条目列表",
    description="支持分类/子类/标签筛选、关键词搜索、分页。",
)
async def list_articles(
    category: Optional[str] = Query(
        None,
        description="分类: figures / poems / classics / festivals / mythology / intangible / artifacts / lifestyle / philosophy / technology",
    ),
    sub_category: Optional[str] = Query(None, description="子类 (如: 唐诗/茶文化)"),
    tag: Optional[str] = Query(None, description="标签 (单选)"),
    keyword: Optional[str] = Query(None, description="关键词（搜索标题和摘要）"),
    limit: int = Query(12, ge=1, le=50),
    offset: int = Query(0, ge=0),
):
    try:
        total, items = await service.list_articles(
            category=category,
            sub_category=sub_category,
            tag=tag,
            keyword=keyword,
            limit=limit,
            offset=offset,
        )
    except ArticleServiceError as exc:
        raise HTTPException(status_code=400, detail=exc.message)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return ArticleListResponse(total=total, limit=limit, offset=offset, items=items)


@router.get(
    "/articles/{article_id}",
    response_model=ArticleDetailResponse,
    summary="获取知识条目详情",
)
async def get_article(article_id: str):
    try:
        article = await service.get_article(article_id)
    except ArticleServiceError as exc:
        raise HTTPException(status_code=404, detail=exc.message)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    if article is None:
        raise HTTPException(status_code=404, detail="ARTICLE_NOT_FOUND")

    return article


@router.get(
    "/articles/{article_id}/relations",
    response_model=GraphResponse,
    summary="获取知识图谱 (某条目的关联节点/边)",
)
async def get_article_relations(article_id: str):
    try:
        return await service.get_relations(article_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post(
    "/articles/{article_id}/ai-fill",
    response_model=AIFillResponse,
    summary="AI 懒加载补全 (history/influence/faq/translation/annotation)",
)
async def ai_fill_article(article_id: str, body: AIFillRequest):
    try:
        return await service.ai_fill(article_id=article_id, fields=body.fields)
    except ArticleServiceError as exc:
        code = exc.code
        if code == "ARTICLE_NOT_FOUND":
            raise HTTPException(status_code=404, detail=exc.message)
        if code == "INVALID_FIELD":
            raise HTTPException(status_code=400, detail=exc.message)
        if code == "LLM_UNAVAILABLE":
            raise HTTPException(status_code=503, detail=exc.message)
        raise HTTPException(status_code=400, detail=exc.message)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post(
    "/articles/{article_id}/favorite",
    response_model=FavoriteResponse,
    summary="收藏或取消收藏条目（需登录）",
)
async def toggle_favorite(
    article_id: str,
    current_user: dict = Depends(get_current_user),
):
    try:
        result = await service.toggle_favorite(
            article_id=article_id,
            user_id=current_user["id"],
        )
    except ArticleServiceError as exc:
        if exc.code == "UNAUTHORIZED":
            raise HTTPException(status_code=401, detail=exc.message)
        raise HTTPException(status_code=404, detail=exc.message)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return result

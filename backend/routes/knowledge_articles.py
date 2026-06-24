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
    excerpt: str
    cover: Optional[str] = None
    favorites: int
    author: str
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
    brief: Optional[str] = None
    external: bool = False
    externalUrl: Optional[str] = None


class FAQItem(BaseModel):
    question: str
    answer: str
    link: Optional[str] = None


class ArticleDetailResponse(BaseModel):
    id: str
    title: str
    category: str
    cover: Optional[str] = None
    excerpt: str
    body: str
    body_extended: str = ""
    source: str = ""
    history: str = ""
    influence: str = ""
    author: str
    era: str = ""
    dynasty: str = ""
    region: str = ""
    tags: List[str] = Field(default_factory=list)
    favorites: int
    related_people: List[RelatedItem] = Field(default_factory=list)
    related_books: List[RelatedItem] = Field(default_factory=list)
    related_events: List[RelatedItem] = Field(default_factory=list)
    related_poems: List[RelatedItem] = Field(default_factory=list)
    related_articles: List[RelatedItem] = Field(default_factory=list)
    faq: List[FAQItem] = Field(default_factory=list)
    related: List["RelatedArticle"] = Field(default_factory=list)
    created_at: str


class RelatedArticle(BaseModel):
    id: str
    title: str
    category: str


ArticleDetailResponse.model_rebuild()


class FavoriteResponse(BaseModel):
    article_id: str
    is_favorited: bool
    favorites_count: int


# ---------- AI 补全 ----------

class AIFillRequest(BaseModel):
    fields: List[str] = Field(..., description="要补全的字段: history / influence / faq")


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
    "/articles",
    response_model=ArticleListResponse,
    summary="获取知识条目列表",
    description="支持分类筛选、关键词搜索、分页。",
)
async def list_articles(
    category: Optional[str] = Query(
        None,
        description="分类：节气 / 节日 / 诗词 / 典籍 / 非遗 / 民俗 / 人物 / 建筑 / 神话 / 艺术 / 哲学 / 医学 / 科技 / 饮食 / 服饰",
    ),
    keyword: Optional[str] = Query(None, description="关键词（搜索标题和摘要）"),
    limit: int = Query(12, ge=1, le=50),
    offset: int = Query(0, ge=0),
):
    try:
        total, items = await service.list_articles(
            category=category,
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


@router.post(
    "/articles/{article_id}/ai-fill",
    response_model=AIFillResponse,
    summary="AI 懒加载补全 history/influence/faq 字段",
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

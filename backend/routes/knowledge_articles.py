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


class RelatedArticle(BaseModel):
    id: str
    title: str
    category: str


class ArticleDetailResponse(BaseModel):
    id: str
    title: str
    category: str
    cover: Optional[str] = None
    body: str
    source: str = ""
    author: str
    tags: List[str] = Field(default_factory=list)
    favorites: int
    related: List[RelatedArticle] = Field(default_factory=list)
    created_at: str


class FavoriteResponse(BaseModel):
    article_id: str
    is_favorited: bool
    favorites_count: int


# ---------- 2-1：列表 ----------
@router.get(
    "/articles",
    response_model=ArticleListResponse,
    summary="获取知识条目列表",
    description="支持分类筛选、关键词搜索、分页。",
)
async def list_articles(
    category: Optional[str] = Query(
        None,
        description="分类：节气 / 节日 / 诗词 / 典籍 / 非遗 / 民俗 / 人物",
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


# ---------- 2-2：详情 ----------
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


# ---------- 2-3：收藏 / 取消收藏 ----------
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

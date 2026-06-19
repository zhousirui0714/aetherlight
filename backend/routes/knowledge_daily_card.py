from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from services.daily_card_service import (
    DailyCardService,
    DailyCardServiceError,
)

router = APIRouter()
service = DailyCardService()


# ---------- 请求/响应 Pydantic 模型 ----------
class RecommendedArticle(BaseModel):
    id: str
    title: str
    category: str


class DailyCardResponse(BaseModel):
    id: str
    date: str
    lunar_date: Optional[str] = None
    solar_term: Optional[str] = None
    festival: Optional[str] = None
    title: str
    subtitle: Optional[str] = None
    body: str
    image_style: Optional[str] = None
    weather_hint: Optional[str] = None
    theme_tags: List[str] = Field(default_factory=list)
    recommended_articles: List[RecommendedArticle] = Field(default_factory=list)
    generated_at: str
    source: str


class DailyCardHistoryItem(BaseModel):
    id: str
    date: str
    title: str
    theme_tags: List[str] = Field(default_factory=list)


class DailyCardHistoryResponse(BaseModel):
    total: int
    items: List[DailyCardHistoryItem]


# ---------- 接口 1-1：获取当日（或指定日期）文化卡片 ----------
@router.get(
    '/daily-card',
    response_model=DailyCardResponse,
    summary='获取当日文化卡片',
    description=(
        '返回指定日期（默认当日）的 AI 生成文化卡片。'
        '若当日已有缓存则直接返回，否则实时基于节气/节日上下文生成。'
    ),
)
async def get_daily_card(
    date_str: Optional[str] = Query(
        None,
        alias='date',
        description='指定日期 YYYY-MM-DD，不传则取当日',
    ),
    city: Optional[str] = Query(
        'default',
        description='用户所在城市，用于天气维度',
    ),
    format: str = Query(
        'full',
        description='返回格式 full/brief，默认 full',
    ),
):
    try:
        card = await service.get_or_generate(
            date_str=date_str,
            city=city,
            brief=(format == 'brief'),
        )
    except DailyCardServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    if card is None:
        raise HTTPException(status_code=503, detail='SERVICE_UNAVAILABLE')

    return card


# ---------- 接口 1-2：回看历史推送列表 ----------
@router.get(
    '/daily-card/history',
    response_model=DailyCardHistoryResponse,
    summary='回看历史推送列表',
    description='返回最近 N 天的历史推送卡片摘要列表。',
)
async def get_daily_card_history(
    limit: int = Query(30, ge=1, le=90),
    offset: int = Query(0, ge=0),
):
    try:
        total, items = await service.get_history(limit=limit, offset=offset)
    except DailyCardServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return DailyCardHistoryResponse(total=total, items=items)

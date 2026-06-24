from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from services.character_service import CharacterService
router = APIRouter()
svc = CharacterService()

class CharItem(BaseModel):
    id: str
    name: str
    title: str
    avatar: str
    dynasty: str
    style: str
    excerpt: str
    representative_works: List[str]
    is_active: bool

class CharListResp(BaseModel):
    total: int
    items: List[CharItem]

class Work(BaseModel):
    title: str
    excerpt: str
    source: str

class CharDetail(BaseModel):
    id: str
    name: str
    title: str
    avatar: str
    dynasty: str
    style: str
    bio: str
    birth_year: str
    death_year: str
    works: List[Work]
    famous_quotes: List[str]
    system_prompt_preview: str
    dialogue_count: int

@router.get("", response_model=CharListResp, summary="获取角色列表")
async def list_chars(
    dynasty: Optional[str]=Query(None),
    tag: Optional[str]=Query(None),
    keyword: Optional[str]=Query(None),
):
    total, items = svc.list_characters(dynasty=dynasty, tag=tag, keyword=keyword)
    return CharListResp(total=total, items=items)

@router.get("/{cid}", response_model=CharDetail, summary="获取角色详情")
async def get_char(cid: str):
    c = svc.get_character(cid)
    if not c: raise HTTPException(status_code=404, detail="CHARACTER_NOT_FOUND")
    return c

"""答题路由 — Quiz / Q&A questions"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

router = APIRouter()


class QuestionItem(BaseModel):
    id: str
    category: str
    type: str
    level: int
    question: str
    options: list = []
    created_at: str


class QuestionListResponse(BaseModel):
    total: int
    items: List[QuestionItem]


@router.get("/questions", response_model=QuestionListResponse, summary="获取题目列表")
async def list_questions(
    category: Optional[str] = Query(None),
    level: Optional[int] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0),
):
    # 返回空列表，让需要时再补充实现
    return QuestionListResponse(total=0, items=[])


@router.get("/questions/{qid}", summary="获取题目详情")
async def get_question(qid: str):
    raise HTTPException(status_code=404, detail="QUESTION_NOT_FOUND")


@router.post("/questions/{qid}/answer", summary="提交答案")
async def submit_answer(qid: str):
    raise HTTPException(status_code=404, detail="QUESTION_NOT_FOUND")

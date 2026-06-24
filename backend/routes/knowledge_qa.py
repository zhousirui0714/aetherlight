from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from services.qa_service import QAService, QAServiceError
from services.auth_service import get_current_user

router = APIRouter()
service = QAService()


class QAHistoryItem(BaseModel):
    id: str
    question: str
    answer_summary: str
    category: Optional[str] = None
    created_at: str


class QAHistoryResponse(BaseModel):
    total: int
    items: List[QAHistoryItem]


@router.post(
    "/ask",
    summary="知识问答（RAG + LLM，流式/非流式）",
)
async def ask_question(request: Request):
    stream = request.query_params.get("stream", "true").lower() != "false"
    body = await request.json()
    question: str = body.get("question", "").strip()
    category: Optional[str] = body.get("category")
    history: List[dict] = body.get("history", [])

    if not question:
        raise HTTPException(status_code=400, detail="question cannot be empty")
    if len(question) > 500:
        raise HTTPException(status_code=400, detail="question too long (max 500 chars)")

    if stream:
        from fastapi.responses import StreamingResponse
        return StreamingResponse(
            service.ask_stream(question, category, history),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )
    else:
        try:
            result = await service.ask_sync(question, category, history)
        except QAServiceError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.message)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc))
        return result


@router.get(
    "/history",
    response_model=QAHistoryResponse,
    summary="获取问答历史（需登录）",
)
async def get_qa_history(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    try:
        total, items = await service.get_history(
            user_id=current_user["id"], limit=limit, offset=offset,
        )
    except QAServiceError as exc:
        raise HTTPException(status_code=401, detail=exc.message)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return QAHistoryResponse(total=total, items=items)

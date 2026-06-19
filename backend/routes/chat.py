from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.auth_service import get_current_user
from services.chat_service import ChatService, ChatServiceError

router = APIRouter()
svc = ChatService()

class SessItem(BaseModel):
    session_id: str; character_id: str; last_message: str; updated_at: str

class SessListResp(BaseModel):
    total: int; items: List[SessItem]

class Msg(BaseModel):
    id: str; role: str; content: str; created_at: str

class SessMsgs(BaseModel):
    session_id: str; character_id: str; messages: List[Msg]; created_at: str

class ShareResp(BaseModel):
    share_id: str; session_id: str; character_id: str; messages: List[dict]; share_url: str

@router.post("/message", summary="发送消息（流式）")
async def send_message(request: Request):
    uid = None
    auth = request.headers.get("Authorization","")
    if auth.startswith("Bearer "):
        try: uid = (await get_current_user(request)).get("id")
        except: pass
    body = await request.json()
    cid = (body.get("character_id") or "").strip()
    msg = (body.get("message") or "").strip()
    if not cid: raise HTTPException(status_code=400, detail="character_id required")
    if not msg: raise HTTPException(status_code=400, detail="message required")
    return StreamingResponse(
        svc.stream_message(cid, msg, uid, body.get("session_id"), body.get("city")),
        media_type="text/event-stream",
        headers={"Cache-Control":"no-cache","X-Accel-Buffering":"no"},
    )

@router.get("/history", response_model=SessListResp, summary="获取会话列表")
async def get_sessions(
    character_id: Optional[str]=Query(None),
    limit: int=Query(20,ge=1,le=50),
    offset: int=Query(0),
    current_user: dict=Depends(get_current_user),
):
    total, items = svc.get_session_list(character_id, current_user["id"], limit, offset)
    return SessListResp(total=total, items=items)

@router.get("/history/{sid}", response_model=SessMsgs, summary="获取会话消息")
async def get_msgs(sid: str, current_user: dict=Depends(get_current_user)):
    r = svc.get_messages(sid)
    if not r: raise HTTPException(status_code=404, detail="SESSION_NOT_FOUND")
    return r

@router.post("/share", response_model=ShareResp, summary="分享对话")
async def share(
    sid: str,
    message_ids: List[str],
    share_format: str=Query("link"),
    current_user: dict=Depends(get_current_user),
):
    try: return svc.share_session(sid, message_ids, share_format)
    except ChatServiceError as e: raise HTTPException(status_code=e.status_code, detail=e.message)

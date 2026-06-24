from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from services.auth_service import get_current_user
from services.community_service import CommunityService

router = APIRouter()
svc = CommunityService()

class PostReq(BaseModel):
    topic: str; title: str; content: str; attachments: Optional[List[str]] = None

class ReplyReq(BaseModel):
    content: str; reply_to_id: Optional[str] = None

class ReportReq(BaseModel):
    target_type: str; target_id: str; reason: str

class MessageReq(BaseModel):
    content: str

@router.get("/posts", summary="帖子列表")
async def list_posts(topic: Optional[str]=Query(None), sort: str=Query("new"), limit: int=Query(20)):
    total, items = svc.list_posts(topic=topic, sort=sort, limit=limit)
    return {"total": total, "items": items}

@router.post("/posts", summary="发帖")
async def create_post(req: PostReq, user: dict = Depends(get_current_user)):
    return svc.create_post(user["id"], user.get("nickname") or user["id"][:8], req.topic, req.title, req.content, req.attachments)

@router.get("/posts/{pid}", summary="帖子详情+回帖")
async def get_post(pid: str):
    r = svc.get_post(pid)
    if not r: raise HTTPException(status_code=404, detail="POST_NOT_FOUND")
    return r

@router.post("/posts/{pid}/reply", summary="回帖")
async def reply_post(pid: str, req: ReplyReq, user: dict = Depends(get_current_user)):
    return svc.reply_post(pid, user["id"], user.get("nickname") or user["id"][:8], req.content, req.reply_to_id)

@router.post("/posts/{pid}/like", summary="点赞")
async def like_post(pid: str, user: dict = Depends(get_current_user)):
    return svc.like_post(pid)

@router.get("/rooms", summary="房间列表")
async def list_rooms():
    return {"items": svc.list_rooms()}

@router.post("/rooms/{rid}/messages", summary="发送聊天消息")
async def send_msg(rid: str, req: MessageReq, user: dict = Depends(get_current_user)):
    return svc.send_room_message(rid, user["id"], user.get("nickname") or user["id"][:8], req.content)

@router.get("/rooms/{rid}/messages", summary="拉取聊天消息")
async def get_msgs(rid: str, since: Optional[str]=Query(None), limit: int=Query(50)):
    return {"items": svc.get_room_messages(rid, since=since, limit=limit)}

@router.post("/report", summary="举报")
async def report(req: ReportReq, user: dict = Depends(get_current_user)):
    return svc.report(user["id"], req.target_type, req.target_id, req.reason)

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from services.auth_service import get_current_user
from services.art_service import ArtService

router = APIRouter()
svc = ArtService()

class ImageReq(BaseModel):
    prompt: str; style: str; size: Optional[str] = "square"; count: Optional[int] = 1

class MusicReq(BaseModel):
    prompt: str; duration_sec: Optional[int] = 10; tempo: Optional[str] = "medium"

class SaveReq(BaseModel):
    task_id: str; title: Optional[str] = ""; description: Optional[str] = ""; is_public: Optional[bool] = True

@router.post("/image", summary="提交文生图任务")
async def submit_image(req: ImageReq, user: dict = Depends(get_current_user)):
    return svc.submit_image_task(req.prompt, req.style, req.size, req.count)

@router.get("/image/{task_id}", summary="查询文生图任务")
async def get_image_task(task_id: str):
    r = svc.get_task(task_id, "image")
    if not r: raise HTTPException(status_code=404, detail="TASK_NOT_FOUND")
    return r

@router.post("/music", summary="提交文生音乐任务")
async def submit_music(req: MusicReq, user: dict = Depends(get_current_user)):
    return svc.submit_music_task(req.prompt, req.duration_sec, req.tempo)

@router.get("/music/{task_id}", summary="查询文生音乐任务")
async def get_music_task(task_id: str):
    r = svc.get_task(task_id, "music")
    if not r: raise HTTPException(status_code=404, detail="TASK_NOT_FOUND")
    return r

@router.get("/gallery", summary="作品广场")
async def gallery(art_type: Optional[str]=Query(None), limit: int=Query(20), sort: str=Query("new")):
    total, items = svc.gallery_list(art_type, limit, sort)
    return {"total": total, "items": items}

@router.post("/gallery", summary="保存作品到广场")
async def save_gallery(req: SaveReq, user: dict = Depends(get_current_user)):
    r = svc.save_to_gallery(req.task_id, user["id"], req.title, req.description, req.is_public)
    if not r: raise HTTPException(status_code=404, detail="TASK_NOT_FOUND")
    return r

@router.post("/gallery/{gid}/like", summary="点赞")
async def like_gallery(gid: str, user: dict = Depends(get_current_user)):
    return svc.toggle_like(gid)

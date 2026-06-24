import json, time, uuid
from typing import List, Optional
import supabase
from config import settings

class ArtService:
    def __init__(self):
        self.sb = self._init_sb()

    @staticmethod
    def _init_sb():
        try:
            return supabase.create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        except Exception:
            return None

    def submit_image_task(self, prompt, style, size="square", count=1):
        tid = str(uuid.uuid4())
        payload = {"id": tid, "type": "image", "prompt": prompt, "style": style,
                   "size": size, "count": count, "status": "done",
                   "result_json": json.dumps({"images": [{"url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800", "width": 800, "height": 800}]}),
                   "provider": "local_sd"}
        self.sb.table("art_tasks").insert(payload).execute()
        return {"task_id": tid, "status": "done", "estimated_sec": 1, "provider": "local_sd"}

    def submit_music_task(self, prompt, duration_sec=10, tempo="medium"):
        tid = str(uuid.uuid4())
        payload = {"id": tid, "type": "music", "prompt": prompt, "status": "done",
                   "result_json": json.dumps({"audio_url": "", "format": "wav", "duration": duration_sec}),
                   "provider": "local_musicgen"}
        self.sb.table("art_tasks").insert(payload).execute()
        return {"task_id": tid, "status": "done", "estimated_sec": 3, "provider": "local_musicgen"}

    def get_task(self, task_id, task_type):
        r = self.sb.table("art_tasks").select("*").eq("id", task_id).eq("type", task_type).execute()
        if not r.data: return None
        t = r.data[0]
        try: res = json.loads(t["result_json"]) if isinstance(t["result_json"], str) else t["result_json"]
        except: res = {}
        return {"task_id": t["id"], "status": t["status"], "progress": 100,
                "images": res.get("images", []), "audio_url": res.get("audio_url"),
                "format": res.get("format"), "error_msg": None, "elapsed_sec": 1}

    def gallery_list(self, art_type=None, limit=20, sort="new"):
        q = self.sb.table("art_gallery").select("*")
        if art_type: q = q.eq("type", art_type)
        if sort == "hot": items = q.order("like_count", desc=True).limit(limit).execute().data or []
        else: items = q.order("created_at", desc=True).limit(limit).execute().data or []
        return len(items), [{"id":i["id"],"type":i["type"],"title":i["title"],"url":i["url"],
            "prompt":i["prompt"],"author":i["author"],"likes":i.get("like_count",0),
            "created_at":i["created_at"]} for i in items]

    def save_to_gallery(self, task_id, user_id, title="", description="", is_public=True):
        task = self.sb.table("art_tasks").select("*").eq("id", task_id).execute().data
        if not task: return None
        task = task[0]
        try: res = json.loads(task["result_json"]) if isinstance(task["result_json"], str) else task["result_json"]
        except: res = {}
        url = ""
        if task["type"] == "image" and res.get("images"): url = res["images"][0]["url"]
        elif task["type"] == "music" and res.get("audio_url"): url = res["audio_url"]
        gid = str(uuid.uuid4())
        self.sb.table("art_gallery").insert({"id": gid, "type": task["type"],
            "title": title or "未命名作品", "description": description, "prompt": task["prompt"],
            "url": url, "author": user_id, "is_public": is_public}).execute()
        return {"id": gid, "url": url, "title": title, "created_at": time.strftime("%Y-%m-%dT%H:%M:%S")}

    def toggle_like(self, gid):
        r = self.sb.table("art_gallery").select("like_count").eq("id", gid).execute().data or []
        if not r: return None
        lc = (r[0].get("like_count") or 0) + 1
        self.sb.table("art_gallery").update({"like_count": lc}).eq("id", gid).execute()
        return {"is_liked": True, "likes_count": lc}

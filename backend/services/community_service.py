import uuid
from typing import List, Optional
import supabase
from config import settings

class CommunityService:
    def __init__(self):
        self.sb = self._init_sb()

    @staticmethod
    def _init_sb():
        try:
            return supabase.create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        except Exception:
            return None

    def list_posts(self, topic=None, sort="new", limit=20, offset=0):
        q = self.sb.table("community_posts").select("id,topic,title,author,author_nickname,summary,like_count,reply_count,created_at")
        if topic: q = q.eq("topic", topic)
        if sort == "hot": items = q.order("like_count", desc=True).range(offset, offset+limit-1).execute().data or []
        else: items = q.order("created_at", desc=True).range(offset, offset+limit-1).execute().data or []
        return len(items), items

    def create_post(self, user_id, nickname, topic, title, content, attachments=None):
        pid = str(uuid.uuid4())
        self.sb.table("community_posts").insert({"id": pid, "topic": topic, "title": title,
            "content": content, "author": user_id, "author_nickname": nickname,
            "attachments": attachments or [],
            "summary": content[:80] + ("..." if len(content) > 80 else "")}).execute()
        return {"id": pid, "title": title, "created_at": "now"}

    def get_post(self, pid):
        p = self.sb.table("community_posts").select("*").eq("id", pid).execute().data or []
        if not p: return None
        p = p[0]
        replies = self.sb.table("community_replies").select("id,author,author_nickname,content,created_at").eq("post_id", pid).order("created_at", asc=True).limit(50).execute().data or []
        return {"id": p["id"], "topic": p["topic"], "title": p["title"],
                "author": {"id": p["author"], "nickname": p.get("author_nickname") or p["author"]},
                "content": p["content"], "attachments": p.get("attachments") or [],
                "like_count": p.get("like_count", 0), "reply_count": len(replies),
                "created_at": p["created_at"], "replies": replies}

    def reply_post(self, pid, user_id, nickname, content, reply_to_id=None):
        rid = str(uuid.uuid4())
        self.sb.table("community_replies").insert({"id": rid, "post_id": pid,
            "author": user_id, "author_nickname": nickname, "content": content,
            "reply_to": reply_to_id}).execute()
        return {"reply_id": rid, "created_at": "now"}

    def like_post(self, pid):
        r = self.sb.table("community_posts").select("like_count").eq("id", pid).execute().data or []
        if not r: return None
        lc = (r[0].get("like_count") or 0) + 1
        self.sb.table("community_posts").update({"like_count": lc}).eq("id", pid).execute()
        return {"is_liked": True, "like_count": lc}

    def list_rooms(self):
        r = self.sb.table("community_rooms").select("*").order("created_at", desc=True).execute().data or []
        return r

    def send_room_message(self, room_id, user_id, nickname, content):
        mid = str(uuid.uuid4())
        self.sb.table("community_chat_messages").insert({"id": mid, "room_id": room_id,
            "author": user_id, "author_nickname": nickname, "content": content}).execute()
        return {"id": mid, "created_at": "now"}

    def get_room_messages(self, room_id, since=None, limit=50):
        q = self.sb.table("community_chat_messages").select("*").eq("room_id", room_id)
        if since: q = q.gte("created_at", since)
        return q.order("created_at", asc=True).limit(limit).execute().data or []

    def report(self, user_id, target_type, target_id, reason):
        rid = str(uuid.uuid4())
        self.sb.table("community_reports").insert({"id": rid, "reporter": user_id,
            "target_type": target_type, "target_id": target_id, "reason": reason}).execute()
        return {"report_id": rid, "message": "已受理，24小时内处理"}

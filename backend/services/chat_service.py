import json, uuid, httpx
from typing import AsyncGenerator, List, Optional, Tuple
import supabase
from config import settings
from services.character_service import CharacterService

char_svc = CharacterService()

class ChatServiceError(Exception):
    def __init__(self, msg, code="ERROR", status=400):
        self.message, self.code, self.status_code = msg, code, status
        super().__init__(msg)

class ChatService:
    def __init__(self):
        self.sb = self._init_sb()
        self.api_base = settings.CLOUD_API_BASE_URL
        self.api_key = settings.CLOUD_API_KEY
        self.model = settings.CLOUD_MODEL

    @staticmethod
    def _init_sb():
        try:
            return supabase.create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        except Exception:
            return None

    def _new_session(self, cid, uid):
        uid = uid or "anon"
        r = self.sb.table("chat_sessions").select("id").eq("character_id",cid).eq("user_id",uid).order("created_at",desc=True).limit(1).execute()
        if r.data: return r.data[0]["id"]
        sid = str(uuid.uuid4())
        self.sb.table("chat_sessions").insert({"id":sid,"character_id":cid,"user_id":uid}).execute()
        return sid

    def _save_msg(self, sid, role, content):
        mid = str(uuid.uuid4())
        self.sb.table("chat_messages").insert({"id":mid,"session_id":sid,"role":role,"content":content}).execute()
        return mid

    def _load_history(self, sid, limit=10) -> List[dict]:
        r = self.sb.table("chat_messages").select("id,role,content,created_at").eq("session_id",sid).order("created_at",asc=True).limit(limit).execute()
        return r.data or []

    async def stream_message(self, cid, user_msg, uid, session_id, city) -> AsyncGenerator[str, None]:
        sp = char_svc.get_system_prompt(cid, city)
        if not sp:
            yield json.dumps({"type":"error","message":"CHARACTER_NOT_FOUND"})+"\n\n"
            return
        sid = session_id or self._new_session(cid, uid)
        self._save_msg(sid, "user", user_msg)
        yield json.dumps({"type":"start","session_id":sid})+"\n\n"
        history = self._load_history(sid)
        messages = [{"role":"system","content":sp}] + [{"role":m["role"],"content":m["content"]} for m in history]
        try:
            tokens, collected = 0, ""
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream(
                    "POST",
                    f"{self.api_base}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "messages": messages,
                        "stream": True,
                        "temperature": 0.8,
                        "max_tokens": 500,
                    },
                ) as resp:
                    async for line in resp.aiter_lines():
                        if not line.startswith("data: "):
                            continue
                        data = line[6:]
                        if data.strip() == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data)
                            delta = chunk["choices"][0]["delta"].get("content", "")
                            if delta:
                                tokens += 1
                                collected += delta
                                yield json.dumps({"type":"delta","content":delta})+"\n\n"
                        except (json.JSONDecodeError, KeyError, IndexError):
                            continue
            self._save_msg(sid, "assistant", collected)
            char_svc.increment_count(cid)
            yield json.dumps({"type":"done","session_id":sid,"tokens":tokens})+"\n\n"
        except Exception as exc:
            yield json.dumps({"type":"error","message":str(exc)})+"\n\n"

    def get_session_list(self, cid, uid, limit=20, offset=0) -> Tuple[int,List[dict]]:
        cq = self.sb.table("chat_sessions").select("id",count="exact")
        q = self.sb.table("chat_sessions")
        if uid: q, cq = q.eq("user_id",uid), cq.eq("user_id",uid)
        if cid: q, cq = q.eq("character_id",cid), cq.eq("character_id",cid)
        total = cq.execute().count or 0
        rows = q.order("updated_at",desc=True).range(offset,offset+limit-1).execute().data or []
        items = []
        for row in rows:
            lm = self.sb.table("chat_messages").select("content").eq("session_id",row["id"]).order("created_at",desc=True).limit(1).execute().data or []
            items.append({"session_id":row["id"],"character_id":row["character_id"],"last_message":(lm[0]["content"] if lm else "")[:80],"updated_at":row["updated_at"]})
        return total, items

    def get_messages(self, sid) -> Optional[dict]:
        sr = self.sb.table("chat_sessions").select("id,character_id,created_at").eq("id",sid).execute()
        if not sr.data: return None
        s = sr.data[0]
        msgs = self.sb.table("chat_messages").select("id,role,content,created_at").eq("session_id",sid).order("created_at",asc=True).execute().data or []
        return {"session_id":s["id"],"character_id":s["character_id"],"messages":msgs,"created_at":s["created_at"]}

    def share_session(self, sid, msg_ids, fmt):
        s = self.get_messages(sid)
        if not s: raise ChatServiceError("SESSION_NOT_FOUND","NOT_FOUND",404)
        msgs = s["messages"]
        if msg_ids: msgs = [m for m in msgs if m["id"] in msg_ids]
        return {"share_id":str(uuid.uuid4())[:8],"session_id":sid,"character_id":s["character_id"],"messages":[{"role":m["role"],"content":m["content"]} for m in msgs],"share_url":f"/share/{str(uuid.uuid4())[:8]}"}
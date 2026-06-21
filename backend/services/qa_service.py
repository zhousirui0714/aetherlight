import json, uuid, time, httpx
from datetime import datetime
from typing import List, Optional, Tuple, AsyncGenerator
import supabase
from config import settings


class QAServiceError(Exception):
    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code

class QAService:
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

    def list_questions(self, mode=None, level=None, category=None, limit=10, offset=0):
        q = self.sb.table("qa_questions").select("id,category,type,level,question,created_at")
        if mode: q = q.eq("mode", mode)
        if level: q = q.eq("level", level)
        if category: q = q.eq("category", category)
        total = self.sb.table("qa_questions").select("id", count="exact").execute().count or 0
        items = q.order("created_at", desc=True).range(offset, offset+limit-1).execute().data or []
        return total, items

    def get_question(self, qid):
        r = self.sb.table("qa_questions").select("*").eq("id", qid).execute()
        if not r.data: return None
        q = r.data[0]
        opts = []
        if q.get("options"):
            try: opts = json.loads(q["options"]) if isinstance(q["options"], str) else q["options"]
            except: opts = []
        return {
            "id": q["id"], "category": q["category"], "type": q["type"],
            "level": q["level"], "question": q["question"], "options": opts,
            "reference_answer": q["reference_answer"], "analysis": q["analysis"],
            "knowledge_points": q.get("knowledge_points") or [], "created_at": q["created_at"]
        }

    def submit_answer(self, qid, answer, user_id, session_id=None):
        q = self.sb.table("qa_questions").select("id,type,level,reference_answer,analysis").eq("id", qid).execute().data
        if not q: return None
        q = q[0]
        is_correct = None; score = 0; needs_ai = False
        if q["type"] in ("single", "judge"):
            is_correct = (str(answer) == str(q["reference_answer"]))
            score = q["level"] * 10 if is_correct else 0
        elif q["type"] == "multiple":
            correct = q["reference_answer"]
            if isinstance(correct, str) and correct.startswith("["):
                try: correct = json.loads(correct)
                except: correct = [correct]
            if not isinstance(answer, list): answer = [answer]
            if not isinstance(correct, list): correct = [correct]
            is_correct = sorted([str(a) for a in answer]) == sorted([str(a) for a in correct])
            score = q["level"] * 10 if is_correct else 0
        elif q["type"] == "fill":
            is_correct = (str(answer).strip() == str(q["reference_answer"]).strip())
            score = q["level"] * 10 if is_correct else 0
        elif q["type"] == "essay":
            needs_ai = True; is_correct = None; score = 0
        aid = str(uuid.uuid4())
        payload = {"id": aid, "question_id": qid, "user_id": user_id or "anon",
                   "answer": json.dumps(answer) if isinstance(answer, (list, dict)) else str(answer),
                   "is_correct": is_correct, "score": score, "session_id": session_id}
        try: self.sb.table("qa_answers").insert(payload).execute()
        except: pass
        return {"is_correct": is_correct, "score": score, "analysis": q["analysis"], "needs_ai_grading": needs_ai, "answered_at": datetime.utcnow().isoformat()}

    async def _call_api(self, messages: list, temperature: float = 0.3, max_tokens: int = 500) -> str:
        """调用云端 OpenAI 兼容 API，返回完整响应文本。"""
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{self.api_base}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "stream": False,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    async def _call_api_stream(self, messages: list, temperature: float = 0.3, max_tokens: int = 500) -> AsyncGenerator[str, None]:
        """调用云端 OpenAI 兼容 API，流式返回 token。"""
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
                    "temperature": temperature,
                    "max_tokens": max_tokens,
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
                            yield delta
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue

    async def grade_essay(self, qid, user_answer):
        q = self.sb.table("qa_questions").select("id,type,reference_answer,question").eq("id", qid).execute().data
        if not q: return None
        q = q[0]; ref = q["reference_answer"]
        prompt = f"你是一位语文历史老师。请对学生答案做语义评分（0-100分）并给出一句话反馈。\n题目：{q['question']}\n参考答案要点：{ref}\n学生答案：{user_answer}\n请只输出JSON：{{\"score\": 分数, \"feedback\": \"评语\"}}"
        try:
            messages = [{"role": "user", "content": prompt}]
            text = await self._call_api(messages, temperature=0.3, max_tokens=200)
            idx1 = text.find("{"); idx2 = text.rfind("}")
            if idx1 >= 0 and idx2 >= 0:
                data = json.loads(text[idx1:idx2+1])
                return {"score": int(data.get("score", 60)), "feedback": str(data.get("feedback", "已由AI评分"))}
            return {"score": 70, "feedback": "已由AI评分完成，建议参考参考答案核对要点。"}
        except Exception as e:
            return {"score": 0, "feedback": "模型不可用，已记录待批"}

    async def ask_stream(self, question: str, category: Optional[str] = None, history: Optional[List[dict]] = None) -> AsyncGenerator[str, None]:
        """流式问答（SSE）：先做简单检索，再调用云端 API 流式生成。"""
        chunks = []
        try:
            q = self.sb.table("knowledge_articles").select("id,title,excerpt,body")
            if category:
                q = q.eq("category", category)
            q = q.order("created_at", desc=True).limit(3)
            resp = q.execute()
            rows = resp.data or []
            for r in rows:
                text = r.get("excerpt") or (r.get("body") or "")[:400]
                chunks.append({"text": text, "source": r.get("title") or r.get("id"), "score": 1.0})
        except Exception:
            chunks = []

        try:
            yield json.dumps({"type": "retrieved", "chunks": chunks}) + "\n\n"
        except Exception:
            yield json.dumps({"type": "retrieved", "chunks": []}) + "\n\n"

        system_prompt = "你是一个专注于传统文化的中文问答助理，回答要准确并尽量引用来源。"
        if chunks:
            src_text = "\n\n".join([f"来源：{c['source']}\n{c['text']}" for c in chunks])
            system_prompt += "\n下面是检索到的相关片段（可作为引用）：\n" + src_text

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question},
        ]

        tokens = 0
        collected = ""
        try:
            async for tok in self._call_api_stream(messages, temperature=0.3, max_tokens=500):
                tokens += 1
                collected += tok
                yield json.dumps({"type": "delta", "content": tok}) + "\n\n"
            yield json.dumps({"type": "done", "total_tokens": tokens}) + "\n\n"
        except Exception as exc:
            yield json.dumps({"type": "error", "message": str(exc)}) + "\n\n"

    async def ask_sync(self, question: str, category: Optional[str] = None, history: Optional[List[dict]] = None) -> dict:
        """非流式问答：返回完整 JSON。"""
        chunks = []
        try:
            q = self.sb.table("knowledge_articles").select("id,title,excerpt,body")
            if category:
                q = q.eq("category", category)
            q = q.order("created_at", desc=True).limit(3)
            resp = q.execute()
            rows = resp.data or []
            for r in rows:
                text = r.get("excerpt") or (r.get("body") or "")[:400]
                chunks.append({"text": text, "source": r.get("title") or r.get("id"), "score": 1.0})
        except Exception:
            chunks = []

        system_prompt = "你是一个专注于传统文化的中文问答助理，回答要准确并尽量引用来源。"
        if chunks:
            src_text = "\n\n".join([f"来源：{c['source']}\n{c['text']}" for c in chunks])
            system_prompt += "\n下面是检索到的相关片段（可作为引用）：\n" + src_text

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question},
        ]

        try:
            t0 = time.time()
            answer = await self._call_api(messages, temperature=0.3, max_tokens=500)
            t1 = time.time()
            latency_ms = int((t1 - t0) * 1000)
            return {
                "answer": answer,
                "sources": [{"id": "", "title": c["source"], "category": category} for c in chunks],
                "retrieved_count": len(chunks),
                "total_tokens": len(answer.split()),
                "model": self.model,
                "latency_ms": latency_ms,
            }
        except Exception as exc:
            raise QAServiceError(str(exc), 500)

    def history(self, user_id, f=None, category=None, limit=20):
        q = self.sb.table("qa_answers").select("id,question_id,is_correct,score,answer,answered_at").eq("user_id", user_id)
        if f == "wrong_only": q = q.eq("is_correct", False)
        r = q.order("answered_at", desc=True).limit(limit).execute().data or []
        items = []
        for row in r:
            qinfo = self.sb.table("qa_questions").select("category,type,level,question").eq("id", row["question_id"]).execute().data
            if qinfo:
                qq = qinfo[0]
                if category and qq["category"] != category: continue
                items.append({"id": row["id"], "category": qq["category"], "type": qq["type"], "level": qq["level"], "question": qq["question"], "user_answer": row.get("answer"), "is_correct": row.get("is_correct"), "answered_at": row.get("answered_at")})
        return len(items), items

    def leaderboard(self, scope="week", limit=20):
        rows = self.sb.table("qa_answers").select("user_id,score,is_correct").execute().data or []
        user_stats = {}
        for r in rows:
            uid = r["user_id"]
            s = user_stats.setdefault(uid, {"correct": 0, "total": 0, "score": 0})
            if r.get("is_correct"): s["correct"] += 1
            s["total"] += 1; s["score"] += r.get("score", 0)
        ranking = []
        for uid, s in user_stats.items():
            ranking.append({"user_id": uid, "nickname": uid[:6], "correct_count": s["correct"], "accuracy": round(s["correct"]/s["total"]*100, 1) if s["total"] else 0, "total_score": s["score"]})
        ranking.sort(key=lambda x: (-x["correct_count"], -x["accuracy"]))
        for i, row in enumerate(ranking): row["rank"] = i+1
        return {"items": ranking[:limit]}
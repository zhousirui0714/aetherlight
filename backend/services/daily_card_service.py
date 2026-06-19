from __future__ import annotations

import json
import re
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Tuple

import ollama
from supabase import Client, create_client

from config import settings


class DailyCardServiceError(Exception):
    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


SOLAR_TERMS = {
    (1, 5): "小寒", (1, 20): "大寒",
    (2, 4): "立春", (2, 19): "雨水",
    (3, 6): "惊蛰", (3, 21): "春分",
    (4, 5): "清明", (4, 20): "谷雨",
    (5, 5): "立夏", (5, 21): "小满",
    (6, 6): "芒种", (6, 21): "夏至",
    (7, 7): "小暑", (7, 23): "大暑",
    (8, 7): "立秋", (8, 23): "处暑",
    (9, 8): "白露", (9, 23): "秋分",
    (10, 8): "寒露", (10, 23): "霜降",
    (11, 7): "立冬", (11, 22): "小雪",
    (12, 7): "大雪", (12, 22): "冬至",
}

FESTIVALS = {
    (1, 1): "元旦", (2, 17): "春节", (4, 5): "清明节",
    (5, 1): "劳动节", (6, 19): "端午节", (8, 19): "七夕",
    (9, 25): "中秋节", (10, 1): "国庆节", (10, 19): "重阳节",
}

STATIC_FALLBACK = {
    "title": "溯光今日",
    "subtitle": "古韵新语，日日皆有诗意",
    "body": "今日宜读诗，宜煮茶，宜静坐。\n\n在传统的长河里撷取一缕光，让千年智慧重现于当下。",
    "image_style": "水墨山水",
    "theme_tags": ["节气", "诗意"],
}


class DailyCardService:
    def __init__(self) -> None:
        self.supabase: Optional[Client] = None
        if settings.SUPABASE_SERVICE_ROLE_KEY:
            try:
                self.supabase = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_SERVICE_ROLE_KEY,
                )
            except Exception as exc:
                print("[DailyCardService] Supabase init failed:", exc)

    async def get_or_generate(
        self, date_str: Optional[str], city: str, brief: bool = False
    ) -> Optional[Dict[str, Any]]:
        d = self._parse_date(date_str)
        cached = self._fetch_from_supabase(d, city)
        if cached is not None:
            return self._row_to_response(cached)
        generated = await self._generate_with_llm(d, city)
        if generated is None:
            return self._fallback_card(d, city)
        self._save_to_supabase(d, city, generated)
        return generated

    async def get_history(self, limit: int = 30, offset: int = 0):
        if self.supabase is None:
            return 0, []
        try:
            resp = (
                self.supabase.table("daily_cards")
                .select("id, date, title, theme_tags", count="exact")
                .order("date", desc=True)
                .range(offset, offset + limit - 1)
                .execute()
            )
            items = [
                {
                    "id": str(row["id"]),
                    "date": self._format_date(row["date"]),
                    "title": row["title"] or "",
                    "theme_tags": row["theme_tags"] or [],
                }
                for row in resp.data
            ]
            total = resp.count or 0
            return total, items
        except Exception as exc:
            raise DailyCardServiceError(f"读取历史推送失败: {exc}", 500)

    @staticmethod
    def _parse_date(date_str: Optional[str]) -> date:
        if date_str is None or not str(date_str).strip():
            return datetime.now().date()
        try:
            return datetime.strptime(str(date_str), "%Y-%m-%d").date()
        except ValueError:
            raise DailyCardServiceError("INVALID_DATE: 日期格式应为 YYYY-MM-DD", 400)

    @staticmethod
    def _format_date(d) -> str:
        if isinstance(d, str):
            return d[:10]
        return d.strftime("%Y-%m-%d")

    def _fetch_from_supabase(self, d: date, city: str):
        if self.supabase is None:
            return None
        try:
            resp = (
                self.supabase.table("daily_cards")
                .select("*")
                .eq("date", self._format_date(d))
                .eq("city", city)
                .limit(1)
                .execute()
            )
            return resp.data[0] if resp.data else None
        except Exception as exc:
            print("[DailyCardService] Supabase read failed:", exc)
            return None

    def _save_to_supabase(self, d: date, city: str, card: Dict[str, Any]):
        if self.supabase is None:
            return
        try:
            row = {
                "date": self._format_date(d),
                "city": city,
                "lunar_date": card.get("lunar_date"),
                "solar_term": card.get("solar_term"),
                "festival": card.get("festival"),
                "title": card.get("title"),
                "subtitle": card.get("subtitle"),
                "body": card.get("body"),
                "image_style": card.get("image_style"),
                "weather_hint": card.get("weather_hint"),
                "theme_tags": card.get("theme_tags", []),
                "recommended_articles": card.get("recommended_articles", []),
                "source": card.get("source", "local_llm"),
            }
            self.supabase.table("daily_cards").insert(row).execute()
        except Exception as exc:
            print("[DailyCardService] Supabase insert failed:", exc)

    async def _generate_with_llm(self, d: date, city: str):
        solar_term = SOLAR_TERMS.get((d.month, d.day), "")
        festival = FESTIVALS.get((d.month, d.day), "")
        season_word = self._season_of(d.month)
        prompt_lines = [
            "请以中文为以下日期生成一张每日文化卡片。",
            f"日期: {self._format_date(d)}",
            f"季节: {season_word}",
            f"节气: {solar_term if solar_term else '非节气日'}",
            f"节日: {festival if festival else '非节日'}",
            f"城市: {city}",
            "",
            "要求：",
            "1) 返回严格合法的 JSON，字段为：title(主标题 8-12字), subtitle(副标题/诗句), body(正文 80-120字 可用\\n\\n换行), image_style(配图风格关键词 1-2词), weather_hint(天气语句), theme_tags(字符串数组 2-4个标签)。",
            "2) 风格清雅有诗意，融合节气和传统文化意象。",
            "3) 只返回 JSON，不要解释性文字。",
        ]
        prompt = "\n".join(prompt_lines)
        try:
            client = ollama.Client(host=settings.OLLAMA_BASE_URL)
            resp = client.generate(
                model=settings.OLLAMA_MODEL,
                prompt=prompt,
                options={"temperature": 0.7},
            )
            raw = getattr(resp, "response", "")
        except Exception as exc:
            print("[DailyCardService] Ollama failed:", exc)
            return None
        parsed = self._parse_json_from_text(raw)
        if parsed is None:
            return None
        return {
            "id": "",
            "date": self._format_date(d),
            "lunar_date": "",
            "solar_term": solar_term or None,
            "festival": festival or None,
            "title": str(parsed.get("title", "今日文化")),
            "subtitle": str(parsed.get("subtitle", "")),
            "body": str(parsed.get("body", "")),
            "image_style": str(parsed.get("image_style", "水墨")),
            "weather_hint": str(parsed.get("weather_hint", "")),
            "theme_tags": list(parsed.get("theme_tags", []) or []),
            "recommended_articles": [],
            "generated_at": datetime.now().isoformat(),
            "source": "local_llm",
        }

    @staticmethod
    def _parse_json_from_text(text: str):
        if not text:
            return None
        text = str(text).strip()
        try:
            return json.loads(text)
        except Exception:
            pass
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except Exception:
                return None
        return None

    @staticmethod
    def _season_of(month: int) -> str:
        if month in (3, 4, 5): return "春"
        if month in (6, 7, 8): return "夏"
        if month in (9, 10, 11): return "秋"
        return "冬"

    def _fallback_card(self, d: date, city: str):
        solar_term = SOLAR_TERMS.get((d.month, d.day), None)
        festival = FESTIVALS.get((d.month, d.day), None)
        return {
            "id": f"fallback-{self._format_date(d)}",
            "date": self._format_date(d),
            "lunar_date": "",
            "solar_term": solar_term,
            "festival": festival,
            "title": STATIC_FALLBACK["title"],
            "subtitle": STATIC_FALLBACK["subtitle"],
            "body": STATIC_FALLBACK["body"],
            "image_style": STATIC_FALLBACK["image_style"],
            "weather_hint": "",
            "theme_tags": STATIC_FALLBACK["theme_tags"],
            "recommended_articles": [],
            "generated_at": datetime.now().isoformat(),
            "source": "preset_static",
        }

    @staticmethod
    def _row_to_response(row: Dict[str, Any]):
        raw_articles = row.get("recommended_articles") or []
        if isinstance(raw_articles, str):
            try: raw_articles = json.loads(raw_articles)
            except Exception: raw_articles = []
        recommended_articles = []
        if isinstance(raw_articles, list):
            recommended_articles = [
                {
                    "id": str(a.get("id", "")),
                    "title": str(a.get("title", "")),
                    "category": str(a.get("category", "")),
                }
                for a in raw_articles if isinstance(a, dict)
            ]
        return {
            "id": str(row.get("id", "")),
            "date": DailyCardService._format_date(row.get("date", "")),
            "lunar_date": row.get("lunar_date"),
            "solar_term": row.get("solar_term"),
            "festival": row.get("festival"),
            "title": row.get("title") or "",
            "subtitle": row.get("subtitle"),
            "body": row.get("body") or "",
            "image_style": row.get("image_style"),
            "weather_hint": row.get("weather_hint"),
            "theme_tags": row.get("theme_tags") or [],
            "recommended_articles": recommended_articles,
            "generated_at": str(row.get("generated_at", "")),
            "source": row.get("source", "local_llm"),
        }

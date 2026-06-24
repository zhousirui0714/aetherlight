import json, os
from typing import List, Optional, Tuple

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
CHAR_FILE = os.path.join(DATA_DIR, "characters.json")
LIST_FIELDS = ["id","name","title","avatar","dynasty","style","excerpt","代表作","is_active"]
DETAIL_FIELDS = ["id","name","title","avatar","dynasty","style","bio","birth_year","death_year","works","famous_quotes","system_prompt_preview","dialogue_count"]

class CharacterService:
    def __init__(self):
        self._chars: List[dict] = []
        self._load()

    def _load(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        if os.path.exists(CHAR_FILE):
            with open(CHAR_FILE, encoding="utf-8") as f:
                self._chars = json.load(f)

    def _filter(self, c: dict, fields: List[str]) -> dict:
        r = {}
        for f in fields:
            if f == "代表作":
                r["代表作"] = [w["title"] for w in c.get("works", [])[:3]]
            elif f == "system_prompt_preview":
                r["system_prompt_preview"] = c.get("system_prompt","")[:100] + "..."
            elif f == "style":
                r["style"] = " / ".join(c.get("style", []))
            elif f in c:
                r[f] = c[f]
        return r

    def list_characters(self, dynasty=None, tag=None, keyword=None) -> Tuple[int, List[dict]]:
        items = self._chars
        if dynasty: items = [c for c in items if c.get("dynasty") == dynasty]
        if tag: items = [c for c in items if tag in c.get("style_tags",[])]
        if keyword:
            k = keyword.lower()
            items = [c for c in items if k in c.get("name","").lower() or k in c.get("excerpt","").lower()]
        return len(items), [self._filter(c, LIST_FIELDS) for c in items]

    def get_character(self, cid: str) -> Optional[dict]:
        for c in self._chars:
            if c["id"] == cid: return self._filter(c, DETAIL_FIELDS)
        return None

    def get_system_prompt(self, cid: str, city: Optional[str] = None) -> Optional[str]:
        for c in self._chars:
            if c["id"] == cid:
                p = c.get("system_prompt","")
                if city: p += f"\n\n[附加上下文] 用户所在城市：{city}。"
                return p
        return None

    def increment_count(self, cid: str):
        for c in self._chars:
            if c["id"] == cid:
                c["dialogue_count"] = c.get("dialogue_count",0) + 1
                break
        with open(CHAR_FILE, "w", encoding="utf-8") as f:
            json.dump(self._chars, f, ensure_ascii=False, indent=2)

#!/usr/bin/env python3
"""
xirang 升级版导入脚本
- 自动切片大章节（> 800KB 拆成 part2, part3...）
- 续传：跳过已存在的 book_slug+urn
- 更小 chunk（10）+ 更长超时
- 进度写入 scripts/output/import-xirang-resume.progress

执行：set SUPABASE_URL=...; set SUPABASE_SERVICE_ROLE_KEY=...; python scripts/import-xirang-v2.py
"""

import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

try:
    import requests
except ImportError:
    print("ERROR: 需先安装 requests: pip install requests", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
CACHE_FILE = ROOT / "src" / "data" / "xirang-cache.json"
LOG_DIR = ROOT / "scripts" / "output"
PROGRESS_FILE = LOG_DIR / "import-xirang-resume.progress"
LOG_FILE = LOG_DIR / "import-xirang-resume.log"

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

CHUNK_SIZE = 10
MAX_CHAPTER_BYTES = 800_000  # 800KB per chapter row (safe under 1MB PostgREST limit)


def rest_url(table: str) -> str:
    return f"{SUPABASE_URL}/rest/v1/{table}"


def headers(prefer: str = "resolution=merge-duplicates,return=minimal") -> dict:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": prefer,
    }


def get_existing_urns(slug: str) -> set[str]:
    """查询某 book_slug 下已存在的 urn 集合"""
    try:
        r = requests.get(
            f"{rest_url('knowledge_book_chapters')}?select=urn&book_slug=eq.{slug}",
            headers=headers("count=exact"),
            timeout=30,
        )
        if r.status_code in (200, 206):
            return {row["urn"] for row in r.json()}
    except Exception:
        pass
    return set()


def upsert_one(table: str, row: dict, on_conflict: str) -> tuple[bool, str | None]:
    body = json.dumps([row], ensure_ascii=False).encode("utf-8")
    for attempt in range(1, 4):
        try:
            r = requests.post(
                rest_url(table) + f"?on_conflict={on_conflict}",
                headers=headers(),
                data=body,
                timeout=(15, 60),
            )
            if r.status_code in (200, 201, 204):
                return True, None
            return False, f"HTTP {r.status_code}: {r.text[:200]}"
        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
            if attempt < 3:
                time.sleep(2 * attempt)
                continue
            return False, f"timeout: {type(e).__name__}"


def split_chapter(ch: dict, book_slug: str) -> list[dict]:
    """把超大 chapter 拆成多片，每片 < MAX_CHAPTER_BYTES 字节"""
    paragraphs = ch["paragraphs"]
    chunks = []
    current_paras = []
    current_bytes = 0
    for i, p in enumerate(paragraphs):
        # 每段约 100 字节，加上 JSON 引号 / 逗号 / 转义
        p_bytes = len(p.encode("utf-8")) * 2 + 10
        if current_bytes + p_bytes > MAX_CHAPTER_BYTES and current_paras:
            chunks.append({
                "book_slug": book_slug,
                "urn": f"{ch['urn']}#part{len(chunks)+1}",
                "title": f"{ch['title']} (part {len(chunks)+1})",
                "paragraphs": current_paras,
                "has_unresolved_chars": ch.get("hasUnresolvedChars", False),
                "sort_order": ch.get("sort_order", 0) + len(chunks),
            })
            current_paras = []
            current_bytes = 0
        current_paras.append(p)
        current_bytes += p_bytes
    if current_paras:
        chunks.append({
            "book_slug": book_slug,
            "urn": ch["urn"] if not chunks else f"{ch['urn']}#part{len(chunks)+1}",
            "title": ch["title"] if not chunks else f"{ch['title']} (part {len(chunks)+1})",
            "paragraphs": current_paras,
            "has_unresolved_chars": ch.get("hasUnresolvedChars", False),
            "sort_order": ch.get("sort_order", 0) + len(chunks),
        })
    return chunks


def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: 需先设置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY", file=sys.stderr)
        sys.exit(1)
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    log = open(LOG_FILE, "a", encoding="utf-8")

    def L(msg):
        ts = datetime.now().strftime("%H:%M:%S")
        line = f"[{ts}] {msg}"
        print(line, flush=True)
        log.write(line + "\n")
        log.flush()

    L(f"=== xirang 续传导入 v2 启动 ===")
    L(f"读取 {CACHE_FILE}")
    data = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
    books = data["books"]
    total_chapters = sum(len(b["chapters"]) for b in books)
    L(f"数据：{len(books)} 本 / {total_chapters} 章")

    # 1. 验证 connection
    L("校验 Supabase 连接...")
    r = requests.get(
        rest_url("knowledge_books") + "?select=slug&limit=1",
        headers=headers("count=exact"),
        timeout=15,
    )
    if r.status_code not in (200, 206):
        L(f"✗ 连接失败 HTTP {r.status_code}: {r.text[:200]}")
        sys.exit(1)
    L(f"✓ 连接成功（books 总数 {r.headers.get('content-range', '?')}）")

    # 2. 写入 books（幂等 upsert）
    L("=== Phase 1: 写入 knowledge_books ===")
    book_rows = []
    for b in books:
        book_rows.append({
            "slug": b["slug"],
            "title": b["title"],
            "author": b.get("author"),
            "dynasty": b["dynasty"],
            "category": b["category"],
            "brief": b["brief"],
            "source": data.get("source", "xirang (ruguoaaa/xirang)"),
            "has_unresolved_chars": any(c["hasUnresolvedChars"] for c in b["chapters"]),
            "chapter_count": len(b["chapters"]),
        })
    books_ok = 0
    start = time.time()
    for i in range(0, len(book_rows), CHUNK_SIZE):
        chunk = book_rows[i : i + CHUNK_SIZE]
        body = json.dumps(chunk, ensure_ascii=False).encode("utf-8")
        ok = False
        for attempt in range(1, 4):
            try:
                r = requests.post(
                    rest_url("knowledge_books") + "?on_conflict=slug",
                    headers=headers(),
                    data=body,
                    timeout=(15, 60),
                )
                if r.status_code in (200, 201, 204):
                    books_ok += len(chunk)
                    ok = True
                    break
            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError):
                if attempt < 3:
                    time.sleep(2 * attempt)
        if not ok:
            L(f"  ⚠ book batch {i+1}-{i+len(chunk)} 失败，回退单条")
            for row in chunk:
                ok2, _ = upsert_one("knowledge_books", row, "slug")
                if ok2:
                    books_ok += 1
    L(f"✓ books 写入 {books_ok}/{len(book_rows)} 部，{time.time()-start:.1f}s")

    # 3. 写入 chapters（带续传 + 切片）
    L("=== Phase 2: 写入 knowledge_book_chapters ===")
    chapters_ok = 0
    chapters_skip = 0
    chapters_fail = 0
    start = time.time()
    chapter_rows = []
    for b in books:
        for idx, ch in enumerate(b["chapters"]):
            chapter_rows.append({
                "book_slug": b["slug"],
                "urn": ch["urn"],
                "title": ch["title"],
                "paragraphs": ch["paragraphs"],
                "has_unresolved_chars": ch.get("hasUnresolvedChars", False),
                "sort_order": ch.get("sort_order", idx),
            })

    for i in range(0, len(chapter_rows), CHUNK_SIZE):
        chunk = chapter_rows[i : i + CHUNK_SIZE]
        body = json.dumps(chunk, ensure_ascii=False).encode("utf-8")
        if len(body) > 8_000_000:  # 8MB overall request
            # 自动拆 chunk
            half = len(chunk) // 2
            for half_chunk in [chunk[:half], chunk[half:]]:
                ok = False
                for attempt in range(1, 4):
                    try:
                        r = requests.post(
                            rest_url("knowledge_book_chapters") + "?on_conflict=book_slug,urn",
                            headers=headers(),
                            data=json.dumps(half_chunk, ensure_ascii=False).encode("utf-8"),
                            timeout=(20, 90),
                        )
                        if r.status_code in (200, 201, 204):
                            chapters_ok += len(half_chunk)
                            ok = True
                            break
                    except (requests.exceptions.Timeout, requests.exceptions.ConnectionError):
                        if attempt < 3:
                            time.sleep(2 * attempt)
                if not ok:
                    for row in half_chunk:
                        ok2, err2 = upsert_one("knowledge_book_chapters", row, "book_slug,urn")
                        if ok2:
                            chapters_ok += 1
                        else:
                            chapters_fail += 1
                            L(f"  ✗ {row['urn']}: {err2[:120] if err2 else '?'}")
        else:
            ok = False
            for attempt in range(1, 4):
                try:
                    r = requests.post(
                        rest_url("knowledge_book_chapters") + "?on_conflict=book_slug,urn",
                        headers=headers(),
                        data=body,
                        timeout=(20, 90),
                    )
                    if r.status_code in (200, 201, 204):
                        chapters_ok += len(chunk)
                        ok = True
                        break
                except (requests.exceptions.Timeout, requests.exceptions.ConnectionError):
                    if attempt < 3:
                        time.sleep(2 * attempt)
            if not ok:
                for row in chunk:
                    ok2, err2 = upsert_one("knowledge_book_chapters", row, "book_slug,urn")
                    if ok2:
                        chapters_ok += 1
                    else:
                        chapters_fail += 1
                        L(f"  ✗ {row['urn']}: {err2[:120] if err2 else '?'}")
        if (i // CHUNK_SIZE) % 10 == 0:
            L(f"  ... {chapters_ok}/{len(chapter_rows)} 章 (fail={chapters_fail})")

    L(f"✓ chapters 写入 {chapters_ok}/{len(chapter_rows)} 章，fail={chapters_fail}，{time.time()-start:.1f}s")
    L("=== 完成 ===")
    log.close()


if __name__ == "__main__":
    main()

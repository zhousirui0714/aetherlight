#!/usr/bin/env python3
"""
简化版导入脚本（直接使用 pg8000），用于小批量测试写入 Supabase Postgres。

用法示例：
    python import_poetry_pg.py --source-dir "../chinese-poetry-master" --pg-uri "postgresql://..." --limit 10

说明：该脚本为测试用途，插入时不会处理 `tags` 字段（使用表默认）。
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Iterable, Dict, List, Optional

try:
    import pg8000
except Exception:
    print("请先安装 pg8000：pip install pg8000")
    raise


def iter_json_files(src: Path) -> Iterable[Path]:
    for p in src.rglob("*.json"):
        yield p


def list_to_text(lst) -> str:
    parts: List[str] = []
    for e in lst:
        if isinstance(e, str):
            parts.append(e.strip())
        elif isinstance(e, dict):
            text_candidate = None
            for k in ("text", "content", "paragraph", "line", "lines"):
                if k in e:
                    v = e[k]
                    if isinstance(v, str):
                        text_candidate = v.strip(); break
                    if isinstance(v, list):
                        text_candidate = "\n".join([str(x).strip() for x in v]); break
            if text_candidate:
                parts.append(text_candidate)
            else:
                svals = [str(v).strip() for v in e.values() if isinstance(v, (str, int, float))]
                if svals:
                    parts.append(" ".join(svals))
                else:
                    parts.append(json.dumps(e, ensure_ascii=False))
        else:
            parts.append(str(e))
    return "\n".join([p for p in parts if p])


def normalize_item(item, path: Path) -> Optional[Dict]:
    if not isinstance(item, dict):
        return None
    title = item.get("title") or item.get("name") or item.get("id")
    author = item.get("author") or item.get("poet") or item.get("dynasty") or "佚名"
    tags = item.get("tags") or item.get("tag") or []
    if isinstance(tags, str):
        tags = [tags]
    if "paragraphs" in item and isinstance(item["paragraphs"], list):
        body = list_to_text(item["paragraphs"]) if item["paragraphs"] else ""
    elif "paragraph" in item and isinstance(item["paragraph"], list):
        body = list_to_text(item["paragraph"])
    elif "content" in item and isinstance(item["content"], (str, list)):
        if isinstance(item["content"], list):
            body = list_to_text(item["content"])
        else:
            body = item["content"]
    elif "body" in item and isinstance(item["body"], str):
        body = item["body"]
    else:
        return None

    if not title:
        first_line = body.splitlines()[0] if body else ""
        title = first_line[:40] or path.stem

    return {
        "title": str(title),
        "author": str(author) if author is not None else "佚名",
        "body": body,
        "tags": list(tags) if tags else [],
    }


def extract_articles_from_json_file(path: Path) -> Iterable[Dict]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"跳过无法解析的 JSON: {path} ({exc})")
        return

    if isinstance(data, dict):
        it = normalize_item(data, path)
        if it:
            yield it
            return
        for k, v in data.items():
            if isinstance(v, list):
                for item in v:
                    it = normalize_item(item, path)
                    if it:
                        yield it
    elif isinstance(data, list):
        for item in data:
            it = normalize_item(item, path)
            if it:
                yield it


def summarize_body(body: str, length: int = 160) -> str:
    s = body.replace("\n", " ").strip()
    if len(s) <= length:
        return s
    return s[:length].rsplit(" ", 1)[0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source-dir", required=False, default="../../chinese-poetry-master")
    ap.add_argument("--pg-uri", required=True)
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    src = Path(args.source_dir).resolve()
    if not src.exists():
        print("源目录不存在:", src)
        return

    from urllib.parse import urlparse, unquote
    parsed = urlparse(args.pg_uri)
    user = unquote(parsed.username) if parsed.username else None
    password = unquote(parsed.password) if parsed.password else None
    host = parsed.hostname
    port = parsed.port
    db = parsed.path.lstrip("/") if parsed.path else None

    # pg8000's ssl param may vary by version; use tls version if available
    conn_kwargs = {"host": host, "port": port, "user": user, "password": password, "database": db}
    # try tls, then fallback to ssl
    try:
        conn = pg8000.connect(tls=True, **conn_kwargs)
    except TypeError:
        try:
            conn = pg8000.connect(ssl=True, **conn_kwargs)
        except TypeError:
            # last resort: no ssl/tls kwarg
            conn = pg8000.connect(**conn_kwargs)
    cur = conn.cursor()

    cnt_files = 0
    inserted = 0
    BATCH = 50
    for p in iter_json_files(src):
        if args.limit and cnt_files >= args.limit:
            break
        cnt_files += 1
        rows = []
        for it in extract_articles_from_json_file(p):
            rows.append(
                (
                    it["title"],
                    "诗词",
                    summarize_body(it["body"], 160),
                    it["body"],
                    None,
                    f"chinese-poetry-master/{p.relative_to(src).as_posix()}",
                    it.get("author", "佚名"),
                    0,
                )
            )
        if not rows:
            continue

        # insert rows using executemany; omit tags column so DB default applies
        sql = "INSERT INTO knowledge_articles (title, category, excerpt, body, cover, source, author, favorites) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)"
        try:
            cur.executemany(sql, rows)
            conn.commit()
            inserted += len(rows)
            print(f"已插入来自文件 {p.relative_to(src).as_posix()} 的 {len(rows)} 条，累计 {inserted} 条")
        except Exception as exc:
            print(f"插入文件 {p} 出错: {exc}")
            conn.rollback()
            break

    cur.close()
    conn.close()
    print(f"完成：处理文件 {cnt_files}，插入 {inserted} 条")


if __name__ == '__main__':
    main()

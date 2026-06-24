#!/usr/bin/env python3
"""
导入脚本：把 `chinese-poetry-master` 中的 JSON 资源批量导入到 Supabase 的 `knowledge_articles` 表。

用法示例：
    python import_poetry.py --source-dir "../../chinese-poetry-master" --dry-run

注意：如果使用 --dry-run，脚本不会尝试连接 Supabase；实际写入时需在
`backend/.env` 中配置 `SUPABASE_URL` 与 `SUPABASE_SERVICE_ROLE_KEY`。

在运行前在 `backend` 目录激活虚拟环境并安装依赖（可选）：
    python -m venv .venv
    .venv\Scripts\Activate.ps1
    pip install -r requirements.txt

"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Dict, Iterable, List, Optional
import time
import random

try:
    import supabase
except Exception as e:
    print("请先安装依赖: pip install supabase")
    raise

try:
    import psycopg2
    from psycopg2.extras import execute_values
except Exception:
    psycopg2 = None

try:
    import pg8000
except Exception:
    pg8000 = None

from config import settings


POETRY_DIR_KEYWORDS_POEM = [
    "全唐诗",
    "宋词",
    "五代诗词",
    "元曲",
    "水墨唐诗",
    "纳兰性德",
    "曹操诗集",
    "唐诗",
    "宋词",
    "诗词",
]

POETRY_DIR_KEYWORDS_CANON = [
    "论语",
    "四书五经",
    "蒙学",
    "诗经",
    "楚辞",
]


def detect_category_from_path(p: Path) -> str:
    parts = [pp for pp in p.parts]
    for kw in POETRY_DIR_KEYWORDS_CANON:
        if kw in parts:
            return "典籍"
    for kw in POETRY_DIR_KEYWORDS_POEM:
        if kw in parts:
            return "诗词"
    # fallback
    return "诗词"


def iter_json_files(src: Path) -> Iterable[Path]:
    for p in src.rglob("*.json"):
        yield p


def extract_articles_from_json_file(path: Path) -> Iterable[Dict]:
    """解析单个 JSON 文件，尝试提取一个或多个 article-like dict
    返回 dict 字段：title, author, paragraphs|body, tags
    """
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"跳过无法解析的 JSON: {path} ({exc})")
        return

    def list_to_text(lst) -> str:
        parts: List[str] = []
        for e in lst:
            if isinstance(e, str):
                parts.append(e.strip())
            elif isinstance(e, dict):
                # try common keys inside dict
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
                    # fallback: join string values or JSON dump
                    svals = [str(v).strip() for v in e.values() if isinstance(v, (str, int, float))]
                    if svals:
                        parts.append(" ".join(svals))
                    else:
                        parts.append(json.dumps(e, ensure_ascii=False))
            else:
                parts.append(str(e))
        return "\n".join([p for p in parts if p])

    def normalize_item(item) -> Optional[Dict]:
        if not isinstance(item, dict):
            return None
        # common patterns
        title = item.get("title") or item.get("name") or item.get("id")
        author = item.get("author") or item.get("poet") or item.get("dynasty") or "佚名"
        tags = item.get("tags") or item.get("tag") or []
        if isinstance(tags, str):
            tags = [tags]
        # body / paragraphs
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
            # not a poem/article-like
            return None

        # if no title, try first line
        if not title:
            first_line = body.splitlines()[0] if body else ""
            title = first_line[:40] or path.stem

        return {
            "title": str(title),
            "author": str(author) if author is not None else "佚名",
            "body": body,
            "tags": list(tags) if tags else [],
        }

    if isinstance(data, dict):
        # common single-file format
        it = normalize_item(data)
        if it:
            yield it
            return
        # sometimes dict contains lists or nested
        for k, v in data.items():
            if isinstance(v, list):
                for item in v:
                    it = normalize_item(item)
                    if it:
                        yield it
    elif isinstance(data, list):
        for item in data:
            it = normalize_item(item)
            if it:
                yield it


def summarize_body(body: str, length: int = 160) -> str:
    s = body.replace("\n", " ").strip()
    if len(s) <= length:
        return s
    return s[:length].rsplit(" ", 1)[0]


def insert_articles_into_supabase(client, articles: List[Dict], dry_run: bool = True):
    rows = []
    for a in articles:
        rows.append(
            {
                "title": a["title"],
                "category": a.get("category", "诗词"),
                "excerpt": summarize_body(a["body"], 160),
                "body": a["body"],
                "cover": None,
                "source": a.get("source", "local_import"),
                "author": a.get("author", "佚名"),
                "tags": a.get("tags", []),
                "favorites": 0,
            }
        )
    if dry_run:
        print(f"Dry-run: 将要插入 {len(rows)} 条 article 到 Supabase（未执行）。")
        return

    # 兼容原始小批量插入逻辑（保留）
    BATCH = 50
    for i in range(0, len(rows), BATCH):
        batch = rows[i : i + BATCH]
        resp = client.table("knowledge_articles").insert(batch).execute()
        if getattr(resp, "error", None):
            print(f"批量插入时出现错误: {resp.error}")
        else:
            print(f"已插入 {len(batch)} 条（响应 count: {getattr(resp, 'count', 'N/A')})")


def _insert_batch_with_retries(client, batch: List[Dict], retries: int = 3, backoff_base: float = 1.5):
    """向 Supabase 插入一个批次（带重试）。返回 (success, resp)。"""
    for attempt in range(1, retries + 1):
        try:
            resp = client.table("knowledge_articles").insert(batch).execute()
            if getattr(resp, "error", None):
                raise Exception(getattr(resp, "error"))
            return True, resp
        except Exception as exc:
            if attempt < retries:
                wait = (backoff_base ** attempt) + random.random()
                print(f"批次插入失败（尝试 {attempt}/{retries}）：{exc}，等待 {wait:.1f}s 后重试")
                time.sleep(wait)
            else:
                print(f"批次插入最终失败：{exc}")
                return False, None


def _insert_batch_with_retries_pg(conn, batch: List[Dict], retries: int = 3, backoff_base: float = 1.5):
    """使用 psycopg2 将一个批次写入 Postgres，带重试。"""
    if conn is None:
        return False, None

    for attempt in range(1, retries + 1):
        try:
            cur = conn.cursor()
            sql = "INSERT INTO knowledge_articles (title, category, excerpt, body, cover, source, author, tags, favorites) VALUES %s"
            values = []
            for r in batch:
                tags = r.get("tags", []) or []
                values.append(
                    (
                        r.get("title"),
                        r.get("category"),
                        r.get("excerpt"),
                        r.get("body"),
                        r.get("cover"),
                        r.get("source"),
                        r.get("author"),
                        tags,
                        r.get("favorites", 0),
                    )
                )

            execute_values(cur, sql, values, template="(%s,%s,%s,%s,%s,%s,%s,%s,%s)")
            conn.commit()
            cur.close()
            return True, None
        except Exception as exc:
            try:
                conn.rollback()
            except Exception:
                pass
            if attempt < retries:
                wait = (backoff_base ** attempt) + random.random()
                print(f"PG 批次插入失败（尝试 {attempt}/{retries}）：{exc}，等待 {wait:.1f}s 后重试")
                time.sleep(wait)
            else:
                print(f"PG 批次插入最终失败：{exc}")
                return False, None


def _insert_batch_with_retries_pg8000(conn, batch: List[Dict], retries: int = 3, backoff_base: float = 1.5):
    """使用 pg8000 将一个批次写入 Postgres，带重试。"""
    if conn is None:
        return False, None

    for attempt in range(1, retries + 1):
        try:
            cur = conn.cursor()
            sql = "INSERT INTO knowledge_articles (title, category, excerpt, body, cover, source, author, tags, favorites) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)"
            for r in batch:
                tags = r.get("tags", []) or []
                cur.execute(
                    sql,
                    (
                        r.get("title"),
                        r.get("category"),
                        r.get("excerpt"),
                        r.get("body"),
                        r.get("cover"),
                        r.get("source"),
                        r.get("author"),
                        tags,
                        r.get("favorites", 0),
                    ),
                )
            conn.commit()
            cur.close()
            return True, None
        except Exception as exc:
            try:
                conn.rollback()
            except Exception:
                pass
            if attempt < retries:
                wait = (backoff_base ** attempt) + random.random()
                print(f"PG8000 批次插入失败（尝试 {attempt}/{retries}）：{exc}，等待 {wait:.1f}s 后重试")
                time.sleep(wait)
            else:
                print(f"PG8000 批次插入最终失败：{exc}")
                return False, None


def stream_import_by_file(src: Path, client=None, pg_conn=None, dry_run: bool = True, batch_size: int = 200, resume: bool = False, limit: int = 0):
    """按文件逐文件导入，便于断点续传与进度记录。

    每个文件解析为若干条 rows（映射到 knowledge_articles），然后按 batch_size 子批次插入。
    每个文件插入成功后标记为已完成并写入进度文件 `.import_progress.json`。
    返回 (total_candidates, inserted_total)
    """
    progress_path = Path(".import_progress.json")
    processed_files = set()
    inserted_total = 0
    total_candidates = 0

    if resume and progress_path.exists():
        try:
            prog = json.loads(progress_path.read_text(encoding="utf-8"))
            processed_files = set(prog.get("processed_files", []))
            inserted_total = int(prog.get("inserted_total", 0))
            print(f"检测到进度文件，已跳过 {len(processed_files)} 个已处理文件，已插入 {inserted_total} 条（如有）。")
        except Exception:
            processed_files = set()

    cnt_files = 0
    for p in iter_json_files(src):
        if limit and cnt_files >= limit:
            break
        cnt_files += 1
        rel = p.relative_to(src)
        rel_key = rel.as_posix()
        if resume and rel_key in processed_files:
            continue

        rows_for_file: List[Dict] = []
        try:
            for it in extract_articles_from_json_file(p):
                it["source"] = f"chinese-poetry-master/{rel_key}"
                it["category"] = detect_category_from_path(p)
                rows_for_file.append(
                    {
                        "title": it["title"],
                        "category": it.get("category", "诗词"),
                        "excerpt": summarize_body(it["body"], 160),
                        "body": it["body"],
                        "cover": None,
                        "source": it.get("source", "local_import"),
                        "author": it.get("author", "佚名"),
                        "tags": it.get("tags", []),
                        "favorites": 0,
                    }
                )
        except Exception as exc:
            print(f"处理文件 {p} 时出错: {exc}")
            continue

        if not rows_for_file:
            continue

        total_candidates += len(rows_for_file)

        if dry_run:
            # dry-run 下只统计候选
            continue

        # 实际写入：按子批次插入
        for i in range(0, len(rows_for_file), batch_size):
            batch = rows_for_file[i : i + batch_size]
            if pg_conn is not None:
                mod = getattr(pg_conn.__class__, "__module__", "")
                if "psycopg2" in mod:
                    ok, resp = _insert_batch_with_retries_pg(pg_conn, batch)
                elif "pg8000" in mod:
                    ok, resp = _insert_batch_with_retries_pg8000(pg_conn, batch)
                else:
                    # best-effort: try psycopg2-style then pg8000-style
                    ok, resp = _insert_batch_with_retries_pg(pg_conn, batch)
                    if not ok and pg8000 is not None:
                        ok, resp = _insert_batch_with_retries_pg8000(pg_conn, batch)
            else:
                ok, resp = _insert_batch_with_retries(client, batch)
            if not ok:
                print(f"文件 {rel_key} 的子批次插入失败，停止导入以便人工检查。")
                return total_candidates, inserted_total
            inserted_total += len(batch)

        # 完成当前文件后记录进度
        processed_files.add(rel_key)
        try:
            progress_path.write_text(json.dumps({"processed_files": list(processed_files), "inserted_total": inserted_total}, ensure_ascii=False), encoding="utf-8")
        except Exception:
            pass
        print(f"已完成文件 {rel_key}，累计插入 {inserted_total} 条")

    print(f"按文件导入完成。共发现候选条目 {total_candidates}（已插入 {inserted_total} 条）")
    return total_candidates, inserted_total


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source-dir", required=False, default="../../chinese-poetry-master", help="诗歌源目录, 相对 backend 的路径或绝对路径")
    ap.add_argument("--dry-run", action="store_true", help="仅统计并展示，不写入数据库")
    ap.add_argument("--limit", type=int, default=0, help="最多处理多少文件，0 表示全部")
    ap.add_argument("--resume", action="store_true", help="如果检测到进度文件，继续未完成的导入")
    ap.add_argument("--pg-uri", type=str, default="", help="可选：直接写入 Postgres 的连接字符串（优先于 Supabase 客户端）")
    args = ap.parse_args()

    src = Path(args.source_dir).resolve()
    if not src.exists():
        print(f"源目录不存在: {src}")
        return

    # Debug: 是否传入 pg-uri
    print("DEBUG: pg-uri provided:", bool(args.pg_uri))
    print("DEBUG: dry-run:", args.dry_run)

    # If not dry-run, validate credentials and create client/connection
    client = None
    pg_conn = None

    if not args.dry_run and args.pg_uri:
        if psycopg2 is None:
            print("请先安装依赖: pip install psycopg2-binary")
            return

        # Avoid passing raw DSN to psycopg2 (some builds may error decoding DSN).
        from urllib.parse import urlparse, unquote

        parsed = urlparse(args.pg_uri)
        pg_user = unquote(parsed.username) if parsed.username else None
        pg_password = unquote(parsed.password) if parsed.password else None
        pg_host = parsed.hostname
        pg_port = parsed.port
        pg_db = parsed.path.lstrip("/") if parsed.path else None

        conn_kwargs = {}
        if pg_host:
            conn_kwargs["host"] = pg_host
        if pg_port:
            conn_kwargs["port"] = pg_port
        if pg_db:
            conn_kwargs["dbname"] = pg_db
        if pg_user:
            conn_kwargs["user"] = pg_user
        if pg_password:
            conn_kwargs["password"] = pg_password

        conn_kwargs["sslmode"] = "require"
        pg_conn = None
        # First try psycopg2 (binary). If it fails, fall back to pg8000 (pure-Python).
        if psycopg2 is not None:
            print("尝试使用 psycopg2 连接 Postgres...")
            try:
                pg_conn = psycopg2.connect(**conn_kwargs)
                pg_conn.autocommit = True
                print("psycopg2 连接成功（未回显凭证）。")
            except Exception as exc:
                print("psycopg2 连接错误:", repr(exc))
                pg_conn = None

        if pg_conn is None and pg8000 is not None:
            print("尝试使用 pg8000 连接 Postgres（psycopg2 失败或不可用）...")
            try:
                # pg8000 expects database=..., use same keys
                kw = {}
                if "host" in conn_kwargs:
                    kw["host"] = conn_kwargs["host"]
                if "port" in conn_kwargs:
                    kw["port"] = conn_kwargs["port"]
                if "dbname" in conn_kwargs:
                    kw["database"] = conn_kwargs["dbname"]
                if "user" in conn_kwargs:
                    kw["user"] = conn_kwargs["user"]
                if "password" in conn_kwargs:
                    kw["password"] = conn_kwargs["password"]
                # pg8000 uses ssl=True for SSL
                kw["ssl"] = True
                try:
                    pg_conn = pg8000.connect(**kw)
                    print("pg8000 连接成功（未回显凭证）。")
                except Exception as exc:
                    print("pg8000 连接错误:", repr(exc))
                    pg_conn = None

        if pg_conn is None:
            print("无法连接到 Postgres，请检查连接串或本地网络（不回显连接串）。")
            return

    if not args.dry_run and pg_conn is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            print("请先在 backend/.env 中配置 SUPABASE_URL 与 SUPABASE_SERVICE_ROLE_KEY，或提供 --pg-uri")
            return
        client = supabase.create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    # 使用按文件流式导入（支持断点续传与批次重试）
    total_candidates, inserted_total = stream_import_by_file(src, client=client, pg_conn=pg_conn, dry_run=args.dry_run, batch_size=200, resume=args.resume, limit=args.limit)

    if args.dry_run:
        print(f"扫描完成。发现可能的文章条目: {total_candidates}（未写入，dry-run）")
    else:
        print(f"导入完成。共发现候选条目: {total_candidates}，已插入 {inserted_total} 条")


if __name__ == "__main__":
    main()

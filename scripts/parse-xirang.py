#!/usr/bin/env python3
"""
xirang 全分类解析脚本

支持：诗集/词集/词话/诗话/对联/剧曲/楚辞/汉赋 8 大类
- 多卷本（子目录）→ 1 本书
- 单卷本（根目录 .md）→ 1 本书
- 自动跳过 .jpg / .png / README.md
- 楚辞有多个版本（章句/补注/集注/山带阁注/疏证/集注辩证），每版都入库（slug 加版本后缀）
- 词话/诗话有部分单卷本和 part1-N 多卷本混合

执行：python scripts/parse-xirang.py [category1 category2 ...]
默认解析所有 8 类
"""

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "xirang-main" / "docs" / "诗藏"
OUTPUT_FILE = ROOT / "src" / "data" / "xirang-cache.json"

sys.path.insert(0, str(ROOT / "scripts"))
import xirang_meta as M  # noqa: E402

# 跳过的非文本文件
SKIP_SUFFIX = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}
SKIP_NAMES = {"README.md", "README .md", "readme.md", "介绍.md", "介绍 .md"}


def strip_frontmatter(text: str) -> tuple[str, dict]:
    if not text.startswith("---"):
        return text, {}
    end = text.find("\n---", 3)
    if end == -1:
        return text, {}
    front = text[3:end].strip()
    body = text[end + 4 :].lstrip("\n")
    meta = {}
    for line in front.split("\n"):
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    return body, meta


def split_into_paragraphs(text: str) -> list[str]:
    text = re.sub(r"^# (.+)$", r"\1", text, flags=re.MULTILINE)
    text = re.sub(r"^## (.+)$", r"\1", text, flags=re.MULTILINE)
    text = re.sub(r"^### (.+)$", r"\1", text, flags=re.MULTILINE)
    paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    return paras


def extract_chapter_title(filename: str, body: str) -> str:
    for pat, prefix in [(r"^# (.+)$", 2), (r"^## (.+)$", 3), (r"^### (.+)$", 4)]:
        m = re.search(pat, body, re.MULTILINE)
        if m:
            return m.group(0)[prefix:].strip()
    return filename.replace(".md", "")


def parse_one_md(md_path: Path, book_title: str, chapter_urn: str, sort_order: int) -> dict:
    raw = md_path.read_text(encoding="utf-8")
    body, _ = strip_frontmatter(raw)
    title = extract_chapter_title(md_path.name, body)
    paragraphs = split_into_paragraphs(body)
    return {
        "urn": chapter_urn,
        "title": title,
        "paragraphs": paragraphs,
        "hasUnresolvedChars": False,
        "sort_order": sort_order,
        "byte_size": len(raw),
    }


def parse_subdir_book(subdir: Path, xirang_category: str) -> dict | None:
    book_title = subdir.name
    md_files = sorted(
        f for f in subdir.iterdir()
        if f.suffix == ".md" and f.name.strip() not in SKIP_NAMES
    )
    if not md_files:
        return None
    meta = M.CIHUA_META.get(book_title) or M.DUILIAN_META.get(book_title) \
        or M.SHIHUA_META.get(book_title) or M.CHUGI_META.get(book_title) \
        or M.JUQU_META.get(book_title) or M.CIJI_META.get(book_title) \
        or M.SHIJI_META.get(book_title) or M.HANFU_META.get(book_title) \
        or {}
    author = meta.get("author", "未知")
    dynasty = meta.get("dynasty", "未知")
    brief = meta.get("brief", "")
    category = M.CATEGORY_MAP.get(xirang_category, "其他")
    chapters = []
    for idx, md in enumerate(md_files):
        urn = f"{M.to_slug(book_title)}::{md.stem}"
        chapters.append(parse_one_md(md, book_title, urn, idx))
    return {
        "slug": M.to_slug(book_title),
        "title": book_title,
        "author": author,
        "dynasty": dynasty,
        "category": category,
        "brief": brief,
        "hasDetail": True,
        "chapters": chapters,
    }


def parse_flat_book(md_path: Path, xirang_category: str) -> dict:
    file_stem = md_path.stem
    meta = M.CIHUA_META.get(file_stem) or M.DUILIAN_META.get(file_stem) \
        or M.SHIHUA_META.get(file_stem) or M.CHUGI_META.get(file_stem) \
        or M.JUQU_META.get(file_stem) or M.CIJI_META.get(file_stem) \
        or M.SHIJI_META.get(file_stem) or M.HANFU_META.get(file_stem) \
        or {}
    if not meta:
        meta = M.parse_filename(file_stem)
    author = meta.get("author", "未知")
    dynasty = meta.get("dynasty", "未知")
    brief = meta.get("brief", "")
    category = M.CATEGORY_MAP.get(xirang_category, "其他")
    chapter = parse_one_md(
        md_path, file_stem, f"{M.to_slug(file_stem)}::正文", 0
    )
    return {
        "slug": M.to_slug(file_stem),
        "title": meta.get("title", file_stem),
        "author": author,
        "dynasty": dynasty,
        "category": category,
        "brief": brief,
        "hasDetail": False,
        "chapters": [chapter],
    }


def parse_category(category_dir: Path) -> list[dict]:
    xirang_cat = category_dir.name
    books: list[dict] = []
    for entry in sorted(category_dir.iterdir()):
        if entry.suffix.lower() in SKIP_SUFFIX:
            continue
        if entry.is_dir():
            book = parse_subdir_book(entry, xirang_cat)
            if book:
                books.append(book)
        elif entry.suffix == ".md" and entry.name.strip() not in SKIP_NAMES:
            books.append(parse_flat_book(entry, xirang_cat))
    return books


def main():
    if not SOURCE_DIR.is_dir():
        print(f"ERROR: 找不到 {SOURCE_DIR}", file=sys.stderr)
        sys.exit(1)

    if len(sys.argv) > 1:
        target_cats = sys.argv[1:]
    else:
        target_cats = ["对联", "词话", "诗话", "楚辞", "剧曲", "词集", "诗集", "汉赋"]

    all_books: list[dict] = []
    seen_slugs: set[str] = set()
    for cat in target_cats:
        cat_dir = SOURCE_DIR / cat
        if not cat_dir.is_dir():
            print(f"WARN: {cat_dir} 不存在，跳过", file=sys.stderr)
            continue
        print(f"[parse] 分类 {cat}...")
        books = parse_category(cat_dir)
        # 去重：slug 冲突时加 category 后缀
        for b in books:
            if b["slug"] in seen_slugs:
                new_slug = f"xirang-{b['category']}-" + b["slug"].removeprefix("xirang-")
                print(
                    f"  ⚠ slug 冲突 {b['slug']} → {new_slug} ({b['title']})",
                    file=sys.stderr,
                )
                b["slug"] = new_slug
                # 同步更新 chapters 的 urn
                for ch in b["chapters"]:
                    parts = ch["urn"].split("::", 1)
                    if len(parts) == 2:
                        ch["urn"] = f"{new_slug}::{parts[1]}"
            seen_slugs.add(b["slug"])
        print(f"  → {len(books)} 本 / {sum(len(b['chapters']) for b in books)} 章")
        all_books.extend(books)

    total_chapters = sum(len(b["chapters"]) for b in all_books)
    total_paras = sum(
        len(c["paragraphs"]) for b in all_books for c in b["chapters"]
    )
    total_bytes = sum(
        sum(c.get("byte_size", 0) for c in b["chapters"]) for b in all_books
    )

    out = {
        "source": "xirang (ruguoaaa/xirang)",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "books": all_books,
    }
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(
        json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"\n[parse] ✓ 全部完成")
    print(f"  books: {len(all_books)}")
    print(f"  chapters: {total_chapters}")
    print(f"  paragraphs: {total_paras:,}")
    print(f"  bytes: {total_bytes/1024/1024:.2f} MB")
    print(f"  → {OUTPUT_FILE}")

    print(f"\n[parse] 抽样 3 本：")
    for b in all_books[:3]:
        print(
            f"  - {b['title']} ({b['author']} / {b['dynasty']} / {b['category']}) "
            f"→ {len(b['chapters'])} 章"
        )


if __name__ == "__main__":
    main()

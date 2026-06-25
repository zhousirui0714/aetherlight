#!/usr/bin/env python3
"""抽样 + 冲突检查"""
import json
from collections import Counter

ROOT = "D:/zhousirui/新建文件夹 (2)/溯光Aetherlight"

# 加载 xirang 缓存
d = json.load(open(f"{ROOT}/src/data/xirang-cache.json", encoding="utf-8"))
print(f"xirang: {len(d['books'])} 本 / {sum(len(b['chapters']) for b in d['books'])} 章")

# 加载 Reservator 缓存（用于 slug 冲突）
try:
    r = json.load(open(f"{ROOT}/src/data/reservator-cache.json", encoding="utf-8"))
    existing_slugs = {b["slug"] for b in r["books"]}
    print(f"reservator: {len(r['books'])} 本 (已有 slug: {len(existing_slugs)})")
except Exception as e:
    print(f"reservator cache not found: {e}")
    existing_slugs = set()

# 冲突检查
collisions = []
for b in d["books"]:
    if b["slug"] in existing_slugs:
        collisions.append(b["slug"])
if collisions:
    print(f"⚠ SLUG 冲突: {collisions}")
else:
    print(f"✓ 无 slug 冲突 (slug 全部以 xirang- 前缀开头)")

# 抽样 1 章
print("\n=== 抽样: 人间词话 ===")
for b in d["books"]:
    if b["title"] == "人间词话":
        ch = b["chapters"][0]
        print(f"  slug: {b['slug']}")
        print(f"  title: {b['title']}")
        print(f"  author: {b['author']} / dynasty: {b['dynasty']} / category: {b['category']}")
        print(f"  brief: {b['brief']}")
        print(f"  chapter urn: {ch['urn']}")
        print(f"  chapter title: {ch['title']}")
        print(f"  paragraphs ({len(ch['paragraphs'])}):")
        for p in ch['paragraphs'][:3]:
            print(f"    > {p[:80]}")
        break

print("\n=== 抽样: 声律启蒙 ===")
for b in d["books"]:
    if b["title"] == "声律启蒙":
        ch = b["chapters"][0]
        print(f"  slug: {b['slug']}")
        print(f"  author: {b['author']} / dynasty: {b['dynasty']} / category: {b['category']}")
        print(f"  brief: {b['brief']}")
        print(f"  chapter urn: {ch['urn']}")
        print(f"  chapter title: {ch['title']}")
        print(f"  paragraphs ({len(ch['paragraphs'])}):")
        for p in ch['paragraphs'][:3]:
            print(f"    > {p[:80]}")
        break

# 分类分布
print("\n=== 分类分布 ===")
cats = Counter(b["category"] for b in d["books"])
for c, n in cats.most_common():
    print(f"  {c}: {n} 本")

# 朝代分布
print("\n=== 朝代分布 ===")
dyns = Counter(b["dynasty"] for b in d["books"])
for dn, n in dyns.most_common():
    print(f"  {dn}: {n} 本")

# 章数 Top 5
print("\n=== 章数 Top 5 ===")
top = sorted(d["books"], key=lambda b: -len(b["chapters"]))[:5]
for b in top:
    print(f"  {b['title']} → {len(b['chapters'])} 章")

#!/usr/bin/env python3
"""xirang 抽样验证"""
import json
import os
import requests

URL = "https://ozshflujnxonhfwdtunp.supabase.co"
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}

print("=== 抽样 5 本 ===")
for slug in [
    "xirang-人间词话",
    "xirang-沧浪诗话",
    "xirang-西厢记",
    "xirang-全宋词",
    "xirang-声律启蒙",
]:
    r = requests.get(
        f"{URL}/rest/v1/knowledge_books?select=title,author,dynasty,category,chapter_count,brief&slug=eq.{slug}&limit=1",
        headers=H,
    ).json()
    if r:
        b = r[0]
        brief = b["brief"][:40] if b["brief"] else "(无简介)"
        print(
            f"  {b['title']} | {b['author']} / {b['dynasty']} / {b['category']}"
            f" | {b['chapter_count']} 章 | brief: {brief}..."
        )

print("\n=== 抽样 1 章（人间词话）===")
r = requests.get(
    f"{URL}/rest/v1/knowledge_book_chapters?select=urn,title,paragraphs&book_slug=eq.xirang-人间词话&limit=1",
    headers=H,
).json()
if r:
    c = r[0]
    print(f"  urn: {c['urn']}")
    print(f"  title: {c['title']}")
    print(f"  paragraphs: {len(c['paragraphs'])}")
    print(f"  first 3 paras:")
    for p in c["paragraphs"][:3]:
        print(f"    > {p[:80]}")

#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
知识长廊数据生成脚本
将 chinese-poetry 数据整合到溯光知识长廊
"""

import json
import os
from datetime import datetime

# 数据路径
POETRY_ROOT = os.path.join(os.path.dirname(__file__), '..', 'chinese-poetry-master')
BACKEND_DATA = os.path.join(os.path.dirname(__file__), '..', 'backend', 'data')
BACKEND_DB = os.path.join(os.path.dirname(__file__), '..', 'backend', 'db')

def load_json(filepath):
    """安全加载 JSON 文件"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"  读取失败: {e}")
        return None

def load_shijing():
    """读取诗经"""
    filepath = os.path.join(POETRY_ROOT, '诗经', 'shijing.json')
    data = load_json(filepath)
    if not data:
        return []

    articles = []
    for i, item in enumerate(data):
        article = {
            "id": f"shijing-{i}",
            "title": item.get('title', ''),
            "category": "诗词",
            "excerpt": (item.get('content', [''])[0] or '')[:50] + '...',
            "body": f"【{item.get('chapter', '')} · {item.get('section', '')}】\n\n" + '\n'.join(item.get('content', [])),
            "favorites": 500 + (i * 7) % 3000,
            "cover": "🪶",
            "source": "诗经",
            "author": "佚名",
            "tags": [item.get('chapter', ''), item.get('section', ''), "诗经", "国风"],
            "created_at": f"2025-01-{min(28, i+1):02d}T00:00:00Z"
        }
        articles.append(article)
    return articles

def load_lunyu():
    """读取论语"""
    filepath = os.path.join(POETRY_ROOT, '论语', 'lunyu.json')
    data = load_json(filepath)
    if not data:
        return []

    articles = []
    for i, item in enumerate(data):
        article = {
            "id": f"lunyu-{i}",
            "title": item.get('chapter', f'论语第{i+1}篇'),
            "category": "典籍",
            "excerpt": (item.get('content', '') or '')[:50] + '...',
            "body": f"【{item.get('chapter', '')}】\n\n{item.get('content', '')}",
            "favorites": 300 + (i * 11) % 2000,
            "cover": "📜",
            "source": "论语",
            "author": "孔子及其弟子",
            "tags": ["论语", "孔子", "儒家", "典籍"],
            "created_at": f"2025-02-{min(28, i+1):02d}T00:00:00Z"
        }
        articles.append(article)
    return articles

def load_chuci():
    """读取楚辞"""
    filepath = os.path.join(POETRY_ROOT, '楚辞', 'chuci.json')
    data = load_json(filepath)
    if not data:
        return []

    articles = []
    for i, item in enumerate(data):
        content = item.get('content', '') or ''
        if isinstance(content, list):
            content = '\n'.join(content)
        article = {
            "id": f"chuci-{i}",
            "title": item.get('title', ''),
            "category": "诗词",
            "excerpt": content[:50] + '...' if len(content) > 50 else content,
            "body": f"【{item.get('section', '楚辞')}】\n\n{content}",
            "favorites": 400 + (i * 13) % 2500,
            "cover": "🌿",
            "source": "楚辞",
            "author": item.get('author', '屈原'),
            "tags": ["楚辞", "屈原", item.get('title', '')],
            "created_at": f"2025-03-{min(28, i+1):02d}T00:00:00Z"
        }
        articles.append(article)
    return articles

def load_tangshi_300():
    """读取唐诗三百首"""
    filepath = os.path.join(POETRY_ROOT, '全唐诗', '唐诗三百首.json')
    data = load_json(filepath)
    if not data:
        return []

    articles = []
    for i, item in enumerate(data):
        content = item.get('content', '') or ''
        article = {
            "id": f"tangshi-300-{i}",
            "title": f"{item.get('title', '')} · {item.get('author', '佚名')}",
            "category": "诗词",
            "excerpt": content[:50] + '...' if len(content) > 50 else content,
            "body": f"【{item.get('title', '')}】\n唐 · {item.get('author', '佚名')}\n\n{content}",
            "favorites": 1000 + (i * 17) % 5000,
            "cover": "📜",
            "source": "唐诗三百首",
            "author": item.get('author', '佚名'),
            "tags": ["唐诗", "诗词", item.get('author', '佚名')],
            "created_at": f"2025-04-{min(28, i+1):02d}T00:00:00Z"
        }
        articles.append(article)
    return articles

def load_songci_300():
    """读取宋词三百首"""
    filepath = os.path.join(POETRY_ROOT, '宋词', '宋词三百首.json')
    data = load_json(filepath)
    if not data:
        return []

    articles = []
    for i, item in enumerate(data):
        content = item.get('content', '')
        if not content and item.get('paragraphs'):
            content = '\n'.join(item['paragraphs'])
        article = {
            "id": f"songci-300-{i}",
            "title": f"{item.get('title', '')} · {item.get('author', '佚名')}",
            "category": "诗词",
            "excerpt": (content or '')[:50] + '...' if len(content or '') > 50 else content,
            "body": f"【{item.get('title', '')}】\n宋 · {item.get('author', '佚名')}\n\n{content}",
            "favorites": 800 + (i * 19) % 4000,
            "cover": "🌸",
            "source": "宋词三百首",
            "author": item.get('author', '佚名'),
            "tags": ["宋词", "词", item.get('author', '佚名')],
            "created_at": f"2025-05-{min(28, i+1):02d}T00:00:00Z"
        }
        articles.append(article)
    return articles

def load_yuanqu():
    """读取元曲（取前100首）"""
    filepath = os.path.join(POETRY_ROOT, '元曲', 'yuanqu.json')
    data = load_json(filepath)
    if not data:
        return []

    articles = []
    data = data[:100]  # 取前100首
    for i, item in enumerate(data):
        content = item.get('content', '')
        if not content and item.get('paragraphs'):
            content = '\n'.join(item['paragraphs'])
        article = {
            "id": f"yuanqu-{i}",
            "title": item.get('title', f'元曲{i+1}'),
            "category": "诗词",
            "excerpt": (content or '')[:50] + '...' if len(content or '') > 50 else content,
            "body": f"【{item.get('title', '')}】\n元 · {item.get('author', '佚名')}\n\n{content}",
            "favorites": 300 + (i * 23) % 2000,
            "cover": "🎭",
            "source": "元曲",
            "author": item.get('author', '佚名'),
            "tags": ["元曲", "戏曲", item.get('author', '佚名')],
            "created_at": f"2025-06-{min(28, i+1):02d}T00:00:00Z"
        }
        articles.append(article)
    return articles

def load_youmengying():
    """读取幽梦影（取前100则）"""
    filepath = os.path.join(POETRY_ROOT, '幽梦影', 'youmengying.json')
    data = load_json(filepath)
    if not data:
        return []

    articles = []
    data = data[:100]  # 取前100则
    for i, item in enumerate(data):
        content = item.get('content', '') or item.get('text', '')
        article = {
            "id": f"youmengying-{i}",
            "title": f"幽梦影 · 第{i+1}则",
            "category": "典籍",
            "excerpt": (content or '')[:50] + '...' if len(content or '') > 50 else content,
            "body": f"【幽梦影】\n\n{content}\n\n—— 张潮",
            "favorites": 200 + (i * 29) % 1500,
            "cover": "🌙",
            "source": "幽梦影",
            "author": "张潮",
            "tags": ["幽梦影", "张潮", "明清文学"],
            "created_at": f"2025-07-{min(28, i+1):02d}T00:00:00Z"
        }
        articles.append(article)
    return articles

def load_nalan():
    """读取纳兰性德"""
    filepath = os.path.join(POETRY_ROOT, '纳兰性德', '纳兰性德诗集.json')
    data = load_json(filepath)
    if not data:
        return []

    articles = []
    for i, item in enumerate(data):
        content = item.get('content', '') or ''
        article = {
            "id": f"nalan-{i}",
            "title": item.get('title', f'纳兰词{i+1}'),
            "category": "诗词",
            "excerpt": content[:50] + '...' if len(content) > 50 else content,
            "body": f"【{item.get('title', '')}】\n清 · 纳兰性德\n\n{content}",
            "favorites": 600 + (i * 31) % 3500,
            "cover": "💧",
            "source": "纳兰性德诗集",
            "author": "纳兰性德",
            "tags": ["纳兰词", "清词", "纳兰性德"],
            "created_at": f"2025-08-{min(28, i+1):02d}T00:00:00Z"
        }
        articles.append(article)
    return articles

def load_sishu_wujing():
    """读取四书五经"""
    articles = []

    # 大学
    filepath = os.path.join(POETRY_ROOT, '四书五经', 'daxue.json')
    data = load_json(filepath)
    if data:
        for i, item in enumerate(data):
            content = item.get('content', '') or ''
            article = {
                "id": f"daxue-{i}",
                "title": item.get('chapter', '大学'),
                "category": "典籍",
                "excerpt": content[:50] + '...' if len(content) > 50 else content,
                "body": f"【大学】\n\n{content}",
                "favorites": 800 + i * 50,
                "cover": "📜",
                "source": "四书五经",
                "author": "曾子",
                "tags": ["四书", "大学", "儒家"],
                "created_at": f"2025-09-{min(28, i+1):02d}T00:00:00Z"
            }
            articles.append(article)

    # 中庸
    filepath = os.path.join(POETRY_ROOT, '四书五经', 'zhongyong.json')
    data = load_json(filepath)
    if data:
        for i, item in enumerate(data):
            content = item.get('content', '') or ''
            article = {
                "id": f"zhongyong-{i}",
                "title": item.get('chapter', '中庸'),
                "category": "典籍",
                "excerpt": content[:50] + '...' if len(content) > 50 else content,
                "body": f"【中庸】\n\n{content}",
                "favorites": 750 + i * 45,
                "cover": "📜",
                "source": "四书五经",
                "author": "子思",
                "tags": ["四书", "中庸", "儒家"],
                "created_at": f"2025-09-{min(28, i+50):02d}T00:00:00Z"
            }
            articles.append(article)

    # 孟子
    filepath = os.path.join(POETRY_ROOT, '四书五经', 'mengzi.json')
    data = load_json(filepath)
    if data:
        for i, item in enumerate(data):
            content = item.get('content', '') or ''
            article = {
                "id": f"mengzi-{i}",
                "title": item.get('chapter', '孟子'),
                "category": "典籍",
                "excerpt": content[:50] + '...' if len(content) > 50 else content,
                "body": f"【{item.get('chapter', '孟子')}】\n\n{content}",
                "favorites": 700 + i * 40,
                "cover": "📜",
                "source": "四书五经",
                "author": "孟子及其弟子",
                "tags": ["四书", "孟子", "儒家"],
                "created_at": f"2025-10-{min(28, i+1):02d}T00:00:00Z"
            }
            articles.append(article)

    return articles

def main():
    """主函数"""
    print("=" * 60)
    print("溯光知识长廊数据生成脚本")
    print("=" * 60)
    print()

    articles = []

    # 加载各类数据
    loaders = [
        ("诗经", load_shijing),
        ("论语", load_lunyu),
        ("楚辞", load_chuci),
        ("唐诗三百首", load_tangshi_300),
        ("宋词三百首", load_songci_300),
        ("元曲", load_yuanqu),
        ("幽梦影", load_youmengying),
        ("纳兰性德", load_nalan),
        ("四书五经", load_sishu_wujing),
    ]

    for name, loader in loaders:
        print(f"正在读取 {name}...")
        try:
            data = loader()
            if data:
                articles.extend(data)
                print(f"  ✓ 成功读取 {len(data)} 篇")
            else:
                print(f"  ✗ 读取失败或数据为空")
        except Exception as e:
            print(f"  ✗ 错误: {e}")

    # 读取现有的知识文章
    existing_file = os.path.join(BACKEND_DATA, 'knowledge_articles.json')
    if os.path.exists(existing_file):
        print(f"\n正在读取现有知识文章...")
        with open(existing_file, 'r', encoding='utf-8') as f:
            existing = json.load(f)
        print(f"  ✓ 成功读取 {len(existing)} 篇")
        articles.extend(existing)

    # 去重
    seen_ids = set()
    unique_articles = []
    for item in articles:
        if item['id'] not in seen_ids:
            seen_ids.add(item['id'])
            unique_articles.append(item)

    print(f"\n总计: {len(unique_articles)} 篇文章")
    print()

    # 保存完整数据
    os.makedirs(BACKEND_DATA, exist_ok=True)
    output_file = os.path.join(BACKEND_DATA, 'knowledge_articles_full.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(unique_articles, f, ensure_ascii=False, indent=2)
    print(f"✓ 已保存到: {output_file}")

    # 生成 SQL 导入脚本
    os.makedirs(BACKEND_DB, exist_ok=True)
    sql_file = os.path.join(BACKEND_DB, 'seed_poetry_data.sql')

    with open(sql_file, 'w', encoding='utf-8') as f:
        f.write(f"-- 诗词典籍数据导入\n")
        f.write(f"-- 生成时间: {datetime.now().isoformat()}\n")
        f.write(f"-- 总计: {len(unique_articles)} 篇文章\n\n")

        for item in unique_articles:
            tags = item.get('tags', [])
            tags_str = '{' + ','.join(f'"{t}"' for t in tags) + '}'

            body = (item.get('body') or '').replace("'", "''").replace("\n", "\\n")
            excerpt = (item.get('excerpt') or '').replace("'", "''")
            title = (item.get('title') or '').replace("'", "''")

            f.write(f"""INSERT INTO knowledge_articles (id, title, category, excerpt, body, cover, source, author, tags, favorites, created_at)
VALUES (
  '{item['id']}',
  E'{title}',
  '{item.get('category', '诗词')}',
  E'{excerpt}',
  E'{body}',
  '{item.get('cover', '📜')}',
  '{item.get('source', '')}',
  '{item.get('author', '匿名')}',
  ARRAY{tags_str}::text[],
  {item.get('favorites', 0)},
  '{item.get('created_at', datetime.now().isoformat())}'
) ON CONFLICT (id) DO NOTHING;

""")

    print(f"✓ SQL脚本已保存到: {sql_file}")

    # 生成前端数据
    frontend_data = []
    for item in unique_articles[:200]:  # 前端只保留200篇
        frontend_data.append({
            "id": item['id'],
            "title": item['title'],
            "category": item['category'],
            "excerpt": item['excerpt'],
            "content": item['body'],
            "favorites": item['favorites'],
            "cover": item['cover']
        })

    frontend_file = os.path.join(os.path.dirname(__file__), '..', 'src', 'lib', 'knowledge-data-full.ts')
    os.makedirs(os.path.dirname(frontend_file), exist_ok=True)

    with open(frontend_file, 'w', encoding='utf-8') as f:
        f.write("// 知识长廊完整数据\n")
        f.write(f"// 共 {len(frontend_data)} 篇文章\n\n")
        f.write("export interface Article {\n")
        f.write("  id: string;\n")
        f.write("  title: string;\n")
        f.write("  category: string;\n")
        f.write("  excerpt: string;\n")
        f.write("  content: string;\n")
        f.write("  favorites: number;\n")
        f.write("  cover: string;\n")
        f.write("}\n\n")
        f.write(f"export const ARTICLES_FULL: Article[] = {json.dumps(frontend_data, ensure_ascii=False, indent=2)} as const;\n")

    print(f"✓ 前端数据已保存到: {frontend_file}")

    print()
    print("=" * 60)
    print("生成完成！")
    print("=" * 60)

if __name__ == '__main__':
    main()

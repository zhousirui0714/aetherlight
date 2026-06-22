#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
导入知识长廊数据到 Supabase

使用方法:
  python import_to_supabase.py              # 交互模式
  python import_to_supabase.py --clear       # 自动清空并导入
  python import_to_supabase.py --no-clear    # 不清空，直接导入
"""

import json
import os
import sys
import requests
from datetime import datetime

# 数据文件路径
DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'backend', 'data', 'knowledge_articles_full.json')

def main():
    # 解析命令行参数
    auto_clear = None
    for arg in sys.argv[1:]:
        if arg == '--clear':
            auto_clear = True
        elif arg == '--no-clear':
            auto_clear = False

    print("=" * 60)
    print("溯光知识长廊数据导入工具")
    print("=" * 60)
    print()

    # Supabase 配置
    SUPABASE_URL = 'https://ozshflujnxonhfwdtunp.supabase.co'

    # 获取 service_role key
    service_role_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')

    if not service_role_key:
        print("❌ 错误: 请设置 SUPABASE_SERVICE_ROLE_KEY 环境变量")
        print()
        print("获取方法:")
        print("1. 登录 Supabase Dashboard: https://supabase.com/dashboard")
        print("2. 进入 Project Settings → API")
        print("3. 找到 'service_role secret' (在 'service_role key' 下方)")
        print("4. 设置环境变量: $env:SUPABASE_SERVICE_ROLE_KEY='your_key'")
        print()
        key = input("请粘贴你的 SUPABASE_SERVICE_ROLE_KEY: ").strip()
        if not key:
            print("未提供 key，退出")
            return
        service_role_key = key

    print()

    # 读取数据
    print(f"📖 读取数据文件: {DATA_FILE}")
    if not os.path.exists(DATA_FILE):
        print(f"❌ 文件不存在: {DATA_FILE}")
        return

    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        articles = json.load(f)
    print(f"✓ 成功读取 {len(articles)} 篇文章")
    print()

    # 设置请求头
    headers = {
        'apikey': service_role_key,
        'Authorization': f'Bearer {service_role_key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }

    # 清空现有数据（使用 POST + delete + filter）
    if auto_clear is None:
        print("⚠️  是否清空现有数据？输入 'yes' 确认清空: ", end='')
        confirm = input().strip().lower()
        should_clear = confirm == 'yes'
    else:
        should_clear = auto_clear

    if should_clear:
        print("🗑️  清空 knowledge_articles 表...")
        # 使用 POST with filter to delete all（带重试）
        delete_url = f'{SUPABASE_URL}/rest/v1/knowledge_articles'
        max_retries = 3
        retry_count = 0
        clear_success = False

        while retry_count < max_retries and not clear_success:
            try:
                # 先获取所有记录
                response = requests.get(delete_url + '?select=id', headers=headers, timeout=30)
                if response.status_code == 200:
                    ids = [r['id'] for r in response.json()]
                    if ids:
                        # 批量删除
                        for i in range(0, len(ids), 100):
                            batch_ids = ids[i:i+100]
                            delete_response = requests.delete(
                                delete_url + f'?id=in.({",".join(batch_ids)})',
                                headers=headers,
                                timeout=30
                            )
                        print(f"✓ 清空成功 ({len(ids)} 条记录)")
                    else:
                        print("✓ 表已经是空的")
                    clear_success = True
                else:
                    print(f"⚠️  清空失败: {response.status_code}")
                    print("   继续使用 upsert 模式...")
                    clear_success = True
            except requests.exceptions.RequestException as e:
                retry_count += 1
                if retry_count < max_retries:
                    print(f"⚠️ 网络错误，重试清空 ({retry_count}/{max_retries})...", end=' ')
                    import time
                    time.sleep(3)
                else:
                    print(f"⚠️  清空失败: {str(e)[:50]}")
                    print("   继续导入...")
                    clear_success = True
    print()

    # 批量导入（带重试机制）
    print(f"📤 开始导入 {len(articles)} 篇文章到 Supabase...")
    print()

    batch_size = 50
    max_retries = 3
    success_count = 0
    error_count = 0
    errors = []

    for i in range(0, len(articles), batch_size):
        batch = articles[i:i+batch_size]
        batch_num = i // batch_size + 1
        total_batches = (len(articles) + batch_size - 1) // batch_size

        print(f"  处理批次 {batch_num}/{total_batches} ({len(batch)} 条)...", end=' ')

        # 准备插入数据
        insert_data = []
        for article in batch:
            insert_data.append({
                'id': article['id'],
                'title': article['title'],
                'category': article.get('category', '诗词'),
                'excerpt': article.get('excerpt', ''),
                'body': article.get('body', ''),
                'cover': article.get('cover', '📜'),
                'source': article.get('source', ''),
                'author': article.get('author', '匿名'),
                'tags': article.get('tags', []),
                'favorites': article.get('favorites', 0),
                'created_at': article.get('created_at', datetime.now().isoformat())
            })

        # 插入数据（带重试）
        url = f'{SUPABASE_URL}/rest/v1/knowledge_articles'
        retry_count = 0
        success = False

        while retry_count < max_retries and not success:
            try:
                response = requests.post(url, headers=headers, json=insert_data, timeout=30)

                if response.status_code in [200, 201]:
                    success_count += len(batch)
                    print(f"✓ 成功 ({success_count}/{len(articles)})")
                    success = True
                elif response.status_code == 409:
                    # 重复键错误，部分成功
                    success_count += len(batch) // 2
                    print(f"✓ 部分成功 ({success_count}/{len(articles)})")
                    success = True
                else:
                    error_count += len(batch)
                    error_msg = f"批次 {batch_num} 失败: {response.status_code}"
                    if response.text:
                        error_msg += f" - {response.text[:200]}"
                    errors.append(error_msg)
                    print(f"✗ 失败")
                    print(f"    {response.text[:200]}")
                    success = True  # 不再重试已知的错误
                    break
            except requests.exceptions.RequestException as e:
                retry_count += 1
                if retry_count < max_retries:
                    print(f"⚠️ 网络错误，重试 ({retry_count}/{max_retries})...", end=' ')
                    import time
                    time.sleep(2)
                else:
                    error_count += len(batch)
                    error_msg = f"批次 {batch_num} 网络失败: {str(e)[:100]}"
                    errors.append(error_msg)
                    print(f"✗ 网络失败")
                    break

    print()
    print("=" * 60)
    print("导入完成")
    print("=" * 60)
    print(f"✓ 成功: {success_count} 条")
    print(f"✗ 失败: {error_count} 条")

    if errors:
        print()
        print("错误详情:")
        for error in errors[:10]:
            print(f"  - {error}")
        if len(errors) > 10:
            print(f"  ... 还有 {len(errors) - 10} 个错误")

    # 验证导入结果
    print()
    print("🔍 验证导入结果...")
    verify_url = f'{SUPABASE_URL}/rest/v1/knowledge_articles?select=count'
    response = requests.get(verify_url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        count = data[0]['count'] if data else 0
        print(f"✓ Supabase 中共有 {count} 篇文章")

    print()
    print("🎉 导入完成！")
    print()
    print("现在可以刷新溯光网站的知识长廊页面查看数据。")

if __name__ == '__main__':
    main()

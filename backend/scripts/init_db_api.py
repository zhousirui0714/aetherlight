"""
使用 Supabase REST API 初始化数据库
"""
import sys
import json
import requests
from pathlib import Path

# 设置标准输出编码为 UTF-8（解决 Windows PowerShell 编码问题）
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Supabase 配置
SUPABASE_URL = 'https://ozshflujnxonhfwdtunp.supabase.co'
SUPABASE_ANON_KEY = 'sb_publishable_wHFjXUg7E8WZ6lKVUKGU0g_eVZ_GwdL'

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent.parent

def create_table_via_api(table_name, data):
    """通过 REST API 创建表并插入数据"""
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }
    
    url = f'{SUPABASE_URL}/rest/v1/{table_name}'
    
    print(f"正在向 {table_name} 表插入数据...")
    
    try:
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code == 201:
            print(f"[OK] 成功插入 {len(data)} 条数据到 {table_name}")
            return True
        elif response.status_code == 409:
            print(f"[INFO] {table_name} 表数据已存在，尝试更新...")
            # 尝试更新数据
            for item in data:
                upsert_url = f'{SUPABASE_URL}/rest/v1/{table_name}?id=eq.{item.get("id")}'
                upsert_response = requests.patch(upsert_url, headers=headers, json=item)
                if upsert_response.status_code in [200, 204]:
                    print(f"[OK] 更新数据: {item.get('id')}")
                else:
                    print(f"[FAIL] 更新失败: {item.get('id')} - {upsert_response.status_code}")
            return True
        else:
            print(f"[FAIL] 插入失败: {response.status_code}")
            print(f"响应: {response.text}")
            return False
    except Exception as e:
        print(f"[FAIL] 请求失败: {e}")
        return False

def check_table_exists(table_name):
    """检查表是否存在"""
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
    }
    
    url = f'{SUPABASE_URL}/rest/v1/{table_name}?select=count'
    
    try:
        response = requests.head(url, headers=headers)
        return response.status_code != 404
    except:
        return False

def import_characters():
    """导入古人对话角色数据"""
    data_file = PROJECT_ROOT / 'backend' / 'data' / 'characters.json'
    print(f"读取角色数据: {data_file}")
    
    with open(data_file, 'r', encoding='utf-8') as f:
        characters = json.load(f)
    
    # 转换数据格式以匹配 Supabase 表结构
    formatted_data = []
    for char in characters:
        formatted_data.append({
            'id': char['id'],
            'name': char['name'],
            'title': char['title'],
            'avatar': char['avatar'],
            'dynasty': char['dynasty'],
            'style': char['style'],
            'style_tags': char['style_tags'],
            'excerpt': char['excerpt'],
            'bio': char['bio'],
            'birth_year': char['birth_year'],
            'death_year': char['death_year'],
            'works': json.dumps(char['works']),
            'famous_quotes': char['famous_quotes'],
            'system_prompt': char['system_prompt'],
            'is_active': char['is_active'],
            'dialogue_count': char['dialogue_count']
        })
    
    return create_table_via_api('characters', formatted_data)

def import_knowledge_articles():
    """导入知识文章数据"""
    data_file = PROJECT_ROOT / 'backend' / 'data' / 'knowledge_articles.json'
    print(f"读取知识文章数据: {data_file}")
    
    with open(data_file, 'r', encoding='utf-8') as f:
        articles = json.load(f)
    
    # 转换数据格式以匹配 Supabase 表结构
    formatted_data = []
    for article in articles:
        formatted_data.append({
            'id': article['id'],
            'title': article['title'],
            'category': article['category'],
            'excerpt': article['excerpt'],
            'body': article['body'],
            'cover': article['cover'],
            'source': article['source'],
            'author': article['author'],
            'tags': article['tags'],
            'favorites': article['favorites'],
            'created_at': article['created_at']
        })
    
    return create_table_via_api('knowledge_articles', formatted_data)

def verify_data():
    """验证数据上传成功"""
    print("\n验证数据...")
    
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
    }
    
    # 检查角色数据
    url = f'{SUPABASE_URL}/rest/v1/characters?select=count'
    try:
        response = requests.get(url, headers=headers, params={'select': 'count'})
        if response.status_code == 200:
            data = response.json()
            count = len(data) if isinstance(data, list) else 0
            print(f"角色数据: {count} 条")
        else:
            print(f"[FAIL] 无法获取角色数据: {response.status_code}")
    except Exception as e:
        print(f"[FAIL] 验证失败: {e}")
    
    # 检查知识文章数据
    url = f'{SUPABASE_URL}/rest/v1/knowledge_articles?select=count'
    try:
        response = requests.get(url, headers=headers, params={'select': 'count'})
        if response.status_code == 200:
            data = response.json()
            count = len(data) if isinstance(data, list) else 0
            print(f"知识文章数据: {count} 条")
        else:
            print(f"[FAIL] 无法获取知识文章数据: {response.status_code}")
    except Exception as e:
        print(f"[FAIL] 验证失败: {e}")

def main():
    """主函数"""
    print("=" * 60)
    print("溯光 Aetherlight - 数据库初始化 (REST API)")
    print("=" * 60)
    
    print("\n注意: 需要先在 Supabase Dashboard 中手动创建表")
    print("请访问: https://supabase.com/dashboard/project/ozshflujnxonhfwdtunp/sql")
    print("执行 backend/db/schema_all.sql 中的建表脚本")
    
    print("\n开始导入数据...")
    
    # 导入角色数据
    import_characters()
    
    # 导入知识文章数据
    import_knowledge_articles()
    
    # 验证数据
    verify_data()
    
    print("\n" + "=" * 60)
    print("数据导入完成")
    print("=" * 60)

if __name__ == "__main__":
    main()
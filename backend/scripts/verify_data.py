"""
验证 Supabase 数据
"""
import sys
import requests

# 设置标准输出编码为 UTF-8
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Supabase 配置
SUPABASE_URL = 'https://ozshflujnxonhfwdtunp.supabase.co'
SUPABASE_ANON_KEY = 'sb_publishable_wHFjXUg7E8WZ6lKVUKGU0g_eVZ_GwdL'

def get_table_count(table_name):
    """获取表记录数"""
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
    }
    
    # 使用 COUNT(*) 获取记录数
    url = f'{SUPABASE_URL}/rest/v1/{table_name}?select=count(*)'
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                return data[0].get('count', 0)
            return len(data)
        else:
            print(f"[FAIL] 获取 {table_name} 计数失败: {response.status_code}")
            return None
    except Exception as e:
        print(f"[FAIL] 请求失败: {e}")
        return None

def get_sample_data(table_name, limit=3):
    """获取表的样本数据"""
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
    }
    
    url = f'{SUPABASE_URL}/rest/v1/{table_name}?limit={limit}'
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"[FAIL] 获取 {table_name} 样本数据失败: {response.status_code}")
            return None
    except Exception as e:
        print(f"[FAIL] 请求失败: {e}")
        return None

def main():
    """主函数"""
    print("验证 Supabase 数据")
    print("=" * 60)
    
    tables = [
        ('characters', '古人角色'),
        ('knowledge_articles', '知识文章'),
        ('community_rooms', '社区房间'),
        ('qa_questions', '问答题目')
    ]
    
    for table_name, description in tables:
        count = get_table_count(table_name)
        if count is not None:
            print(f"\n{description} ({table_name}): {count} 条记录")
            
            # 获取样本数据
            sample = get_sample_data(table_name, 3)
            if sample and isinstance(sample, list):
                print("样本数据:")
                for item in sample[:3]:
                    # 根据表类型显示不同字段
                    if table_name == 'characters':
                        print(f"  - {item.get('name')} ({item.get('title')})")
                    elif table_name == 'knowledge_articles':
                        print(f"  - {item.get('title')}")
                    elif table_name == 'community_rooms':
                        print(f"  - {item.get('name')}")
                    elif table_name == 'qa_questions':
                        print(f"  - {item.get('question')[:30]}...")
    
    print("\n" + "=" * 60)
    print("验证完成")

if __name__ == "__main__":
    main()
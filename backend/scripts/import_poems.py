"""
从 chinese-poetry-master 导入诗词数据到 Supabase
"""
import os
import json
import uuid
import requests
import sys

# 设置标准输出编码
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Supabase 配置
SUPABASE_URL = 'https://ozshflujnxonhfwdtunp.supabase.co'
SUPABASE_ANON_KEY = 'sb_publishable_wHFjXUg7E8WZ6lKVUKGU0g_eVZ_GwdL'

# 数据目录
POETRY_DIR = 'd:/zhousirui/新建文件夹 (2)/溯光Aetherlight/chinese-poetry-master'

headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
    'Content-Type': 'application/json',
}

def create_poems_table():
    """创建 poems 表"""
    print("创建 poems 表...")
    url = f'{SUPABASE_URL}/rest/v1/'
    
    # 使用 POST 请求创建表（通过 schema 端点）
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS poems (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        dynasty TEXT,
        type TEXT NOT NULL,
        paragraphs TEXT[],
        rhythmic TEXT,
        tags TEXT[],
        content TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
    
    ALTER TABLE poems ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "poems_public_read" ON poems FOR SELECT USING (true);
    CREATE POLICY "poems_auth_write" ON poems FOR INSERT WITH CHECK (true);
    
    CREATE INDEX IF NOT EXISTS idx_poems_author ON poems(author);
    CREATE INDEX IF NOT EXISTS idx_poems_dynasty ON poems(dynasty);
    CREATE INDEX IF NOT EXISTS idx_poems_type ON poems(type);
    """
    
    # 使用存储过程执行 SQL
    url = f'{SUPABASE_URL}/rest/v1/rpc/execute_sql'
    data = {'query': create_table_sql}
    
    try:
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            print("[OK] poems 表创建成功")
            return True
        else:
            print(f"[FAIL] 创建表失败: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"[FAIL] 请求失败: {e}")
        return False

def import_tang_poems():
    """导入唐诗数据"""
    print("\n导入唐诗数据...")
    tang_files = [
        '全唐诗/唐诗三百首.json',
        '全唐诗/唐诗补录.json',
    ]
    
    total_imported = 0
    
    for file_path in tang_files:
        full_path = os.path.join(POETRY_DIR, file_path)
        if not os.path.exists(full_path):
            print(f"[SKIP] 文件不存在: {file_path}")
            continue
            
        print(f"处理文件: {file_path}")
        
        with open(full_path, 'r', encoding='utf-8') as f:
            poems = json.load(f)
            
        for poem in poems:
            try:
                poem_data = {
                    'id': poem.get('id', str(uuid.uuid4())),
                    'title': poem['title'],
                    'author': poem['author'],
                    'dynasty': '唐',
                    'type': '唐诗',
                    'paragraphs': poem.get('paragraphs', []),
                    'rhythmic': None,
                    'tags': poem.get('tags', []),
                    'content': '\n'.join(poem.get('paragraphs', []))
                }
                
                url = f'{SUPABASE_URL}/rest/v1/poems'
                response = requests.post(url, headers=headers, json=poem_data)
                
                if response.status_code in [200, 201]:
                    total_imported += 1
                else:
                    print(f"[WARN] 导入失败: {poem['title']} - {response.text}")
                    
            except Exception as e:
                print(f"[ERROR] 处理诗词失败: {e}")
    
    print(f"唐诗导入完成，共导入 {total_imported} 首")
    return total_imported

def import_song_ci():
    """导入宋词数据"""
    print("\n导入宋词数据...")
    ci_files = [
        '宋词/宋词三百首.json',
    ]
    
    total_imported = 0
    
    for file_path in ci_files:
        full_path = os.path.join(POETRY_DIR, file_path)
        if not os.path.exists(full_path):
            print(f"[SKIP] 文件不存在: {file_path}")
            continue
            
        print(f"处理文件: {file_path}")
        
        with open(full_path, 'r', encoding='utf-8') as f:
            cis = json.load(f)
            
        for ci in cis:
            try:
                ci_data = {
                    'id': str(uuid.uuid4()),
                    'title': ci.get('rhythmic', '') + '・' + ci.get('title', '') if ci.get('rhythmic') else ci.get('title', '无题'),
                    'author': ci['author'],
                    'dynasty': '宋',
                    'type': '宋词',
                    'paragraphs': ci.get('paragraphs', []),
                    'rhythmic': ci.get('rhythmic'),
                    'tags': ci.get('tags', []),
                    'content': '\n'.join(ci.get('paragraphs', []))
                }
                
                url = f'{SUPABASE_URL}/rest/v1/poems'
                response = requests.post(url, headers=headers, json=ci_data)
                
                if response.status_code in [200, 201]:
                    total_imported += 1
                else:
                    print(f"[WARN] 导入失败: {ci_data['title']} - {response.text}")
                    
            except Exception as e:
                print(f"[ERROR] 处理词失败: {e}")
    
    print(f"宋词导入完成，共导入 {total_imported} 首")
    return total_imported

def verify_import():
    """验证导入结果"""
    print("\n验证导入结果...")
    
    url = f'{SUPABASE_URL}/rest/v1/poems?select=count(*)'
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        total = data[0].get('count', 0)
        print(f"[OK] 诗词总数: {total}")
        
        # 按类型统计
        url_tang = f'{SUPABASE_URL}/rest/v1/poems?select=count(*)&type=eq.唐诗'
        url_song = f'{SUPABASE_URL}/rest/v1/poems?select=count(*)&type=eq.宋词'
        
        tang_count = requests.get(url_tang, headers=headers).json()[0].get('count', 0)
        song_count = requests.get(url_song, headers=headers).json()[0].get('count', 0)
        
        print(f"  - 唐诗: {tang_count} 首")
        print(f"  - 宋词: {song_count} 首")
        
        # 获取前5首诗作为样本
        url_sample = f'{SUPABASE_URL}/rest/v1/poems?limit=5'
        sample = requests.get(url_sample, headers=headers).json()
        
        print("\n样本数据:")
        for poem in sample:
            print(f"  - 《{poem['title']}》- {poem['author']}")
            if poem['paragraphs']:
                print(f"    {poem['paragraphs'][0]}...")
                
        return total
    else:
        print(f"[FAIL] 验证失败: {response.status_code}")
        return 0

def main():
    """主函数"""
    print("=" * 60)
    print("导入诗词数据到 Supabase")
    print("=" * 60)
    
    print("表已预先创建，跳过建表步骤")
    
    # 导入数据
    tang_count = import_tang_poems()
    song_count = import_song_ci()
    
    # 验证
    total = verify_import()
    
    print("\n" + "=" * 60)
    print(f"导入完成！共导入 {total} 首诗词")
    print(f"  - 唐诗: {tang_count} 首")
    print(f"  - 宋词: {song_count} 首")
    print("=" * 60)

if __name__ == "__main__":
    main()
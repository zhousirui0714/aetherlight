"""
批量导入诗词数据到 Supabase
"""
import os
import json
import uuid
import requests

# Supabase 配置
SUPABASE_URL = 'https://ozshflujnxonhfwdtunp.supabase.co'
SUPABASE_ANON_KEY = 'sb_publishable_wHFjXUg7E8WZ6lKVUKGU0g_eVZ_GwdL'

POETRY_DIR = 'd:/zhousirui/新建文件夹 (2)/溯光Aetherlight/chinese-poetry-master'

headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
    'Content-Type': 'application/json',
}

def load_tang_poems():
    """加载唐诗数据"""
    poems = []
    files = ['全唐诗/唐诗三百首.json']
    
    for f in files:
        path = os.path.join(POETRY_DIR, f)
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as fp:
                data = json.load(fp)
                poems.extend(data)
                print(f"加载 {f}: {len(data)} 首")
    return poems

def load_song_ci():
    """加载宋词数据"""
    cis = []
    files = ['宋词/宋词三百首.json']
    
    for f in files:
        path = os.path.join(POETRY_DIR, f)
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as fp:
                data = json.load(fp)
                cis.extend(data)
                print(f"加载 {f}: {len(data)} 首")
    return cis

def batch_import(items, item_type):
    """批量导入数据"""
    url = f'{SUPABASE_URL}/rest/v1/poems'
    total = len(items)
    success = 0
    
    for i, item in enumerate(items):
        try:
            if item_type == 'tang':
                data = {
                    'id': item.get('id', str(uuid.uuid4())),
                    'title': item['title'],
                    'author': item['author'],
                    'dynasty': '唐',
                    'type': '唐诗',
                    'paragraphs': item.get('paragraphs', []),
                    'rhythmic': None,
                    'tags': item.get('tags', []),
                    'content': '\n'.join(item.get('paragraphs', []))
                }
            else:
                rhythmic = item.get('rhythmic', '')
                title = rhythmic + '・' + item.get('title', '') if rhythmic else item.get('title', '无题')
                data = {
                    'id': str(uuid.uuid4()),
                    'title': title,
                    'author': item['author'],
                    'dynasty': '宋',
                    'type': '宋词',
                    'paragraphs': item.get('paragraphs', []),
                    'rhythmic': rhythmic,
                    'tags': item.get('tags', []),
                    'content': '\n'.join(item.get('paragraphs', []))
                }
            
            response = requests.post(url, headers=headers, json=data)
            if response.status_code in [200, 201]:
                success += 1
            
            if (i + 1) % 50 == 0:
                print(f"  已导入 {i+1}/{total}...")
                
        except Exception as e:
            print(f"  错误: {e}")
    
    print(f"  完成！成功导入 {success}/{total}")
    return success

def main():
    print("加载唐诗数据...")
    tang_poems = load_tang_poems()
    
    print("\n加载宋词数据...")
    song_cis = load_song_ci()
    
    print("\n导入唐诗...")
    tang_count = batch_import(tang_poems, 'tang')
    
    print("\n导入宋词...")
    song_count = batch_import(song_cis, 'song')
    
    print(f"\n总计: 唐诗 {tang_count} 首 + 宋词 {song_count} 首")

if __name__ == "__main__":
    main()
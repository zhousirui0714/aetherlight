import requests

SUPABASE_URL = 'https://ozshflujnxonhfwdtunp.supabase.co'
SUPABASE_ANON_KEY = 'sb_publishable_wHFjXUg7E8WZ6lKVUKGU0g_eVZ_GwdL'

headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
}

def check_table():
    url = f'{SUPABASE_URL}/rest/v1/poems?select=count(*)'
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        count = data[0].get('count', 0)
        print(f"poems 表记录数: {count}")
        
        url_sample = f'{SUPABASE_URL}/rest/v1/poems?limit=3'
        sample = requests.get(url_sample, headers=headers).json()
        
        if sample:
            print("\n样本数据:")
            for poem in sample:
                print(f"  - 《{poem['title']}》- {poem['author']}")
    else:
        print(f"请求失败: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    check_table()
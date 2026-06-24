import requests

url = 'https://ozshflujnxonhfwdtunp.supabase.co/rest/v1/knowledge_articles'
headers = {'apikey': 'sb_publishable_wHFjXUg7E8WZ6lKVUKGU0g_eVZ_GwdL'}

r = requests.get(url, headers=headers)
print('状态码:', r.status_code)
data = r.json()
print('记录数:', len(data))
for item in data[:5]:
    print('-', item['title'])
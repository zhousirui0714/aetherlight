"""
使用 Supabase SQL API 创建 characters 表并修复 knowledge_articles 表
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

def execute_sql(sql):
    """执行 SQL 语句"""
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json',
    }
    
    url = f'{SUPABASE_URL}/rest/v1/rpc/execute_sql'
    
    data = {
        'query': sql
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            print(f"[OK] SQL 执行成功")
            return True
        else:
            print(f"[FAIL] SQL 执行失败: {response.status_code}")
            print(f"响应: {response.text}")
            return False
    except Exception as e:
        print(f"[FAIL] 请求失败: {e}")
        return False

def main():
    """主函数"""
    print("创建 characters 表并修复 knowledge_articles 表")
    print("=" * 60)
    
    # 创建 characters 表
    create_characters_sql = """
    CREATE TABLE IF NOT EXISTS characters (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        title TEXT,
        avatar TEXT,
        dynasty TEXT,
        style TEXT[],
        style_tags TEXT[],
        excerpt TEXT,
        bio TEXT,
        birth_year TEXT,
        death_year TEXT,
        works JSONB,
        famous_quotes TEXT[],
        system_prompt TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        dialogue_count INTEGER DEFAULT 0
    );
    
    ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "characters_public_read" ON characters FOR SELECT USING (true);
    CREATE POLICY "characters_auth_write" ON characters FOR INSERT WITH CHECK (true);
    """
    
    print("\n1. 创建 characters 表...")
    execute_sql(create_characters_sql)
    
    # 修改 knowledge_articles 表的 id 字段类型为 TEXT
    # 需要先删除外键约束，修改字段，再重建约束
    print("\n2. 修改 knowledge_articles 表...")
    
    # 删除外键约束
    drop_fk_sql = """
    ALTER TABLE article_favorites DROP CONSTRAINT IF EXISTS article_favorites_article_id_fkey;
    ALTER TABLE article_embeddings DROP CONSTRAINT IF EXISTS article_embeddings_article_id_fkey;
    """
    execute_sql(drop_fk_sql)
    
    # 修改 knowledge_articles 的 id 字段类型
    alter_table_sql = """
    ALTER TABLE knowledge_articles ALTER COLUMN id TYPE TEXT;
    """
    execute_sql(alter_table_sql)
    
    # 重建外键约束
    add_fk_sql = """
    ALTER TABLE article_favorites ADD CONSTRAINT article_favorites_article_id_fkey FOREIGN KEY (article_id) REFERENCES knowledge_articles(id) ON DELETE CASCADE;
    ALTER TABLE article_embeddings ADD CONSTRAINT article_embeddings_article_id_fkey FOREIGN KEY (article_id) REFERENCES knowledge_articles(id) ON DELETE CASCADE;
    """
    execute_sql(add_fk_sql)
    
    print("\n" + "=" * 60)
    print("表结构修改完成")

if __name__ == "__main__":
    main()
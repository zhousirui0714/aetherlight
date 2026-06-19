"""
数据库初始化脚本：连接 Supabase，执行建表脚本，导入初始数据
"""
import os
import sys
import json
import psycopg2
from pathlib import Path

# 设置标准输出编码为 UTF-8（解决 Windows PowerShell 编码问题）
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 数据库连接配置
DB_CONFIG = {
    'host': 'db.ozshflujnxonhfwdtunp.supabase.co',
    'port': 5432,
    'database': 'postgres',
    'user': 'postgres',
    'password': 'liantaosr2246'
}

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent.parent

def connect_db():
    """连接数据库"""
    print("正在连接 Supabase PostgreSQL...")
    conn = psycopg2.connect(**DB_CONFIG)
    print("✓ 连接成功")
    return conn

def execute_schema(conn):
    """执行建表脚本"""
    schema_file = PROJECT_ROOT / 'backend' / 'db' / 'schema_all.sql'
    print(f"正在执行建表脚本: {schema_file}")
    
    # 尝试不同的编码
    encodings = ['utf-8', 'utf-8-sig', 'gbk', 'gb2312', 'latin-1']
    schema_sql = None
    
    for encoding in encodings:
        try:
            with open(schema_file, 'r', encoding=encoding) as f:
                schema_sql = f.read()
            print(f"✓ 使用编码 {encoding} 成功读取文件")
            break
        except UnicodeDecodeError:
            continue
    
    if schema_sql is None:
        raise Exception("无法读取建表脚本文件，尝试了所有编码")
    
    cursor = conn.cursor()
    try:
        cursor.execute(schema_sql)
        conn.commit()
        print("✓ 建表脚本执行成功")
    except Exception as e:
        conn.rollback()
        print(f"✗ 建表脚本执行失败: {e}")
        raise
    finally:
        cursor.close()

def import_characters(conn):
    """导入古人对话角色数据"""
    data_file = PROJECT_ROOT / 'backend' / 'data' / 'characters.json'
    print(f"正在导入角色数据: {data_file}")
    
    with open(data_file, 'r', encoding='utf-8') as f:
        characters = json.load(f)
    
    cursor = conn.cursor()
    
    # 检查是否已有 characters 表（如果没有则创建）
    cursor.execute("""
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
        )
    """)
    
    # 清空现有数据
    cursor.execute("DELETE FROM characters")
    
    # 插入数据
    for char in characters:
        cursor.execute("""
            INSERT INTO characters (
                id, name, title, avatar, dynasty, style, style_tags,
                excerpt, bio, birth_year, death_year, works,
                famous_quotes, system_prompt, is_active, dialogue_count
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            char['id'],
            char['name'],
            char['title'],
            char['avatar'],
            char['dynasty'],
            char['style'],
            char['style_tags'],
            char['excerpt'],
            char['bio'],
            char['birth_year'],
            char['death_year'],
            json.dumps(char['works']),
            char['famous_quotes'],
            char['system_prompt'],
            char['is_active'],
            char['dialogue_count']
        ))
    
    conn.commit()
    print(f"✓ 成功导入 {len(characters)} 个角色数据")
    cursor.close()

def import_knowledge_articles(conn):
    """导入知识文章数据"""
    data_file = PROJECT_ROOT / 'backend' / 'data' / 'knowledge_articles.json'
    print(f"正在导入知识文章数据: {data_file}")
    
    with open(data_file, 'r', encoding='utf-8') as f:
        articles = json.load(f)
    
    cursor = conn.cursor()
    
    # 清空现有数据
    cursor.execute("DELETE FROM knowledge_articles")
    
    # 插入数据
    for article in articles:
        cursor.execute("""
            INSERT INTO knowledge_articles (
                id, title, category, excerpt, body, cover,
                source, author, tags, favorites, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            article['id'],
            article['title'],
            article['category'],
            article['excerpt'],
            article['body'],
            article['cover'],
            article['source'],
            article['author'],
            article['tags'],
            article['favorites'],
            article['created_at']
        ))
    
    conn.commit()
    print(f"✓ 成功导入 {len(articles)} 篇知识文章")
    cursor.close()

def verify_data(conn):
    """验证数据上传成功"""
    print("\n正在验证数据...")
    cursor = conn.cursor()
    
    # 检查表数量
    cursor.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
    """)
    tables = cursor.fetchall()
    print(f"\n创建的表: {len(tables)} 个")
    for table in tables:
        print(f"  - {table[0]}")
    
    # 检查角色数据
    cursor.execute("SELECT COUNT(*) FROM characters")
    char_count = cursor.fetchone()[0]
    print(f"\n角色数据: {char_count} 条")
    
    # 检查知识文章数据
    cursor.execute("SELECT COUNT(*) FROM knowledge_articles")
    article_count = cursor.fetchone()[0]
    print(f"知识文章数据: {article_count} 条")
    
    # 检查社区房间数据
    cursor.execute("SELECT COUNT(*) FROM community_rooms")
    room_count = cursor.fetchone()[0]
    print(f"社区房间数据: {room_count} 条")
    
    # 检查问答题目数据
    cursor.execute("SELECT COUNT(*) FROM qa_questions")
    qa_count = cursor.fetchone()[0]
    print(f"问答题目数据: {qa_count} 条")
    
    cursor.close()
    print("\n✓ 数据验证完成")

def main():
    """主函数"""
    print("=" * 60)
    print("溯光 Aetherlight - 数据库初始化")
    print("=" * 60)
    
    conn = None
    try:
        # 连接数据库
        conn = connect_db()
        
        # 执行建表脚本
        execute_schema(conn)
        
        # 导入角色数据
        import_characters(conn)
        
        # 导入知识文章数据
        import_knowledge_articles(conn)
        
        # 验证数据
        verify_data(conn)
        
        print("\n" + "=" * 60)
        print("✓ 数据库初始化完成！")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ 初始化失败: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()
            print("\n数据库连接已关闭")

if __name__ == "__main__":
    main()
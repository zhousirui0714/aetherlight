# 知识库数据导入脚本

## 概述

此脚本将静态知识库数据导入到 Supabase 数据库。

## 功能

- 导入人物数据到 `kb_persons` 表
- 导入典籍数据到 `kb_books` 表
- 导入知识条目到 `kb_knowledge_entries` 表
- 导入诗词到 `kb_poems` 表

## 前置条件

1. 在 Supabase 中创建数据库表（运行迁移脚本）：
   ```bash
   # 在 Supabase SQL Editor 中运行
   # supabase/migrations/002_knowledge_base.sql
   ```

2. 获取 Supabase 连接信息：
   - 访问 Supabase 项目设置 → API
   - 获取 `SUPABASE_URL`
   - 获取 `SUPABASE_SERVICE_ROLE_KEY`（用于服务端操作）

## 使用方法

### 方法 1：直接运行（推荐）

```bash
# 设置环境变量
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# 运行导入脚本
npx tsx scripts/import-knowledge.ts
```

### 方法 2：使用 package.json 脚本

在 `package.json` 中添加脚本：

```json
{
  "scripts": {
    "import:knowledge": "npx tsx scripts/import-knowledge.ts"
  }
}
```

然后运行：

```bash
npm run import:knowledge
```

### 方法 3：使用 Makefile

添加 `Makefile`：

```makefile
import-knowledge:
	@read -p "SUPABASE_URL: " url; \
	read -p "SUPABASE_SERVICE_ROLE_KEY: " key; \
	SUPABASE_URL=$$url SUPABASE_SERVICE_ROLE_KEY=$$key npx tsx scripts/import-knowledge.ts
```

## 数据来源

脚本从以下静态文件中读取数据：

- `src/lib/cultural-knowledge.ts` - 知识条目、人物、典籍数据

## 输出示例

```
==================================================
开始导入知识库数据到 Supabase
==================================================

正在导入人物数据...
✓ 成功导入 20 条人物数据
正在导入典籍数据...
✓ 成功导入 15 条典籍数据
正在导入知识条目数据...
✓ 成功导入 22 条知识条目数据
正在导入诗词数据...
✓ 成功导入 15 首诗词

==================================================
导入结果汇总
==================================================
✓ kb_persons: 20 条
✓ kb_books: 15 条
✓ kb_knowledge_entries: 22 条
✓ kb_poems: 15 条

成功: 4/4
所有数据导入成功！
```

## 故障排除

### 错误：表不存在

确保已运行迁移脚本创建表：

```sql
-- 在 Supabase SQL Editor 中运行
-- supabase/migrations/002_knowledge_base.sql
```

### 错误：权限不足

确保使用 `SUPABASE_SERVICE_ROLE_KEY` 而非 `SUPABASE_ANON_KEY`。

### 错误：数据类型不匹配

检查数据库表的列类型是否与导入脚本中的数据类型匹配。

## 注意事项

1. 脚本使用 `upsert` 操作，已存在的数据会被更新
2. 如果需要清空表后重新导入，先运行：
   ```sql
   DELETE FROM kb_persons;
   DELETE FROM kb_books;
   DELETE FROM kb_knowledge_entries;
   DELETE FROM kb_poems;
   ```
3. 建议在生产环境运行前先在测试环境验证

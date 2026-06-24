# 知识库自动同步脚本

## 前提条件（仅 1 次，需要手动执行）

1. 打开 https://app.supabase.com/project/ozshflujnxonhfwdtunp/editor/sql
2. 粘贴并执行 `supabase/migrations/20260624_knowledge_gallery_v2.sql` 内容
3. 作用：
   - 放宽 `category` CHECK 约束到 15 大分类
   - 新增 `history / influence / body_extended / related_* / faq` 等字段
   - 新增 `ai_completions` 缓存表

## 之后可以无限次自动同步

```bash
npx tsx scripts/sync-supabase.ts   # 批量 upsert 120 条
npx tsx scripts/verify-supabase.ts # 验证各分类数据
npx tsx scripts/check-anon.ts       # 验证公开读 RLS
```

## 行为说明

- 自动查询 `knowledge_articles` 表当前字段，仅 upsert 已有字段
- 自动检测 category CHECK 约束允许的分类范围
  - 当前（未迁移）：只同步 7 大分类（节气/节日/诗词/典籍/非遗/民俗/人物）
  - 迁移后：同步 15 大分类（包含 建筑/神话/艺术/哲学/医学/科技/饮食/服饰）
- 按 id 去重，重复 id 仅 upsert 一次
- 失败的批次会打印错误原因（一般是 CHECK 约束或字段类型不匹配）

## 当前 DB 状态

| 分类 | 条数 |
|------|------|
| 诗词 | 818 |
| 典籍 | 129 |
| 节气 | 23 |
| 人物 | 15 |
| 节日 | 11 |
| 民俗 | 4 |
| **合计** | **1576** |

> 7 大分类已有充足数据，**前端可正常拉取展示**。
> 8 大新分类（建筑/神话/艺术/哲学/医学/科技/饮食/服饰）的 39 条数据保留在 `backend/data/knowledge_articles.json`，详情页自动 fallback。

# 溯光 Aetherlight — AI 内容补全接续

## 项目背景
你正在为「溯光 Aetherlight」（https://aetherlight.vercel.app）做内容补全。这是一个中文文化知识网站，技术栈 React + TanStack Start + Supabase。
- Supabase project: `ozshflujnxonhfwdtunp`
- DB: knowledge_articles (1966 篇) + knowledge_relations + knowledge_books 等
- service_role key 在 .env

## 当前状态（上一对话已完成的 19 篇）
- 5 篇诗词 (nalan-8, nalan-188, nalan-10, tangshi-300-173, tangshi-300-361)
- 7 篇论语 (lunyu-9, lunyu-10, lunyu-11, lunyu-12, lunyu-14, lunyu-15, lunyu-17)
- 2 篇纳兰 (nalan-11, nalan-12)

## 工具脚本（已写好可用）
- `scripts/agent-content-batch.json` — 内容草稿 JSON 数组，**新条目直接 push 进去**
- `scripts/apply-agent-content-batch.mjs` — 一键写入 DB 工具

## AI 内容标记
DB 已加字段：
- `_ai_generated: boolean`
- `_ai_generated_at: timestamp with time zone`
- `_ai_generated_source: text`

写入时设 `_ai_generated: true` + `_ai_generated_at: now` 便于人工审核。

## 你的任务
1. **挑 5-10 篇最有把握的经典条目**（诗词 / 论语 / 唐诗 / 历史人物 / 节日 / 典故）
2. 按以下 JSON 模板填到 agent-content-batch.json 的 items 数组：

```json
{
  "id": "文章 id (如 nalan-15, tangshi-300-5, lunyu-18)",
  "title": "原标题",
  "excerpt": "100-150 字简介",
  "body_append": "【原文】\n\n[原文]\n\n【白话译文】\n\n[译文]\n\n【创作背景】\n\n[背景]",
  "history_append": "200-400 字品鉴赏析"
}
```

3. 跑：`node scripts/apply-agent-content-batch.mjs`
4. 重复

## 重要原则
- **只做"你有 100% 把握"的著名条目**（人名、朝代、典故、出处全核对）
- **不要写冷门条目**（容易出错）
- **加 _ai_generated 标记**（虽然脚本自动加，但你心里要有这根弦）
- **每轮 5-10 篇**，不要超过 15 篇（context 会爆）

## 备选文章 id 清单（去 DB 拉）
```bash
curl -s "https://ozshflujnxonhfwdtunp.supabase.co/rest/v1/knowledge_articles?select=id,title&category=eq.poems&body=is.null&limit=20" -H "apikey: sb_publishable_wHFjXUg7E8WZ6lKVUKGU0g_eVZ_GwdL" -H "Authorization: Bearer sb_publishable_wHFjXUg7E8WZ6lKVUKGU0g_eVZ_GwdL"
```

## 上下文状态
- W1 封面 (PID 172092) 持续跑 (~26% 完成)
- W2 封面 (PID 200131) 续跑 (~3% 完成)
- author-guardian 守护
- D2-regex / A3-from-related / dedup-titles / W4 backfill 全部完成
- DB 索引 migration 已上线

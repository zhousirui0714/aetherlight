# 溯光 Aetherlight

**一个用 AI 活化传统文化的互动平台。**

以大语言模型为核心引擎，集每日文化推送、知识百科问答、跨越时空的「与古人对话」、AI 艺术创作、聊天社区与传统知识答题于一体。

---

## 溯历史长河，撷文明之光。

---

## 当前版本

目前已落地的模块（契约先行→代码实现）：

- **知识分享 - 每日文化推送** ✅
  - `GET /api/knowledge/daily-card`
  - `GET /api/knowledge/daily-card/history`
- **后端：Python + FastAPI**
- **数据库：Supabase（PostgreSQL + RLS）**
- **本地大模型：Ollama（默认 qwen3:8b）**
- **前端 API 封装：`frontend/src/api/knowledge.ts`

其余模块（知识问答助手、与古人对话、艺术创作、社区、答题区）尚未接入，待下一轮契约确定后依次实现。

---

## 项目结构

```
溯光Aetherlight/
├── backend/                       # Python/FastAPI 后端
│   ├── main.py                    # 入口
│   ├── config.py                  # 配置（环境变量）
│   ├── requirements.txt         # 依赖
│   ├── .env.example             # 环境变量示例
│   ├── routes/
│   │   └── knowledge_daily_card.py   # 每日文化推送路由
│   ├── services/
│   │   └── daily_card_service.py     # 生成卡片的核心业务（Ollama + Supabase）
│   └── db/
│       └── schema.sql              # Supabase 表结构（需在 Supabase SQL Editor 执行）
└── frontend/
    └── src/
        └── api/
            └── knowledge.ts        # 前端 API 调用封装（TS）
```

---

## 快速开始

### 1. 准备 Supabase

1. 在 [supabase.com](https://supabase.com) 或自托管实例创建项目。
2. 打开 **SQL Editor**，执行 `backend/db/schema.sql` 创建表。
3. 打开 **Project Settings → API**，复制：
   - `Project URL`（形如 `https://ozshflujnxonhfwdtunp.supabase.co`）
   - `service_role key`（**仅在后端使用**，不要提交到公开仓库）
   - `anon key`（前端公开使用）

### 2. 安装并启动本地大模型（可选，但推荐）

```bash
# 在 Windows PowerShell / macOS / Linux
ollama serve
ollama pull qwen3:8b
```

如果没有 GPU，会退化为 CPU 推理（速度较慢但可用）。
如果连 Ollama 也不想装，接口会返回静态降级卡片，功能仍可演示。

### 3. 配置后端环境变量

在 `backend/` 目录：

```bash
cp .env.example .env
# 编辑 .env，填入：
#   SUPABASE_URL=...
#   SUPABASE_SERVICE_ROLE_KEY=...
#   OLLAMA_BASE_URL=http://localhost:11434
#   OLLAMA_MODEL=qwen3:8b
```

### 4. 安装依赖并启动后端

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python main.py
```

浏览器打开：

- API 主页：<http://localhost:8000/>
- 健康检查：<http://localhost:8000/health>
- 今日卡片：<http://localhost:8000/api/knowledge/daily-card>
- Swagger 文档：<http://localhost:8000/docs>

### 5. 前端调用

```ts
import { getDailyCard, getDailyCardHistory } from './frontend/src/api/knowledge';

// 获取今日卡片
const card = await getDailyCard();
console.log(card.title, card.body, card.theme_tags);

// 获取历史列表
const history = await getDailyCardHistory({ limit: 10 });
console.log(history.total, history.items);
```

---

## 设计原则

- **契约先行**：每个模块先定义接口契约（路径、请求、响应、错误码、异步边界），经确认后才实现。
- **本地优先**：优先使用本地模型（Ollama + qwen/qwen3 系列），云端 API 作为兜底。
- **缓存友好**：同一日期 + 城市生成的卡片会写入 Supabase，后续直接读取，避免重复调用 LLM。
- **降级可用**：AI 服务全部不可用时，系统返回静态卡片，前端仍可正常展示。

---

## 下一步计划

- 知识分享 - **知识问答助手**（RAG，向量库检索 + LLM 生成回答）
- 知识分享 - **主题知识长廊**（分类浏览）
- 与古人对话 - **角色市场 + 多轮对话**
- 艺术创作 - **文生图 / 文生音乐**
- 聊天社区
- 答题区

---

## 许可证

MIT

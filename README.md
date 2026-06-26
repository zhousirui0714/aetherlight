# 溯光 Aetherlight

一个以中华文明为主题的 AI 互动网站，当前主线实现为根目录下的 TanStack Start 前端应用，并配套保留一个独立的 Python/FastAPI 后端目录。

## 当前状态

当前仓库已经不是“只有每日卡片”的早期原型，主站已落地以下核心模块：

- 首页叙事页：故事化 Hero、文明地图、热榜、精选内容、名家对话入口
- 知识长廊：分类浏览、标签筛选、关键词搜索、文章推荐
- 文章详情：分类化内容渲染、AI 解读、关系图谱、收藏与批注
- 文化问答：站内知识检索 + AI 回答
- 与古人对话：角色市场、单角色多轮对话、历史记录
- 艺术创作：文生图、旋律生成、创作历史
- 同游模块：社区、帖子详情、每日挑战
- 用户中心：登录注册、收藏、批注、仪表盘、文化历程、个人页

## 技术栈

### 主站前端

- React 19
- TanStack Router / TanStack Start
- Vite
- Tailwind CSS 4
- Radix UI
- Supabase
- AI SDK

### 独立后端

- Python
- FastAPI
- Supabase / PostgreSQL
- httpx

## 目录说明

```text
/workspace
├── src/                      # 当前主线前端代码
│   ├── components/           # 页面与通用组件
│   ├── integrations/         # Supabase / Lovable 等集成
│   ├── lib/                  # 本地数据、存储封装、业务逻辑
│   └── routes/               # 页面路由与服务端 API 路由
├── public/                   # 静态资源
├── backend/                  # 独立 FastAPI 后端与数据脚本
├── aetherlight-main/         # 旧版前端快照/早期实现，非当前主线
└── README.md
```

## 主要路由

### 页面

- `/` 首页
- `/gallery` 知识长廊
- `/article/$id` 文章详情
- `/search` 站内搜索
- `/chat` 文化问答
- `/dialogue` 名家对话
- `/create` 艺术创作
- `/tongyou/community` 文化社区
- `/tongyou/challenge` 每日挑战
- `/favorites` 我的收藏
- `/annotations` 我的批注
- `/dashboard` 学习仪表盘
- `/journey` 文化历程
- `/profile` 个人中心
- `/auth` 登录注册

### 内置服务端 API

主站内置了一批 TanStack Start 服务端路由，位于 `src/routes/api/`，包括：

- `/api/articles`
- `/api/articles/$id`
- `/api/articles/search`
- `/api/articles/categories`
- `/api/articles/tags`
- `/api/articles/recommendations`
- `/api/articles/$id/relations`
- `/api/chat`
- `/api/dialogue`
- `/api/text-to-image`
- `/api/translate`
- `/api/ancient-books`
- `/api/almanac/today`

## 快速开始

### 1. 安装前端依赖

```bash
pnpm install
```

### 2. 配置前端环境变量

主站至少需要 Supabase 公开端配置：

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

部分 SSR 场景也会读取：

```bash
SUPABASE_URL=your-project-url
SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### 3. 启动主站

```bash
pnpm dev
```

常用命令：

```bash
pnpm build
pnpm lint
pnpm format
```

## 独立后端说明

`backend/` 目录保留了独立 FastAPI 服务，提供知识条目、每日卡片、角色、聊天、社区、艺术创作等接口与初始化脚本。

启动方式：

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

环境变量示例见：

- `backend/.env.example`

数据库与初始化脚本见：

- `backend/db/`
- `backend/scripts/`

注意：该后端中仍有一部分接口、表结构与 mock 实现处于整理中，适合作为独立服务继续收敛，不应默认视为与前端当前状态完全一致。

## 开发说明

- 当前主线以前端根项目 `/workspace/src` 为准
- `aetherlight-main/` 仅作旧版参考，不参与当前主站构建
- 仓库内同时存在“前端内置 API”与“独立 Python 后端”两套服务能力，开发前请先确认要接入哪一条链路
- 部分用户数据支持本地存储与 Supabase 双写/降级

## 已知现状

- 主站功能面完整，适合继续做工程收口与体验打磨
- 社区、创作、部分 AI 能力仍存在降级逻辑或 mock 数据
- 独立后端仍有表结构与接口需要继续对齐
- 文档现已按当前代码结构更新，但部署前仍建议补充环境变量清单和数据初始化步骤

## 许可证

MIT

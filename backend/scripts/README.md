Import poetry scripts
=====================

工具：将 `chinese-poetry-master` 中的 JSON 资源导入到 Supabase `knowledge_articles` 表。

准备：在 `backend` 目录创建虚拟环境并安装依赖：

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

示例运行（dry-run）：

```powershell
python scripts/import_poetry.py --source-dir "..\..\chinese-poetry-master" --dry-run
```

实际写入 Supabase：

```powershell
python scripts/import_poetry.py --source-dir "..\..\chinese-poetry-master"
```

说明：

- 脚本尝试解析常见的 JSON 格式（单篇或列表）；会把 `paragraphs` / `content` / `body` 拼接为正文。
- 根据文件路径尝试推断分类（`典籍` 或 `诗词`）。
- 若需生成真实向量 embedding，请在后续步骤中加入 embedding 生成器并写入 `article_embeddings` 表。

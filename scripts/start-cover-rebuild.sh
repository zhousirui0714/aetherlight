#!/bin/bash
# 一键启动 AI 配图全量跑
# 后台跑 5h, 适合睡前启动
#
# 用法:
#   bash scripts/start-cover-rebuild.sh
#
# 跑完后看:
#   tail -f /tmp/cover-batch.log
#   node -e 'const p=require("./scripts/covers-progress-w1.json"); console.log("w1 done:", Object.keys(p).length);'
#   node -e 'const p=require("./scripts/covers-progress-w2.json"); console.log("w2 done:", Object.keys(p).length);'

set -e
cd /workspace

# 1) 清空 progress (从新 prompt 重新开始)
> scripts/covers-progress-w1.json
> scripts/covers-progress-w2.json

# 2) 启动 W1 (处理 index 0-950)
echo "[启动] W1 (index 0-950)"
nohup bash scripts/run-cover-batch-w1.sh > /tmp/cover-w1.log 2>&1 &
W1_PID=$!
disown
echo "  W1 PID: $W1_PID, log: /tmp/cover-w1.log"

# 3) 启动 W2 (处理 index 951+)
echo "[启动] W2 (index 951+)"
nohup bash scripts/run-cover-batch-w2.sh > /tmp/cover-w2.log 2>&1 &
W2_PID=$!
disown
echo "  W2 PID: $W2_PID, log: /tmp/cover-w2.log"

# 4) 启动 progress 监控
echo ""
echo "============================================="
echo "  全部启动, 睡前看着 log 即可"
echo "  监控命令: bash scripts/check-cover-progress.sh"
echo "============================================="

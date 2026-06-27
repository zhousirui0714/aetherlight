#!/bin/bash
# 反复调 resilient 跑, 每 50 张保存一次, sandbox 死了不丢数据
# 一直跑到全部 1966 张完成 或 自己 ctrl+C 停

set -e
cd /workspace

TOTAL=${1:-1966}
BATCH=${2:-50}     # 每批多少张
SAFETY=${3:-480}   # 每批最大秒数 (8 分钟, sandbox 一般 ~10min 回收)
MAX_BATCHES=${4:-50} # 最多跑多少批 (50 批 * 50 张 = 2500 张, 足够)

START=0
BATCH_IDX=0

while [ $START -lt $TOTAL ] && [ $BATCH_IDX -lt $MAX_BATCHES ]; do
  echo ""
  echo "========================================="
  echo "[batch $BATCH_IDX] start=$START limit=$BATCH safety=${SAFETY}s"
  echo "========================================="
  # timeout 提前 20s 退出, 给脚本自己留 save 余地
  timeout $((SAFETY - 20)) node scripts/gen-article-covers-resilient.mjs \
    --start $START \
    --limit $BATCH \
    --batch-size 3 \
    --max-minutes $((SAFETY / 60)) \
    2>&1 | tail -10
  EXIT=$?
  if [ $EXIT -eq 124 ]; then
    echo "[batch $BATCH_IDX] timeout (114), 续"
  elif [ $EXIT -ne 0 ]; then
    echo "[batch $BATCH_IDX] exit $EXIT, 续"
  fi
  START=$((START + BATCH))
  BATCH_IDX=$((BATCH_IDX + 1))
done

echo ""
echo "=== 全部完成 (or 批次耗尽) ==="
node -e 'const p=JSON.parse(require("fs").readFileSync("/workspace/scripts/covers-progress-w1.json","utf-8")||"{}");const ok=Object.values(p).filter(v=>typeof v==="string").length;const err=Object.values(p).filter(v=>v&&v.error).length;console.log("progress ok:",ok,"err:",err,"total:",Object.keys(p).length);'

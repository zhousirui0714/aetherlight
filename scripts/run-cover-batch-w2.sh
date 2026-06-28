#!/bin/bash
# W2: 跑 index 951+ 文章, 每 50 张保存, sandbox 死可续
cd /workspace
TOTAL=${1:-1015}
BATCH=${2:-50}
SAFETY=${3:-480}

START=951
BATCH_IDX=0
while [ $START -lt $TOTAL ]; do
  echo ""
  echo "=== W2 batch $BATCH_IDX start=$START ==="
  timeout $((SAFETY - 20)) node scripts/gen-article-covers-w2.mjs --start $START --limit $BATCH 2>&1 | tail -5
  START=$((START + BATCH))
  BATCH_IDX=$((BATCH_IDX + 1))
  [ $BATCH_IDX -ge 20 ] && break
done
echo "W2 done"

/**
 * 图中心性算法 - 用于知识图谱节点重要性排序
 *
 * 包含 3 种中心性：
 *   1. Degree Centrality    节点度中心性（邻居数）
 *   2. Weighted Degree      加权度（按边权重求和）
 *   3. Betweenness (简化)   介数中心性（节点作为桥梁的次数）
 *
 * 应用场景：
 *   - 知识图谱：调整节点视觉大小/距离
 *   - 推荐：优先推荐高中心性节点
 *   - 内容排序：在图谱内"中心"的文章更重要
 *
 * 时间复杂度：
 *   - Degree: O(V + E)
 *   - Betweenness (BFS): O(V * E)
 */

import type { GraphNode, GraphEdge } from "@/lib/knowledge-types";

export interface NodeCentrality {
  id: string;
  /** 度中心性：0-1 归一化 */
  degree: number;
  /** 加权度（边权之和） */
  weightedDegree: number;
  /** 介数中心性：0-1 归一化 */
  betweenness: number;
  /** 综合分数 0-1（用户可配置权重） */
  composite: number;
}

export interface CentralityOptions {
  /** 综合分数权重（默认 degree: 0.5, weighted: 0.3, betweenness: 0.2） */
  weights?: { degree: number; weighted: number; betweenness: number };
}

/**
 * 计算节点中心性
 *
 * @param nodes 图节点
 * @param edges 图边（无向）
 * @param options 配置
 */
export function computeCentrality(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: CentralityOptions = {}
): Map<string, NodeCentrality> {
  const weights = options.weights || { degree: 0.5, weighted: 0.3, betweenness: 0.2 };
  const result = new Map<string, NodeCentrality>();

  if (nodes.length === 0) return result;

  // ========== 1. 构建邻接表（无向） ==========
  const adj = new Map<string, Array<{ neighbor: string; weight: number }>>();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) {
    const w = e.weight ?? 1;
    if (adj.has(e.source)) {
      adj.get(e.source)!.push({ neighbor: e.target, weight: w });
    }
    if (adj.has(e.target)) {
      adj.get(e.target)!.push({ neighbor: e.source, weight: w });
    }
  }

  // ========== 2. Degree & Weighted Degree ==========
  const degreeRaw = new Map<string, number>();
  const weightedRaw = new Map<string, number>();
  let maxDegree = 0;
  let maxWeighted = 0;

  for (const [id, neighbors] of adj.entries()) {
    const d = neighbors.length;
    const w = neighbors.reduce((s, x) => s + x.weight, 0);
    degreeRaw.set(id, d);
    weightedRaw.set(id, w);
    if (d > maxDegree) maxDegree = d;
    if (w > maxWeighted) maxWeighted = w;
  }

  // ========== 3. Betweenness（简化版：Brandes 算法） ==========
  // 介数中心性：节点作为最短路径桥梁的次数
  const betweennessRaw = new Map<string, number>();
  for (const n of nodes) betweennessRaw.set(n.id, 0);

  for (const s of nodes) {
    // BFS 从 s 开始
    const stack: string[] = [];
    const pred = new Map<string, string[]>();
    const sigma = new Map<string, number>();
    const dist = new Map<string, number>();

    for (const n of nodes) {
      pred.set(n.id, []);
      sigma.set(n.id, 0);
      dist.set(n.id, -1);
    }
    sigma.set(s.id, 1);
    dist.set(s.id, 0);

    const queue: string[] = [s.id];
    while (queue.length > 0) {
      const v = queue.shift()!;
      stack.push(v);
      const neighbors = adj.get(v) || [];
      for (const { neighbor: w } of neighbors) {
        // 仅处理无向图上的最短路径（BFS 即可）
        if (dist.get(w) === -1) {
          queue.push(w);
          dist.set(w, dist.get(v)! + 1);
        }
        if (dist.get(w) === dist.get(v)! + 1) {
          sigma.set(w, sigma.get(w)! + sigma.get(v)!);
          pred.get(w)!.push(v);
        }
      }
    }

    // 反向累加 delta
    const delta = new Map<string, number>();
    for (const n of nodes) delta.set(n.id, 0);
    while (stack.length > 0) {
      const w = stack.pop()!;
      for (const v of pred.get(w)!) {
        const c = (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!);
        delta.set(v, delta.get(v)! + c);
      }
      if (w !== s.id) {
        betweennessRaw.set(w, betweennessRaw.get(w)! + delta.get(w)!);
      }
    }
  }

  // 介数除以 2（无向图对称）
  for (const [id, val] of betweennessRaw.entries()) {
    betweennessRaw.set(id, val / 2);
  }

  let maxBetween = 0;
  for (const v of betweennessRaw.values()) {
    if (v > maxBetween) maxBetween = v;
  }

  // ========== 4. 归一化 + 综合分数 ==========
  for (const n of nodes) {
    const d = maxDegree > 0 ? (degreeRaw.get(n.id) || 0) / maxDegree : 0;
    const w = maxWeighted > 0 ? (weightedRaw.get(n.id) || 0) / maxWeighted : 0;
    const b = maxBetween > 0 ? (betweennessRaw.get(n.id) || 0) / maxBetween : 0;
    const composite = weights.degree * d + weights.weighted * w + weights.betweenness * b;
    result.set(n.id, {
      id: n.id,
      degree: d,
      weightedDegree: w,
      betweenness: b,
      composite,
    });
  }

  return result;
}

/**
 * 便捷 API：返回节点 id → composite 分数（0-1）
 */
export function computeImportance(
  nodes: GraphNode[],
  edges: GraphEdge[]
): Map<string, number> {
  const centrality = computeCentrality(nodes, edges);
  const out = new Map<string, number>();
  for (const [id, c] of centrality.entries()) {
    out.set(id, c.composite);
  }
  return out;
}

/**
 * 详情页通用 hooks
 *
 * - useAIFill: 懒加载 AI 补全字段 (history / influence / faq / translation / annotation / summary)
 *   不阻塞首屏，组件挂载时按需请求
 *
 * - useArticleRelations: 拉取 /articles/{id}/relations 知识图谱
 *   用于「继续溯光」探索路径
 *
 * - useCountdown: 距离下一个节日/节气倒计时 (动态计算)
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { aiFillArticle, getRelations, type KnowledgeGraph } from "@/lib/knowledge-api";
import type { Article, FAQItem } from "@/lib/knowledge-types";

// ---------------------------------------------------------------------------
// useAIFill — 单字段懒加载
// ---------------------------------------------------------------------------

export type AIFillField = "history" | "influence" | "faq" | "summary" | "translation" | "annotation" | "commentary" | "imagery";

export interface AIFillState {
  history: string;
  influence: string;
  faq: FAQItem[];
  summary: string;
  translation: any;
  annotation: any;
  commentary: string;
  imagery: string;
  loading: { [k in AIFillField]?: boolean };
  loaded: { [k in AIFillField]?: boolean };
  error: { [k in AIFillField]?: string };
  fill: (field: AIFillField) => Promise<void>;
  fillMany: (fields: AIFillField[]) => Promise<void>;
  reset: () => void;
}

/**
 * 懒加载补全
 * @param article 文章对象（用于判断字段是否为空 + 作为 AI 兜底快照）
 * @param autoFields 进入页面时自动补全的字段（不阻塞渲染）
 */
export function useAIFill(article: Article | null, autoFields: AIFillField[] = []): AIFillState {
  const [history, setHistory] = useState<string>(article?.history || "");
  const [influence, setInfluence] = useState<string>(article?.influence || "");
  const [faq, setFaq] = useState<FAQItem[]>(article?.faq || []);
  const [summary, setSummary] = useState<string>(article?.excerpt || "");
  const [translation, setTranslation] = useState<any>(null);
  const [annotation, setAnnotation] = useState<any>(null);
  const [commentary, setCommentary] = useState<string>("");
  const [imagery, setImagery] = useState<string>("");
  const [loading, setLoading] = useState<{ [k in AIFillField]?: boolean }>({});
  const [loaded, setLoaded] = useState<{ [k in AIFillField]?: boolean }>({});
  const [error, setError] = useState<{ [k in AIFillField]?: string }>({});
  const inFlight = useRef<Set<string>>(new Set());

  // 同步 article 变化
  useEffect(() => {
    setHistory(article?.history || "");
    setInfluence(article?.influence || "");
    setFaq(article?.faq || []);
    setSummary(article?.excerpt || "");
    setTranslation(null);
    setAnnotation(null);
    setCommentary("");
    setImagery("");
    setLoading({});
    setLoaded({});
    setError({});
    inFlight.current.clear();
  }, [article?.id]);

  const applyFill = useCallback((field: AIFillField, value: any) => {
    switch (field) {
      case "history": setHistory(value || ""); break;
      case "influence": setInfluence(value || ""); break;
      case "faq": setFaq(Array.isArray(value) ? value : []); break;
      case "summary": setSummary(value || ""); break;
      case "translation": setTranslation(value); break;
      case "annotation": setAnnotation(value); break;
      case "commentary": setCommentary(value || ""); break;
      case "imagery": setImagery(value || ""); break;
    }
  }, []);

  const fill = useCallback(async (field: AIFillField) => {
    if (!article || inFlight.current.has(field)) return;
    inFlight.current.add(field);
    setLoading((s) => ({ ...s, [field]: true }));
    setError((s) => ({ ...s, [field]: undefined }));
    try {
      const res = await aiFillArticle(article.id, [field], {
        title: article.title,
        category: String(article.category),
        excerpt: article.excerpt,
        body: article.content,
      });
      const value = res?.filled?.[field];
      applyFill(field, value);
      setLoaded((s) => ({ ...s, [field]: true }));
    } catch (err: any) {
      setError((s) => ({ ...s, [field]: err?.message || "AI 补全失败" }));
    } finally {
      inFlight.current.delete(field);
      setLoading((s) => ({ ...s, [field]: false }));
    }
  }, [article, applyFill]);

  const fillMany = useCallback(async (fields: AIFillField[]) => {
    await Promise.all(fields.map((f) => fill(f)));
  }, [fill]);

  const reset = useCallback(() => {
    setHistory(article?.history || "");
    setInfluence(article?.influence || "");
    setFaq(article?.faq || []);
    setSummary(article?.excerpt || "");
    setTranslation(null);
    setAnnotation(null);
    setCommentary("");
    setImagery("");
    setLoading({});
    setLoaded({});
    setError({});
    inFlight.current.clear();
  }, [article]);

  // 自动补全
  useEffect(() => {
    if (!article) return;
    const fieldsToAuto: AIFillField[] = [];
    if (autoFields.includes("history") && !article.history) fieldsToAuto.push("history");
    if (autoFields.includes("influence") && !article.influence) fieldsToAuto.push("influence");
    if (autoFields.includes("faq") && (!article.faq || article.faq.length === 0)) fieldsToAuto.push("faq");
    if (autoFields.includes("summary") && !article.excerpt) fieldsToAuto.push("summary");
    if (autoFields.includes("commentary")) fieldsToAuto.push("commentary");
    if (autoFields.includes("imagery")) fieldsToAuto.push("imagery");
    if (fieldsToAuto.length > 0) {
      // 延迟一点，避免与首屏渲染抢资源
      const t = setTimeout(() => fillMany(fieldsToAuto), 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article?.id]);

  return { history, influence, faq, summary, translation, annotation, commentary, imagery, loading, loaded, error, fill, fillMany, reset };
}

// ---------------------------------------------------------------------------
// useArticleRelations — 知识图谱
// ---------------------------------------------------------------------------

export interface UseArticleRelationsResult {
  graph: KnowledgeGraph | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useArticleRelations(articleId: string | undefined): UseArticleRelationsResult {
  const [graph, setGraph] = useState<KnowledgeGraph | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!articleId) {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    getRelations(articleId)
      .then((data) => {
        if (alive) setGraph(data);
      })
      .catch((err) => {
        if (alive) setError(err?.message || "图谱加载失败");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [articleId, tick]);

  return { graph, loading, error, refetch: () => setTick((n) => n + 1) };
}

// ---------------------------------------------------------------------------
// useCountdown — 节日/节气倒计时
// ---------------------------------------------------------------------------

export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;        // 总毫秒
  reached: boolean;     // 是否已到达
  next: Date;           // 目标 Date
}

/**
 * 计算距离下一个指定日期/时间的倒计时
 * @param target 目标 Date (如 2026-02-04 立春日)
 */
export function useCountdown(target: Date | string | null | undefined): CountdownResult {
  const targetDate = useCallback(() => {
    if (!target) return null;
    if (target instanceof Date) return target;
    return new Date(target);
  }, [target]);

  const compute = useCallback((): CountdownResult => {
    const t = targetDate();
    if (!t) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, reached: true, next: new Date() };
    const now = Date.now();
    let diff = t.getTime() - now;
    // 若是过去时间，自动滚到明年同日
    if (diff < 0) {
      const next = new Date(t);
      next.setFullYear(next.getFullYear() + 1);
      diff = next.getTime() - now;
    }
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return { days, hours, minutes, seconds, total: diff, reached: diff <= 0, next: t };
  }, [targetDate]);

  const [result, setResult] = useState<CountdownResult>(compute);

  useEffect(() => {
    setResult(compute());
    const id = setInterval(() => setResult(compute()), 1000);
    return () => clearInterval(id);
  }, [compute]);

  return result;
}

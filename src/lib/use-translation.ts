import { useState } from "react";
import { toast } from "sonner";
import {
  getCachedTranslation,
  setCachedTranslation,
  getCachedScholarTranslation,
  setCachedScholarTranslation,
  getCachedPoetTranslation,
  setCachedPoetTranslation,
} from "./journey-storage";

/**
 * 通用「译」按钮 hook
 *
 * 三种口吻:
 * - voice:  用 sage 的口吻(对话页用),需要 sageId
 * - scholar: 用通用学者口吻(文章正文、长廊卡片用),无需额外参数
 * - poet:    用诗人本人口吻(诗句「...」用),需要 poetName
 *
 * 缓存策略:同 mode + 同关键参数 + 同文本 → 命中 localStorage
 * 失效:30 天 TTL(journey-storage 内的统一策略)
 */
export type TranslationMode = "voice" | "scholar" | "poet";

export type TranslationOptions = {
  mode: TranslationMode;
  text: string;
  sageId?: string;
  poetName?: string;
};

export function useTranslation(opts: TranslationOptions) {
  const { mode, text, sageId, poetName } = opts;

  const readCache = (): string | null => {
    if (mode === "voice" && sageId) return getCachedTranslation(sageId, text);
    if (mode === "poet" && poetName) return getCachedPoetTranslation(poetName, text);
    return getCachedScholarTranslation(text);
  };

  const writeCache = (translation: string) => {
    if (mode === "voice" && sageId) setCachedTranslation(sageId, text, translation);
    else if (mode === "poet" && poetName) setCachedPoetTranslation(poetName, text, translation);
    else setCachedScholarTranslation(text, translation);
  };

  const [translation, setTranslation] = useState<string | null>(readCache);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const toggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (translation) return; // 缓存命中
    setLoading(true);
    try {
      const body: Record<string, unknown> = { text, mode };
      if (mode === "voice" && sageId) body.sageId = sageId;
      if (mode === "poet" && poetName) body.poetName = poetName;
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { translation?: string; error?: string };
      if (data.error || !data.translation) throw new Error(data.error || "empty");
      setTranslation(data.translation);
      writeCache(data.translation);
    } catch {
      toast.error("翻译失败,请稍后重试");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return { translation, loading, open, toggle };
}

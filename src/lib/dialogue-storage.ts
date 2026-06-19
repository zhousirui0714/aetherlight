import type { UIMessage } from "ai";

const PREFIX = "suguang:dialogue:";

export function loadDialogue(sageId: string): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PREFIX + sageId);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UIMessage[]) : [];
  } catch { return []; }
}

export function saveDialogue(sageId: string, messages: UIMessage[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(PREFIX + sageId, JSON.stringify(messages)); } catch {}
}

export function clearDialogue(sageId: string) {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(PREFIX + sageId); } catch {}
}

export interface DialogueSummary {
  sageId: string;
  count: number;
  lastText: string;
  lastAt: number;
}

export function getDialogueSummary(sageId: string): DialogueSummary | null {
  const msgs = loadDialogue(sageId);
  if (msgs.length === 0) return null;
  const last = msgs[msgs.length - 1];
  const text = last.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
  return {
    sageId,
    count: msgs.length,
    lastText: text.slice(0, 80),
    lastAt: Date.now(), // we don't store actual timestamps; treat as recent. real impl could store.
  };
}

export function listAllDialogues(sageIds: string[]): DialogueSummary[] {
  return sageIds
    .map((id) => getDialogueSummary(id))
    .filter((s): s is DialogueSummary => s !== null);
}

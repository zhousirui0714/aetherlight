import type { UIMessage } from "ai";
import { supabase } from "@/integrations/supabase/client";

const PREFIX = "suguang:dialogue:";

// ============================================================
// localStorage 基础操作（适用于访客模式）
// ============================================================

export function loadDialogueLocal(sageId: string): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PREFIX + sageId);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UIMessage[]) : [];
  } catch {
    return [];
  }
}

export function saveDialogueLocal(sageId: string, messages: UIMessage[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFIX + sageId, JSON.stringify(messages));
  } catch {}
}

export function clearDialogueLocal(sageId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PREFIX + sageId);
  } catch {}
}

// ============================================================
// Supabase 云同步（适用于已登录用户）
// ============================================================

export interface DialogueSession {
  id: string;
  user_id: string;
  sage_id: string;
  title: string;
  message_count: number;
  last_message: string;
  created_at: string;
  updated_at: string;
}

// 获取用户的所有对话会话
export async function loadDialogueSessions(): Promise<DialogueSession[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return [];

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", session.user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to load dialogue sessions:", error);
    return [];
  }

  return (data || []) as DialogueSession[];
}

// 获取特定对话的所有消息
export async function loadDialogueMessages(sessionId: string): Promise<UIMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load dialogue messages:", error);
    return [];
  }

  // 转换为 UIMessage 格式
  return (data || []).map((msg, index) => ({
    id: `msg-${index}`,
    role: msg.role as "user" | "assistant" | "system",
    parts: [{ type: "text" as const, text: msg.content }],
  }));
}

// 保存对话到 Supabase
export async function saveDialogueToCloud(
  sageId: string,
  messages: UIMessage[]
): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  try {
    // 获取最后一条消息作为标题
    const lastMsg = messages[messages.length - 1];
    const titleText = lastMsg
      ? lastMsg.parts
          .map((p) => (p.type === "text" ? p.text : ""))
          .join("")
          .slice(0, 50)
      : "新对话";

    // 查找或创建会话
    const { data: existingSession } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("character_id", sageId)
      .single();

    let sessionId: string;

    if (existingSession) {
      sessionId = existingSession.id;
      // 更新会话信息
      await supabase
        .from("chat_sessions")
        .update({
          updated_at: new Date().toISOString(),
          title: titleText,
          message_count: messages.length,
        })
        .eq("id", sessionId);
    } else {
      // 创建新会话
      const { data: newSession, error } = await supabase
        .from("chat_sessions")
        .insert({
          character_id: sageId,
          user_id: session.user.id,
          title: titleText,
          message_count: messages.length,
        })
        .select("id")
        .single();

      if (error || !newSession) {
        console.error("Failed to create session:", error);
        return null;
      }
      sessionId = newSession.id;
    }

    // 删除旧消息，保存新消息
    await supabase.from("chat_messages").delete().eq("session_id", sessionId);

    const messagesToInsert = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        session_id: sessionId,
        role: m.role,
        content: m.parts.map((p) => (p.type === "text" ? p.text : "")).join(""),
      }));

    if (messagesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("chat_messages")
        .insert(messagesToInsert);

      if (insertError) {
        console.error("Failed to save messages:", insertError);
      }
    }

    return sessionId;
  } catch (err) {
    console.error("Failed to save dialogue to cloud:", err);
    return null;
  }
}

// 删除云端对话
export async function deleteDialogueFromCloud(sessionId: string): Promise<boolean> {
  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) {
    console.error("Failed to delete dialogue:", error);
    return false;
  }
  return true;
}

// ============================================================
// 统一接口（自动选择本地或云端）
// ============================================================

export async function isLoggedIn(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session?.user;
}

export async function loadDialogue(sageId: string): Promise<UIMessage[]> {
  // 如果已登录，优先从云端加载
  if (await isLoggedIn()) {
    const sessions = await loadDialogueSessions();
    const session = sessions.find((s) => s.sage_id === sageId);
    if (session) {
      return await loadDialogueMessages(session.id);
    }
  }
  // 否则从本地加载
  return loadDialogueLocal(sageId);
}

export async function saveDialogue(
  sageId: string,
  messages: UIMessage[]
): Promise<void> {
  // 先保存到本地
  saveDialogueLocal(sageId, messages);

  // 如果已登录，同步到云端
  if (await isLoggedIn()) {
    await saveDialogueToCloud(sageId, messages);
  }
}

export async function clearDialogue(sageId: string): Promise<void> {
  // 清除本地
  clearDialogueLocal(sageId);

  // 如果已登录，清除云端
  if (await isLoggedIn()) {
    const sessions = await loadDialogueSessions();
    const session = sessions.find((s) => s.sage_id === sageId);
    if (session) {
      await deleteDialogueFromCloud(session.id);
    }
  }
}

// ============================================================
// 摘要信息（用于列表展示）
// ============================================================

export interface DialogueSummary {
  sageId: string;
  count: number;
  lastText: string;
  lastAt: string;
  sessionId?: string;
}

export function getDialogueSummaryLocal(sageId: string): DialogueSummary | null {
  const msgs = loadDialogueLocal(sageId);
  if (msgs.length === 0) return null;

  const last = msgs[msgs.length - 1];
  const text = last.parts.map((p) => (p.type === "text" ? p.text : "")).join("");

  return {
    sageId,
    count: msgs.length,
    lastText: text.slice(0, 80),
    lastAt: new Date().toISOString(),
  };
}

export async function listAllDialogues(
  sageIds: string[]
): Promise<DialogueSummary[]> {
  // 如果已登录，优先从云端获取
  if (await isLoggedIn()) {
    const sessions = await loadDialogueSessions();
    return sessions.map((s) => ({
      sageId: s.character_id,
      count: s.message_count,
      lastText: s.last_message?.slice(0, 80) || "暂无内容",
      lastAt: s.updated_at,
      sessionId: s.id,
    }));
  }

  // 否则从本地获取
  return sageIds
    .map((id) => getDialogueSummaryLocal(id))
    .filter((s): s is DialogueSummary => s !== null);
}

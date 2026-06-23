import { supabase, isLoggedIn } from "@/integrations/supabase/client";

export type CreationType = "image" | "music";

export interface CreationItem {
  id: string;
  type: CreationType;
  prompt: string;
  style: string;
  url: string;
  createdAt: number;
}

const LOCAL_KEY = "sukou_creations";
const MAX_LOCAL = 50;

function loadLocal(): CreationItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as CreationItem[]) : [];
  } catch {
    return [];
  }
}

function saveLocal(items: CreationItem[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items.slice(0, MAX_LOCAL)));
  } catch {
    // ignore
  }
}

export async function saveCreation(item: Omit<CreationItem, "id" | "createdAt">): Promise<CreationItem> {
  const newItem: CreationItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  const local = loadLocal();
  saveLocal([newItem, ...local]);

  if (await isLoggedIn()) {
    try {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;
      if (uid) {
        await supabase.from("creations").insert({
          user_id: uid,
          type: item.type,
          prompt: item.prompt,
          style: item.style,
          url: item.url,
        });
      }
    } catch {
      // ignore
    }
  }

  return newItem;
}

export async function listCreations(type?: CreationType): Promise<CreationItem[]> {
  if (await isLoggedIn()) {
    try {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;
      if (uid) {
        let query = supabase
          .from("creations")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(100);

        if (type) {
          query = query.eq("type", type);
        }

        const { data: rows, error } = await query;
        if (!error && rows) {
          return rows.map((r) => ({
            id: r.id,
            type: r.type,
            prompt: r.prompt,
            style: r.style,
            url: r.url,
            createdAt: new Date(r.created_at).getTime(),
          }));
        }
      }
    } catch {
      // fall through to local
    }
  }

  const local = loadLocal();
  return type ? local.filter((c) => c.type === type) : local;
}

export async function deleteCreation(id: string): Promise<void> {
  const local = loadLocal();
  saveLocal(local.filter((c) => c.id !== id));

  if (await isLoggedIn()) {
    try {
      await supabase.from("creations").delete().eq("id", id);
    } catch {
      // ignore
    }
  }
}

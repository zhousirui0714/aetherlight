import { supabase, isLoggedIn } from "@/integrations/supabase/client";

export interface Annotation {
  id: string;
  article_id: string;
  user_id?: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  selected_text?: string;
  start_offset?: number;
  end_offset?: number;
  category: string;
  likes: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

const LOCAL_KEY = "sukou_annotations";
const MAX_LOCAL = 100;

function loadLocal(): Annotation[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocal(annotations: Annotation[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(annotations.slice(0, MAX_LOCAL)));
  } catch {}
}

export async function saveAnnotation(annotation: Omit<Annotation, "id" | "created_at" | "updated_at" | "likes">): Promise<Annotation> {
  const newAnnotation: Annotation = {
    ...annotation,
    id: crypto.randomUUID(),
    likes: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const local = loadLocal();
  saveLocal([newAnnotation, ...local]);

  if (await isLoggedIn()) {
    try {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;
      if (uid) {
        const { data: inserted } = await supabase
          .from("annotations")
          .insert({
            article_id: annotation.article_id,
            user_id: uid,
            user_name: annotation.user_name,
            user_avatar: annotation.user_avatar,
            content: annotation.content,
            selected_text: annotation.selected_text,
            start_offset: annotation.start_offset,
            end_offset: annotation.end_offset,
            category: annotation.category,
            is_public: annotation.is_public,
          })
          .select()
          .single();
        
        if (inserted) {
          return inserted as Annotation;
        }
      }
    } catch {}
  }

  return newAnnotation;
}

export async function getAnnotations(articleId: string): Promise<Annotation[]> {
  const local = loadLocal().filter(a => a.article_id === articleId);

  if (await isLoggedIn()) {
    try {
      const { data: cloud } = await supabase
        .from("annotations")
        .select("*")
        .eq("article_id", articleId)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(50);

      if (cloud && cloud.length > 0) {
        const cloudIds = new Set(local.map(a => a.id));
        const uniqueCloud = cloud.filter((a: any) => !cloudIds.has(a.id));
        return [...local, ...uniqueCloud as Annotation[]];
      }
    } catch {}
  }

  return local;
}

export async function getMyAnnotations(): Promise<Annotation[]> {
  if (await isLoggedIn()) {
    try {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;
      if (uid) {
        const { data: annotations } = await supabase
          .from("annotations")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(100);
        
        if (annotations) {
          return annotations as Annotation[];
        }
      }
    } catch {}
  }

  return loadLocal();
}

export async function deleteAnnotation(id: string): Promise<void> {
  const local = loadLocal();
  saveLocal(local.filter(a => a.id !== id));

  if (await isLoggedIn()) {
    try {
      await supabase.from("annotations").delete().eq("id", id);
    } catch {}
  }
}

export async function likeAnnotation(id: string): Promise<void> {
  if (await isLoggedIn()) {
    try {
      const { data: annotation } = await supabase
        .from("annotations")
        .select("likes")
        .eq("id", id)
        .single();
      
      if (annotation) {
        await supabase
          .from("annotations")
          .update({ likes: annotation.likes + 1 })
          .eq("id", id);
      }
    } catch {}
  }
}

import { supabase, isLoggedIn } from "@/integrations/supabase/client";

const LOCAL_KEY = "sukou_interests";

export async function getUserInterests(): Promise<string[]> {
  if (await isLoggedIn()) {
    try {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;
      if (uid) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("interests")
          .eq("id", uid)
          .maybeSingle();
        
        if (profile?.interests && Array.isArray(profile.interests)) {
          return profile.interests;
        }
      }
    } catch {
      // fall through to local
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveUserInterests(interests: string[]): Promise<void> {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(interests));
  } catch {
    // ignore
  }

  if (await isLoggedIn()) {
    try {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;
      if (uid) {
        await supabase
          .from("profiles")
          .update({ interests, onboarded: true })
          .eq("id", uid);
      }
    } catch {
      // ignore
    }
  }
}

export function sortByInterests<T extends { category?: string; tags?: string[] }>(
  items: T[],
  interests: string[]
): T[] {
  if (!interests.length) return items;

  const interestSet = new Set(interests.map((i) => i.toLowerCase()));

  const scored = items.map((item) => {
    let score = 0;
    if (item.category && interestSet.has(item.category.toLowerCase())) {
      score += 10;
    }
    if (item.tags) {
      item.tags.forEach((tag) => {
        if (interestSet.has(tag.toLowerCase())) score += 5;
      });
    }
    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.item);
}

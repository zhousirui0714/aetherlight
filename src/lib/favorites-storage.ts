import { supabase } from "@/integrations/supabase/client";

const FAVORITES_KEY = "suguang:favorites";

// ============================================================
// localStorage 基础操作（适用于访客模式）
// ============================================================

export interface FavoriteItem {
  id: string;
  item_id: string;
  item_type: "knowledge" | "quote" | "poetry" | "person";
  title: string;
  snippet: string;
  created_at: string;
}

export function loadFavoritesLocal(): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FavoriteItem[];
  } catch {
    return [];
  }
}

export function saveFavoritesLocal(favorites: FavoriteItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch {}
}

export function addFavoriteLocal(item: Omit<FavoriteItem, "id" | "created_at">): FavoriteItem {
  const favorites = loadFavoritesLocal();
  const newItem: FavoriteItem = {
    ...item,
    id: `local-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  // 避免重复收藏
  const exists = favorites.some(f => f.item_id === item.item_id && f.item_type === item.item_type);
  if (!exists) {
    saveFavoritesLocal([newItem, ...favorites]);
  }
  return newItem;
}

export function removeFavoriteLocal(itemId: string): void {
  const favorites = loadFavoritesLocal();
  saveFavoritesLocal(favorites.filter(f => f.id !== itemId && f.item_id !== itemId));
}

export function isFavoritedLocal(itemId: string): boolean {
  const favorites = loadFavoritesLocal();
  return favorites.some(f => f.item_id === itemId);
}

// ============================================================
// Supabase 云同步（适用于已登录用户）
// ============================================================

export async function loadFavoritesFromCloud(): Promise<FavoriteItem[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return [];

  const { data, error } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load favorites:", error);
    return [];
  }

  return (data || []) as FavoriteItem[];
}

export async function addFavoriteToCloud(
  item: Omit<FavoriteItem, "id" | "created_at">
): Promise<FavoriteItem | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data, error } = await supabase
    .from("favorites")
    .insert({
      user_id: session.user.id,
      item_id: item.item_id,
      item_type: item.item_type,
      title: item.title,
      snippet: item.snippet,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to add favorite:", error);
    return null;
  }

  return data as FavoriteItem;
}

export async function removeFavoriteFromCloud(itemId: string): Promise<boolean> {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("id", itemId);

  if (error) {
    console.error("Failed to remove favorite:", error);
    return false;
  }
  return true;
}

export async function isFavoritedInCloud(itemId: string): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return false;

  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("item_id", itemId)
    .single();

  return !!data;
}

// ============================================================
// 统一接口
// ============================================================

export async function isLoggedIn(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session?.user;
}

export async function addFavorite(
  item: Omit<FavoriteItem, "id" | "created_at">
): Promise<{ success: boolean; favorite?: FavoriteItem }> {
  // 先添加到本地
  const localFavorite = addFavoriteLocal(item);

  // 如果已登录，同步到云端
  if (await isLoggedIn()) {
    const cloudFavorite = await addFavoriteToCloud(item);
    if (cloudFavorite) {
      // 云端成功，移除本地添加的（用云端数据替换）
      removeFavoriteLocal(localFavorite.id);
      return { success: true, favorite: cloudFavorite };
    }
  }

  return { success: true, favorite: localFavorite };
}

export async function removeFavorite(itemId: string): Promise<boolean> {
  // 先移除本地
  removeFavoriteLocal(itemId);

  // 如果已登录，同步到云端
  if (await isLoggedIn()) {
    return await removeFavoriteFromCloud(itemId);
  }

  return true;
}

export async function checkIsFavorited(itemId: string): Promise<boolean> {
  if (await isLoggedIn()) {
    return await isFavoritedInCloud(itemId);
  }
  return isFavoritedLocal(itemId);
}

export async function loadAllFavorites(): Promise<FavoriteItem[]> {
  if (await isLoggedIn()) {
    return await loadFavoritesFromCloud();
  }
  return loadFavoritesLocal();
}

import { supabase, isLoggedIn } from "@/integrations/supabase/client";

export type JourneyEventType =
  | "article_view"
  | "dialogue_read"
  | "dialogue_chat"
  | "quiz_complete"
  | "creation_make"
  | "post_create"
  | "favorite_add"
  | "knowledge_explore";

export interface JourneyEvent {
  id: string;
  type: JourneyEventType;
  title: string;
  description: string;
  category: string;
  timestamp: number;
  metadata?: Record<string, string | number>;
}

export interface JourneyMilestone {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  type: JourneyEventType;
}

export interface UserJourney {
  events: JourneyEvent[];
  totalDays: number;
  firstVisit: number;
  streak: number;
  badges: string[];
}

const MILESTONES: JourneyMilestone[] = [
  { id: "poetry_seed", name: "诗心初萌", description: "阅读了 5 首诗词", icon: "🌱", requirement: 5, type: "article_view" },
  { id: "poetry_sprout", name: "诗意萌芽", description: "阅读了 20 首诗词", icon: "🌿", requirement: 20, type: "article_view" },
  { id: "poetry_tree", name: "诗情画意", description: "阅读了 50 首诗词", icon: "🌳", requirement: 50, type: "article_view" },
  { id: "poetry_forest", name: "诗满天下", description: "阅读了 100 首诗词", icon: "🎋", requirement: 100, type: "article_view" },
  { id: "dialogue_novice", name: "雅士初会", description: "与 3 位名家对话", icon: "🤝", requirement: 3, type: "dialogue_chat" },
  { id: "dialogue_companion", name: "故人相伴", description: "与 10 位名家对话", icon: "👥", requirement: 10, type: "dialogue_chat" },
  { id: "quiz_apprentice", name: "文试初登", description: "完成 5 次答题", icon: "📝", requirement: 5, type: "quiz_complete" },
  { id: "quiz_scholar", name: "才高八斗", description: "完成 20 次答题", icon: "🏆", requirement: 20, type: "quiz_complete" },
  { id: "quiz_master", name: "学富五车", description: "完成 50 次答题", icon: "👑", requirement: 50, type: "quiz_complete" },
  { id: "creator_novice", name: "妙手丹青", description: "创作 3 幅作品", icon: "🎨", requirement: 3, type: "creation_make" },
  { id: "creator_master", name: "丹青妙手", description: "创作 10 幅作品", icon: "🖌️", requirement: 10, type: "creation_make" },
  { id: "community_seed", name: "竹林初笋", description: "发表 1 篇帖子", icon: "🎋", requirement: 1, type: "post_create" },
  { id: "community_bamboo", name: "竹林深处", description: "发表 5 篇帖子", icon: "🎍", requirement: 5, type: "post_create" },
  { id: "streak_7", name: "七日之约", description: "连续访问 7 天", icon: "📅", requirement: 7, type: "dialogue_chat" },
  { id: "streak_30", name: "月下之约", description: "连续访问 30 天", icon: "🌙", requirement: 30, type: "dialogue_chat" },
  { id: "collector", name: "博雅收藏", description: "收藏 10 篇文章", icon: "📚", requirement: 10, type: "favorite_add" },
];

const LOCAL_KEY = "sukou_journey";
const MAX_EVENTS = 500;

function loadLocal(): UserJourney {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      const journey = JSON.parse(raw) as UserJourney;
      return journey;
    }
  } catch {}
  return {
    events: [],
    totalDays: 0,
    firstVisit: Date.now(),
    streak: 0,
    badges: [],
  };
}

function saveLocal(journey: UserJourney) {
  try {
    journey.events = journey.events.slice(0, MAX_EVENTS);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(journey));
  } catch {}
}

function checkMilestones(journey: UserJourney): string[] {
  const newBadges: string[] = [];
  
  for (const milestone of MILESTONES) {
    if (journey.badges.includes(milestone.id)) continue;
    
    const count = journey.events.filter(e => e.type === milestone.type).length;
    if (count >= milestone.requirement) {
      newBadges.push(milestone.id);
    }
  }
  
  // 检查连续访问
  const streakBadge = MILESTONES.find(m => m.id === "streak_7" || m.id === "streak_30");
  if (streakBadge && !journey.badges.includes(streakBadge.id) && journey.streak >= streakBadge.requirement) {
    newBadges.push(streakBadge.id);
  }
  
  return newBadges;
}

export async function trackEvent(event: Omit<JourneyEvent, "id" | "timestamp">): Promise<string[]> {
  const journey = loadLocal();
  
  const newEvent: JourneyEvent = {
    ...event,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  
  journey.events.unshift(newEvent);
  
  // 更新连续访问
  const today = new Date().toDateString();
  const lastVisit = localStorage.getItem("sukou_last_visit");
  if (lastVisit) {
    const lastDate = new Date(lastVisit);
    const diffDays = Math.floor((Date.now() - lastDate.getTime()) / 86400000);
    if (diffDays === 1) {
      journey.streak += 1;
    } else if (diffDays > 1) {
      journey.streak = 1;
    }
  } else {
    journey.streak = 1;
  }
  journey.totalDays = new Set(journey.events.map(e => new Date(e.timestamp).toDateString())).size;
  
  // 检查徽章
  const newBadges = checkMilestones({ ...journey });
  journey.badges = [...journey.badges, ...newBadges];
  
  saveLocal(journey);
  
  // 云端同步（登录用户）
  if (await isLoggedIn()) {
    try {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;
      if (uid) {
        await supabase.from("journey_events").insert({
          user_id: uid,
          type: event.type,
          title: event.title,
          description: event.description,
          category: event.category,
          metadata: event.metadata,
        });
      }
    } catch {}
  }
  
  localStorage.setItem("sukou_last_visit", new Date().toISOString());
  
  return newBadges;
}

export async function getJourney(): Promise<UserJourney> {
  const local = loadLocal();
  
  if (await isLoggedIn()) {
    try {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;
      if (uid) {
        const { data: rows } = await supabase
          .from("journey_events")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(MAX_EVENTS);
        
        if (rows && rows.length > 0) {
          const cloudEvents = rows.map(r => ({
            id: r.id,
            type: r.type as JourneyEventType,
            title: r.title,
            description: r.description,
            category: r.category,
            timestamp: new Date(r.created_at).getTime(),
            metadata: r.metadata,
          }));
          
          // 合并云端和本地，优先使用本地最新数据
          const merged = [...local.events];
          for (const ce of cloudEvents) {
            if (!merged.some(e => e.id === ce.id)) {
              merged.push(ce);
            }
          }
          merged.sort((a, b) => b.timestamp - a.timestamp);
          
          return { ...local, events: merged.slice(0, MAX_EVENTS) };
        }
      }
    } catch {}
  }
  
  return local;
}

export function getMilestones(): JourneyMilestone[] {
  return MILESTONES;
}

export function getMilestoneById(id: string): JourneyMilestone | undefined {
  return MILESTONES.find(m => m.id === id);
}

export function getJourneyStats(events: JourneyEvent[]) {
  const stats = {
    articlesRead: events.filter(e => e.type === "article_view").length,
    dialoguesHad: events.filter(e => e.type === "dialogue_chat").length,
    quizzesDone: events.filter(e => e.type === "quiz_complete").length,
    creationsMade: events.filter(e => e.type === "creation_make").length,
    postsCreated: events.filter(e => e.type === "post_create").length,
    favoritesAdded: events.filter(e => e.type === "favorite_add").length,
  };
  return stats;
}

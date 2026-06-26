// scripts/infer-expanded-content.mjs
// 为 4 篇关键文章 (gugong / libai / 子亞甲 / lunyu) 跑一遍智能推断引擎，
// 把结果持久化到 src/lib/generated-expanded.json
// 运行时 (expanded-content.ts) 优先用这份 JSON，缺数据时再回退到现场推断
//
// 使用：node scripts/infer-expanded-content.mjs

import fs from 'node:fs';
import path from 'node:path';

// ---- 1. 用正则从 knowledge-data.ts 抽出 ARTICLES ----
function parseArticlesFromTs() {
  const src = fs.readFileSync('src/lib/knowledge-data.ts', 'utf8');

  // 匹配 {id: "x", ...} 整段 — 必须是顶层 article (有 content / history / influence 之一)
  // 忽略 relatedPeople / relatedArticles 等嵌套数组中的小型 {id, title, brief}
  const articles = [];
  const startMarkers = /\{\s*id:\s*"([^"]+)"/g;
  let m;
  while ((m = startMarkers.exec(src)) !== null) {
    const start = m.index;
    // 找匹配的右花括号
    let depth = 0;
    let end = -1;
    for (let i = start; i < src.length; i++) {
      const ch = src[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }
    if (end === -1) continue;
    const block = src.slice(start, end + 1);
    // 必须是顶层 article (含 content 或 history 字段)
    if (!/content:\s*"|history:\s*"/.test(block)) continue;

    try {
      // 简单字段提取
      const id = m[1];
      const title = block.match(/title:\s*"([^"]*)"/)?.[1] || id;
      const category = block.match(/category:\s*"([^"]*)"/)?.[1] || '';
      const excerpt = block.match(/excerpt:\s*"((?:\\.|[^"\\])*)"/)?.[1] || '';
      const content = block.match(/content:\s*"((?:\\.|[^"\\])*)"/)?.[1] || '';
      const history = block.match(/history:\s*"((?:\\.|[^"\\])*)"/)?.[1] || '';
      const influence = block.match(/influence:\s*"((?:\\.|[^"\\])*)"/)?.[1] || '';
      const region = block.match(/region:\s*"((?:\\.|[^"\\])*)"/)?.[1] || '';
      const dynasty = block.match(/dynasty:\s*"((?:\\.|[^"\\])*)"/)?.[1] || '';

      // relatedPeople 数组
      const relatedPeople = [];
      const peopleMatch = block.match(/relatedPeople:\s*\[([\s\S]*?)\]/);
      if (peopleMatch) {
        const itemRe = /\{\s*id:\s*"([^"]+)",\s*title:\s*"([^"]+)"(?:,\s*brief:\s*"([^"]*)")?\s*\}/g;
        let pm;
        while ((pm = itemRe.exec(peopleMatch[1])) !== null) {
          relatedPeople.push({ id: pm[1], title: pm[2], brief: pm[3] || '' });
        }
      }

      // relatedArticles
      const relatedArticles = [];
      const raMatch = block.match(/relatedArticles:\s*\[([\s\S]*?)\]/);
      if (raMatch) {
        const itemRe = /\{\s*id:\s*"([^"]+)",\s*title:\s*"([^"]+)"(?:,\s*category:\s*"([^"]*)")?(?:,\s*brief:\s*"([^"]*)")?\s*\}/g;
        let pm;
        while ((pm = itemRe.exec(raMatch[1])) !== null) {
          relatedArticles.push({ id: pm[1], title: pm[2], category: pm[3] || '', brief: pm[4] || '' });
        }
      }

      articles.push({
        id, title, category, excerpt, content, history, influence, region, dynasty,
        relatedPeople, relatedArticles,
      });
    } catch (e) {
      console.warn(`[parse] skip ${m[1]}: ${e.message}`);
    }
  }
  return articles;
}

// ---- 2. 复制一份核心推断逻辑 (与 src/lib/expanded-content.ts 同源) ----
const CITY_COORDS = {
  '北京': { lat: 39.9042, lng: 116.4074, name: '北京' },
  '故宫': { lat: 39.9163, lng: 116.3972, name: '北京故宫' },
  '紫禁城': { lat: 39.9163, lng: 116.3972, name: '北京紫禁城' },
  '西安': { lat: 34.2632, lng: 108.9485, name: '西安' },
  '长安': { lat: 34.2632, lng: 108.9485, name: '长安' },
  '洛阳': { lat: 34.6197, lng: 112.4539, name: '洛阳' },
  '南京': { lat: 32.0603, lng: 118.7969, name: '南京' },
  '金陵': { lat: 32.0603, lng: 118.7969, name: '金陵' },
  '杭州': { lat: 30.2741, lng: 120.1551, name: '杭州' },
  '苏州': { lat: 31.2989, lng: 120.5853, name: '苏州' },
  '成都': { lat: 30.5728, lng: 104.0668, name: '成都' },
  '广州': { lat: 23.1291, lng: 113.2644, name: '广州' },
  '敦煌': { lat: 40.1421, lng: 94.6612, name: '敦煌' },
  '曲阜': { lat: 35.5947, lng: 116.9866, name: '曲阜' },
  '绍兴': { lat: 30.0023, lng: 120.5810, name: '绍兴' },
  '扬州': { lat: 32.3947, lng: 119.4124, name: '扬州' },
  '开封': { lat: 34.7972, lng: 114.3076, name: '开封' },
  '亳州': { lat: 33.8693, lng: 115.7787, name: '亳州' },
  '天水': { lat: 34.5805, lng: 105.7249, name: '天水' },
  '大理': { lat: 25.6065, lng: 100.2679, name: '大理' },
  '武汉': { lat: 30.5928, lng: 114.3055, name: '武汉' },
  '黄鹤楼': { lat: 30.5448, lng: 114.3055, name: '黄鹤楼' },
  '长沙': { lat: 28.2282, lng: 112.9388, name: '长沙' },
  '济南': { lat: 36.6512, lng: 117.1201, name: '济南' },
  '泰山': { lat: 36.2540, lng: 117.1010, name: '泰山' },
  '岳阳': { lat: 29.3576, lng: 113.1289, name: '岳阳' },
  '岳阳楼': { lat: 29.3576, lng: 113.1289, name: '岳阳楼' },
  '滕王阁': { lat: 28.6810, lng: 115.8920, name: '滕王阁' },
  '蓬莱': { lat: 37.8047, lng: 120.7586, name: '蓬莱' },
  '峨眉山': { lat: 29.5429, lng: 103.3346, name: '峨眉山' },
  '黄山': { lat: 29.7147, lng: 118.3376, name: '黄山' },
};

function matchCoordinates(region, title) {
  const text = `${region || ''} ${title || ''}`;
  for (const [key, coord] of Object.entries(CITY_COORDS)) {
    if (text.includes(key)) return coord;
  }
  return undefined;
}

function parseYearsToTimeline(text) {
  if (!text) return null;
  const re = /([秦汉魏晋南北朝隋唐五代宋元明清](?:[\u4e00-\u9fa5]{0,3}年)?(?:\d{1,4}年)?|(?:\d{4}年(?:\d{1,2}月)?))/g;
  const events = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const year = m[0];
    const start = m.index + m[0].length;
    const desc = text.slice(start, start + 80).split(/[\n。]/)[0]?.trim() || '';
    if (desc.length > 6) {
      events.push({ year, title: desc.slice(0, 24), description: desc.slice(0, 80) });
    }
    if (events.length >= 8) break;
  }
  return events.length >= 2 ? events : null;
}

function parseSectionsToTimeline(text) {
  if (!text) return null;
  const re = /【([\u4e00-\u9fa5、，·\s]{2,20})】/g;
  const events = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const title = m[1].trim();
    const start = m.index + m[0].length;
    const desc = text.slice(start, start + 80).split(/[\n。]/)[0]?.trim() || '';
    if (title.length < 2) continue;
    events.push({ year: '', title, description: desc });
    if (events.length >= 10) break;
  }
  return events.length >= 2 ? events : null;
}

function parseChapters(text) {
  if (!text) return null;
  const re = /(?:^|\n)\s*(?:第[一二三四五六七八九十百]+(?:章|篇|回|卷|节)|[一二三四五六七八九十]+[、.])\s*([^\n。]{2,30})/g;
  const chapters = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const title = (m[0] + '').replace(/\s+/g, ' ').trim();
    const brief = text.slice(m.index + m[0].length, m.index + m[0].length + 60).split(/[\n。]/)[0]?.trim() || '';
    if (title.length < 4) continue;
    chapters.push({ title, brief: brief.length > 4 ? brief : undefined });
    if (chapters.length >= 12) break;
  }
  return chapters.length >= 2 ? chapters : null;
}

function parseCharacters(text) {
  if (!text) return null;
  const re = /([\u4e00-\u9fa5]{2,3})(?:是|为|乃|即|称|谓之|曰|者)/g;
  const set = new Set();
  const characters = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    const name = m[1];
    if (set.has(name)) continue;
    if (['皇帝', '百姓', '众人', '大人', '此时', '于是', '然后', '因为', '因此', '可见', '所以'].includes(name)) continue;
    set.add(name);
    const descStart = Math.max(0, m.index - 30);
    const desc = text.slice(descStart, m.index + 60).trim();
    if (desc.length < 10) continue;
    characters.push({ name, role: '角色', description: desc });
    if (characters.length >= 6) break;
  }
  return characters.length >= 2 ? characters : null;
}

function inferExpanded(a) {
  const text = `${a.content || ''} ${a.history || ''} ${a.influence || ''}`;
  return {
    timeline: parseSectionsToTimeline(text) || parseYearsToTimeline(text) || [],
    characters: parseCharacters(text) || [],
    chapters: parseChapters(text) || [],
    coordinates: matchCoordinates(a.region, a.title),
    relationships: {
      teachers: (a.relatedPeople || []).filter((p) => /师|teacher|传|受业/i.test(p.brief || '')),
      friends: (a.relatedPeople || []).filter((p) => !/师|teacher|传|受业|弟子|学生|父|母|子|女|兄|弟/i.test(p.brief || '')),
      students: (a.relatedPeople || []).filter((p) => /弟子|学生|师承|受教/i.test(p.brief || '')),
      family: (a.relatedPeople || []).filter((p) => /父|母|子|女|兄|弟|姐|妹|家|族|妻/i.test(p.brief || '')),
    },
    relatedBuildings: (a.relatedArticles || []).filter((r) => r.category === '建筑古迹'),
  };
}

// ---- 3. 主流程 ----
// 严格只匹配指定 ID (用户输入)
const TARGET_IDS = ['gugong', 'libai', 'ziyajia', 'lunyu'];
// '子亞甲' 在数据里可能叫别的 id (实际上古蜀青铜器), 这里兼容关键词
const TARGET_KEYWORDS = ['故宫', '紫禁城'];

const articles = parseArticlesFromTs();
console.log(`[infer] parsed ${articles.length} top-level articles from knowledge-data.ts`);

const target = articles.filter((a) =>
  TARGET_IDS.includes(a.id) || TARGET_KEYWORDS.some((kw) => a.title?.includes(kw))
);
console.log(`[infer] matched ${target.length} key articles: ${target.map((t) => `${t.id}(${t.title})`).join(', ')}`);

if (target.length === 0) {
  console.warn('[infer] no key articles found, dumping all titles to help debug:');
  console.warn(articles.map((a) => a.id).slice(0, 30).join(', '));
  process.exit(0);
}

const outFile = 'src/lib/generated-expanded.json';
const existing = fs.existsSync(outFile)
  ? JSON.parse(fs.readFileSync(outFile, 'utf8'))
  : {};

for (const a of target) {
  const inferred = inferExpanded(a);
  existing[a.id] = inferred;
  console.log(`[infer] ${a.id} (${a.title}): timeline=${inferred.timeline.length} chapters=${inferred.chapters.length} characters=${inferred.characters.length} coords=${inferred.coordinates?.name || 'none'}`);
}

fs.writeFileSync(outFile, JSON.stringify(existing, null, 2), 'utf8');
console.log(`[infer] wrote ${outFile} (${target.length} entries)`);

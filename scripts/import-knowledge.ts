/**
 * Supabase 知识库数据导入脚本
 * 
 * 使用方法：
 * 1. 设置环境变量 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY
 * 2. 运行: npx tsx scripts/import-knowledge.ts
 */

import { createClient } from "@supabase/supabase-js";
import { culturalKnowledge, persons, books } from "../src/lib/cultural-knowledge";

// 获取环境变量
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("请设置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 环境变量");
  process.exit(1);
}

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseKey);

interface ImportResult {
  success: boolean;
  table: string;
  count: number;
  error?: string;
}

async function importPersons(): Promise<ImportResult> {
  console.log("正在导入人物数据...");
  
  const data = Object.values(persons).map(person => ({
    name: person.name,
    name_variants: [],
    dynasty: person.dynasty,
    birth_year: person.birthYear || null,
    death_year: person.deathYear || null,
    biography: person.description,
    achievements: person.achievements,
    works: person.works,
    image_url: null,
  }));

  try {
    const { error } = await supabase.from("kb_persons").upsert(data, { 
      onConflict: "name" 
    });
    
    if (error) throw error;
    
    console.log(`✓ 成功导入 ${data.length} 条人物数据`);
    return { success: true, table: "kb_persons", count: data.length };
  } catch (error: any) {
    console.error(`✗ 人物数据导入失败:`, error.message);
    return { success: false, table: "kb_persons", count: 0, error: error.message };
  }
}

async function importBooks(): Promise<ImportResult> {
  console.log("正在导入典籍数据...");
  
  const data = Object.values(books).map(book => ({
    title: book.title,
    title_variants: [],
    dynasty: book.dynasty,
    author: book.author || null,
    summary: book.summary,
    content: book.content,
    chapters: book.chapters || [],
    category: getBookCategory(book.title),
    image_url: null,
  }));

  try {
    const { error } = await supabase.from("kb_books").upsert(data, { 
      onConflict: "title" 
    });
    
    if (error) throw error;
    
    console.log(`✓ 成功导入 ${data.length} 条典籍数据`);
    return { success: true, table: "kb_books", count: data.length };
  } catch (error: any) {
    console.error(`✗ 典籍数据导入失败:`, error.message);
    return { success: false, table: "kb_books", count: 0, error: error.message };
  }
}

async function importKnowledgeEntries(): Promise<ImportResult> {
  console.log("正在导入知识条目数据...");
  
  const data = Object.values(culturalKnowledge).map(entry => ({
    question: entry.question,
    question_variants: [],
    answer: entry.answer,
    category: getEntryCategory(entry.question),
    keywords: extractKeywords(entry),
    quotes: entry.quotes,
    sources: entry.sources,
    interpretations: entry.interpretations || null,
    scholar_analysis: entry.scholarAnalysis || null,
    graph_nodes: entry.graphNodes || [],
    view_count: 0,
    is_featured: false,
  }));

  try {
    const { error } = await supabase.from("kb_knowledge_entries").upsert(data, { 
      onConflict: "question" 
    });
    
    if (error) throw error;
    
    console.log(`✓ 成功导入 ${data.length} 条知识条目数据`);
    return { success: true, table: "kb_knowledge_entries", count: data.length };
  } catch (error: any) {
    console.error(`✗ 知识条目数据导入失败:`, error.message);
    return { success: false, table: "kb_knowledge_entries", count: 0, error: error.message };
  }
}

function getBookCategory(title: string): string {
  const poetryKeywords = ["诗", "词", "曲", "赋", "歌"];
  const philosophyKeywords = ["论语", "道德经", "孟子", "庄子", "荀子", "老子"];
  const historyKeywords = ["史记", "汉书", "三国志"];
  const literatureKeywords = ["离骚", "出师表", "桃花源记", "陋室铭", "爱莲说", "岳阳楼记"];
  
  if (poetryKeywords.some(k => title.includes(k))) return "诗词";
  if (philosophyKeywords.some(k => title.includes(k))) return "哲学";
  if (historyKeywords.some(k => title.includes(k))) return "史学";
  if (literatureKeywords.some(k => title.includes(k))) return "文学";
  return "其他";
}

function getEntryCategory(question: string): string {
  const questionLower = question.toLowerCase();
  
  if (questionLower.includes("诗") || questionLower.includes("词") || questionLower.includes("曲")) {
    return "诗词";
  }
  if (questionLower.includes("节气")) {
    return "节气";
  }
  if (questionLower.includes("节") && questionLower.includes("日")) {
    return "节日";
  }
  if (questionLower.includes("人") && questionLower.includes("物")) {
    return "人物";
  }
  if (questionLower.includes("典") || questionLower.includes("故")) {
    return "典故";
  }
  if (questionLower.includes("非遗") || questionLower.includes("戏曲") || questionLower.includes("昆曲")) {
    return "非遗";
  }
  
  return "其他";
}

function extractKeywords(entry: any): string[] {
  const keywords: string[] = [];
  
  // 从问题中提取关键词
  entry.question.replace(/《([^》]+)》/g, (_, title) => {
    keywords.push(title);
  });
  
  // 从引用中提取作者和作品
  entry.quotes.forEach((quote: any) => {
    if (!keywords.includes(quote.author)) {
      keywords.push(quote.author);
    }
    if (!keywords.includes(quote.title)) {
      keywords.push(quote.title);
    }
  });
  
  // 从图谱节点中提取标签
  if (entry.graphNodes) {
    entry.graphNodes.forEach((node: any) => {
      if (!keywords.includes(node.label)) {
        keywords.push(node.label);
      }
    });
  }
  
  return keywords.slice(0, 10); // 最多10个关键词
}

async function importPoems(): Promise<ImportResult> {
  console.log("正在导入诗词数据...");
  
  const poemsData: any[] = [];
  
  // 从知识条目中提取诗词
  Object.values(culturalKnowledge).forEach(entry => {
    entry.quotes.forEach((quote: any) => {
      // 判断是否为诗词
      if (quote.text.length > 20 && quote.text.includes("，") && quote.text.includes("。")) {
        poemsData.push({
          title: quote.title,
          author: quote.author,
          dynasty: quote.dynasty,
          content: quote.text,
          translation: null,
          annotation: null,
          appreciation: entry.interpretations || null,
          background: null,
          category: getPoemCategory(quote.title),
          tags: [quote.author, quote.dynasty],
          audio_url: null,
        });
      }
    });
  });
  
  try {
    const { error } = await supabase.from("kb_poems").upsert(poemsData, { 
      onConflict: "title,author" 
    });
    
    if (error) throw error;
    
    console.log(`✓ 成功导入 ${poemsData.length} 首诗词`);
    return { success: true, table: "kb_poems", count: poemsData.length };
  } catch (error: any) {
    console.error(`✗ 诗词数据导入失败:`, error.message);
    return { success: false, table: "kb_poems", count: 0, error: error.message };
  }
}

function getPoemCategory(title: string): string {
  const 五言绝句 = 20;
  const 七言绝句 = 28;
  const 五言律诗 = 40;
  const 七言律诗 = 56;
  const 词牌 = ["沁园春", "水调歌头", "念奴娇", "声声慢", "满江红", "水龙吟", "贺新郎", "永遇乐", "摸鱼儿"];
  
  const content = Object.values(culturalKnowledge)
    .flatMap(e => e.quotes)
    .find(q => q.title === title)?.text || "";
  
  if (词牌.some(p => title.includes(p))) {
    return "词";
  }
  
  const length = content.replace(/[，。、；：""''【】（）]/g, "").length;
  
  if (length <= 五言绝句) return "五言绝句";
  if (length <= 七言绝句) return "七言绝句";
  if (length <= 五言律诗) return "五言律诗";
  if (length <= 七言律诗) return "七言律诗";
  
  return "古体诗";
}

async function main() {
  console.log("=".repeat(50));
  console.log("开始导入知识库数据到 Supabase");
  console.log("=".repeat(50));
  console.log();
  
  const results: ImportResult[] = [];
  
  // 导入各类数据
  results.push(await importPersons());
  results.push(await importBooks());
  results.push(await importKnowledgeEntries());
  results.push(await importPoems());
  
  console.log();
  console.log("=".repeat(50));
  console.log("导入结果汇总");
  console.log("=".repeat(50));
  
  results.forEach(result => {
    if (result.success) {
      console.log(`✓ ${result.table}: ${result.count} 条`);
    } else {
      console.log(`✗ ${result.table}: ${result.error}`);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log();
  console.log(`成功: ${successCount}/${results.length}`);
  
  if (successCount === results.length) {
    console.log("所有数据导入成功！");
  } else {
    console.log("部分数据导入失败，请检查错误信息。");
    process.exit(1);
  }
}

main();

import fs from 'fs';
import path from 'path';

// 数据路径
const POETRY_ROOT = path.join(process.cwd(), '../chinese-poetry-master');

// 读取诗经
function loadShijing() {
  const data = JSON.parse(fs.readFileSync(path.join(POETRY_ROOT, '诗经/shijing.json'), 'utf-8'));
  return data.map((item, index) => ({
    id: `shijing-${index}`,
    title: item.title,
    category: '诗词',
    excerpt: item.content[0].substring(0, 50) + '...',
    body: `【${item.chapter} · ${item.section}】\n\n${item.content.join('\n')}`,
    favorites: Math.floor(Math.random() * 3000) + 500,
    cover: '🪶',
    source: '诗经',
    author: '佚名',
    tags: [item.chapter, item.section, '诗经', '国风'],
    created_at: new Date(2025, 0, 1 + index).toISOString()
  }));
}

// 读取论语
function loadLunyu() {
  const data = JSON.parse(fs.readFileSync(path.join(POETRY_ROOT, '论语/lunyu.json'), 'utf-8'));
  return data.map((item, index) => ({
    id: `lunyu-${index}`,
    title: item.chapter,
    category: '典籍',
    excerpt: item.content.substring(0, 50) + '...',
    body: `【${item.chapter}】\n\n${item.content}`,
    favorites: Math.floor(Math.random() * 2000) + 300,
    cover: '📜',
    source: '论语',
    author: '孔子及其弟子',
    tags: ['论语', '孔子', '儒家', '典籍'],
    created_at: new Date(2025, 1, 1 + index).toISOString()
  }));
}

// 读取楚辞
function loadChuci() {
  const data = JSON.parse(fs.readFileSync(path.join(POETRY_ROOT, '楚辞/chuci.json'), 'utf-8'));
  return data.map((item, index) => ({
    id: `chuci-${index}`,
    title: item.title,
    category: '诗词',
    excerpt: item.content.substring(0, 50) + '...',
    body: `【${item.section || '楚辞'}】\n\n${item.content}`,
    favorites: Math.floor(Math.random() * 2500) + 400,
    cover: '🌿',
    source: '楚辞',
    author: item.author || '屈原',
    tags: ['楚辞', '屈原', '离骚'],
    created_at: new Date(2025, 2, 1 + index).toISOString()
  }));
}

// 读取唐诗三百首
function loadTangShi300() {
  const data = JSON.parse(fs.readFileSync(path.join(POETRY_ROOT, '全唐诗/唐诗三百首.json'), 'utf-8'));
  return data.map((item, index) => ({
    id: `tangshi-300-${index}`,
    title: `${item.title} · ${item.author}`,
    category: '诗词',
    excerpt: item.content.substring(0, 50) + '...',
    body: `【${item.title}】\n唐 · ${item.author}\n\n${item.content}\n\n【注释】${item.comment || '暂无注释'}\n【译文】${item.translate || '暂无译文'}`,
    favorites: Math.floor(Math.random() * 5000) + 1000,
    cover: '📜',
    source: '唐诗三百首',
    author: item.author,
    tags: ['唐诗', '诗词', item.author],
    created_at: new Date(2025, 3, 1 + index).toISOString()
  }));
}

// 读取宋词三百首
function loadSongCi300() {
  const data = JSON.parse(fs.readFileSync(path.join(POETRY_ROOT, '宋词/宋词三百首.json'), 'utf-8'));
  return data.map((item, index) => ({
    id: `songci-300-${index}`,
    title: `${item.title} · ${item.author}`,
    category: '诗词',
    excerpt: (item.content || item.paragraphs?.join('，'))?.substring(0, 50) + '...',
    body: `【${item.title}】\n宋 · ${item.author}\n\n${item.content || item.paragraphs?.join('\n')}\n\n【词牌】${item.rhythnic || '未知'}`,
    favorites: Math.floor(Math.random() * 4000) + 800,
    cover: '🌸',
    source: '宋词三百首',
    author: item.author,
    tags: ['宋词', '词', item.author],
    created_at: new Date(2025, 4, 1 + index).toISOString()
  }));
}

// 读取元曲
function loadYuanQu() {
  const data = JSON.parse(fs.readFileSync(path.join(POETRY_ROOT, '元曲/yuanqu.json'), 'utf-8'));
  return data.slice(0, 100).map((item, index) => ({
    id: `yuanqu-${index}`,
    title: item.title,
    category: '诗词',
    excerpt: item.content?.substring(0, 50) || item.paragraphs?.join('，')?.substring(0, 50) + '...',
    body: `【${item.title}】\n元 · ${item.author || '佚名'}\n\n${item.content || item.paragraphs?.join('\n')}`,
    favorites: Math.floor(Math.random() * 2000) + 300,
    cover: '🎭',
    source: '元曲',
    author: item.author || '佚名',
    tags: ['元曲', '戏曲', item.author],
    created_at: new Date(2025, 5, 1 + index).toISOString()
  }));
}

// 读取幽梦影
function loadYouMengYing() {
  const data = JSON.parse(fs.readFileSync(path.join(POETRY_ROOT, '幽梦影/youmengying.json'), 'utf-8'));
  return data.slice(0, 100).map((item, index) => ({
    id: `youmengying-${index}`,
    title: item.title || `幽梦影·第${index + 1}则`,
    category: '典籍',
    excerpt: item.content?.substring(0, 50) || '暂无内容...',
    body: `【幽梦影】\n\n${item.content || item.text || ''}\n\n—— 张潮`,
    favorites: Math.floor(Math.random() * 1500) + 200,
    cover: '🌙',
    source: '幽梦影',
    author: '张潮',
    tags: ['幽梦影', '张潮', '明清文学'],
    created_at: new Date(2025, 6, 1 + index).toISOString()
  }));
}

// 读取纳兰性德
function loadNalan() {
  const data = JSON.parse(fs.readFileSync(path.join(POETRY_ROOT, '纳兰性德/纳兰性德诗集.json'), 'utf-8'));
  return data.map((item, index) => ({
    id: `nalan-${index}`,
    title: item.title,
    category: '诗词',
    excerpt: item.content?.substring(0, 50) || '暂无内容...',
    body: `【${item.title}】\n清 · 纳兰性德\n\n${item.content || ''}`,
    favorites: Math.floor(Math.random() * 3500) + 600,
    cover: '💧',
    source: '纳兰性德诗集',
    author: '纳兰性德',
    tags: ['纳兰词', '清词', '纳兰性德'],
    created_at: new Date(2025, 7, 1 + index).toISOString()
  }));
}

// 主函数：整合所有数据
async function generateKnowledgeData() {
  console.log('开始生成知识长廊数据...');

  const articles = [];

  try {
    console.log('读取诗经...');
    articles.push(...loadShijing());
    console.log(`诗经: ${loadShijing().length} 篇`);
  } catch (e) {
    console.log('诗经读取失败:', e.message);
  }

  try {
    console.log('读取论语...');
    articles.push(...loadLunyu());
    console.log(`论语: ${loadLunyu().length} 篇`);
  } catch (e) {
    console.log('论语读取失败:', e.message);
  }

  try {
    console.log('读取楚辞...');
    articles.push(...loadChuci());
    console.log(`楚辞: ${loadChuci().length} 篇`);
  } catch (e) {
    console.log('楚辞读取失败:', e.message);
  }

  try {
    console.log('读取唐诗三百首...');
    articles.push(...loadTangShi300());
    console.log(`唐诗三百首: ${loadTangShi300().length} 篇`);
  } catch (e) {
    console.log('唐诗三百首读取失败:', e.message);
  }

  try {
    console.log('读取宋词三百首...');
    articles.push(...loadSongCi300());
    console.log(`宋词三百首: ${loadSongCi300().length} 篇`);
  } catch (e) {
    console.log('宋词三百首读取失败:', e.message);
  }

  try {
    console.log('读取元曲...');
    articles.push(...loadYuanQu());
    console.log(`元曲: ${loadYuanQu().length} 篇`);
  } catch (e) {
    console.log('元曲读取失败:', e.message);
  }

  try {
    console.log('读取幽梦影...');
    articles.push(...loadYouMengYing());
    console.log(`幽梦影: ${loadYouMengYing().length} 篇`);
  } catch (e) {
    console.log('幽梦影读取失败:', e.message);
  }

  try {
    console.log('读取纳兰性德...');
    articles.push(...loadNalan());
    console.log(`纳兰性德: ${loadNalan().length} 篇`);
  } catch (e) {
    console.log('纳兰性德读取失败:', e.message);
  }

  // 读取现有的知识文章
  const existingFile = path.join(process.cwd(), '../backend/data/knowledge_articles.json');
  if (fs.existsSync(existingFile)) {
    const existing = JSON.parse(fs.readFileSync(existingFile, 'utf-8'));
    console.log(`现有知识文章: ${existing.length} 篇`);
    // 合并现有数据
    articles.push(...existing);
  }

  // 去重
  const uniqueArticles = articles.filter((item, index, self) =>
    index === self.findIndex(t => t.id === item.id)
  );

  console.log(`\n总计: ${uniqueArticles.length} 篇文章`);

  // 保存到文件
  const outputPath = path.join(process.cwd(), '../backend/data/knowledge_articles_full.json');
  fs.writeFileSync(outputPath, JSON.stringify(uniqueArticles, null, 2), 'utf-8');
  console.log(`已保存到: ${outputPath}`);

  // 生成 SQL 导入脚本
  const sqlPath = path.join(process.cwd(), '../backend/db/seed_poetry_data.sql');
  const sqlStatements = uniqueArticles.map(item => {
    const tags = item.tags || [];
    return `INSERT INTO knowledge_articles (id, title, category, excerpt, body, cover, source, author, tags, favorites, created_at)
VALUES (
  '${item.id}',
  E'${(item.title || '').replace(/'/g, "''")}',
  '${item.category}',
  E'${(item.excerpt || '').replace(/'/g, "''")}',
  E'${(item.body || '').replace(/'/g, "''")}',
  '${item.cover || '📜'}',
  '${item.source || ''}',
  '${item.author || '匿名'}',
  ARRAY[${tags.map(t => `'${t}'`).join(', ')}],
  ${item.favorites || 0},
  '${item.created_at || new Date().toISOString()}'
) ON CONFLICT (id) DO NOTHING;`;
  }).join('\n\n');

  fs.writeFileSync(sqlPath, `-- 诗词典籍数据导入\n-- 生成时间: ${new Date().toISOString()}\n-- 总计: ${uniqueArticles.length} 篇文章\n\n${sqlStatements}`, 'utf-8');
  console.log(`SQL脚本已保存到: ${sqlPath}`);

  return uniqueArticles;
}

generateKnowledgeData().catch(console.error);

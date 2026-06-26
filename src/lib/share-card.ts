/**
 * 知识卡片分享图生成器
 *
 * 纯 Canvas API 自绘，不依赖 html2canvas 等大型库。
 * 画布尺寸 1080x1440（3:4 比例，适配 IG/小红书/朋友圈）。
 */

export interface ShareCardData {
  title: string;
  category: string;          // 分类徽章
  dynasty?: string;          // 朝代
  excerpt: string;           // 摘要
  author?: string;           // 作者
  articleUrl: string;        // 详情页 URL
  coverEmoji?: string;       // 兜底 emoji（无封面图时用）
  coverUrl?: string;         // 封面图 URL（增强版会作为背景大图）
  tags?: string[];           // 标签 (3 个以内)
}

const W = 1080;
const H = 1440;

// 新中式水墨配色
const COLORS = {
  paper: "#F5F0E2",
  paperDark: "#E8DCC4",
  ink: "#3C2C1E",
  inkLight: "#5C4A38",
  cinnabar: "#B53A2A",
  bronze: "#8B7355",
  white: "#FAF6EC",
};

const FONT_SERIF = '"Noto Serif SC", "Songti SC", "STSong", serif';

/**
 * 在 Canvas 上绘制分享卡，返回 dataURL
 */
export async function renderShareCard(data: ShareCardData): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  // 1. 背景：宣纸纹理（径向渐变模拟）
  drawPaperBackground(ctx);

  // 1.5 封面背景大图（如有）
  if (data.coverUrl) {
    await drawCoverBackground(ctx, data.coverUrl);
  }

  // 2. 顶部装饰：朱砂横线 + 飞白墨点
  drawTopDecor(ctx);

  // 3. 分类徽章
  drawCategoryBadge(ctx, data.category);

  // 4. 朝代（如果有）
  let cursorY = 280;
  if (data.dynasty) {
    drawDynasty(ctx, data.dynasty, cursorY);
    cursorY += 60;
  }

  // 5. 大标题（自适应字号）
  cursorY += 30;
  cursorY = drawTitle(ctx, data.title, cursorY);

  // 6. 朱砂分隔线
  cursorY += 30;
  drawCinnabarDivider(ctx, cursorY);
  cursorY += 40;

  // 7. 摘要（最多 5 行）
  cursorY = drawExcerpt(ctx, data.excerpt, cursorY);

  // 8. 作者（如果有）
  if (data.author) {
    cursorY += 20;
    drawAuthor(ctx, data.author, cursorY);
    cursorY += 30;
  }

  // 8.5 标签气泡
  if (data.tags && data.tags.length > 0) {
    // 防止 tags 越过 footer (H - 260)
    if (cursorY < H - 300) {
      drawTags(ctx, data.tags, cursorY);
      cursorY += 50;
    }
  }

  // 9. 底部印章 + 溯光签名 + URL + 二维码
  drawFooter(ctx, data.articleUrl);

  // 10. 边缘水墨装饰
  drawInkSplash(ctx);

  return canvas.toDataURL("image/png", 0.95);
}

/**
 * 分类专属印章文字
 */
const CATEGORY_SEAL: Record<string, string> = {
  poems: "诗",
  figures: "传",
  classics: "典",
  artifacts: "器",
  festivals: "节",
  philosophy: "道",
  technology: "工",
  intangible: "艺",
  lifestyle: "俗",
  mythology: "神",
  cuisine: "食",
  architecture: "建",
  medicine: "医",
  art: "美",
  music: "音",
  clothing: "服",
  geography: "地",
  education: "教",
  default: "文",
};

/**
 * 封面图作为背景大图（异步加载）
 */
async function drawCoverBackground(ctx: CanvasRenderingContext2D, url: string) {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("封面超时")), 5000);
      img.onload = () => { clearTimeout(t); resolve(); };
      img.onerror = () => { clearTimeout(t); reject(new Error("封面加载失败")); };
      img.src = url;
    });
    // 30% 透明度铺满顶部 35% 区域 (不遮挡分类徽章)
    ctx.save();
    ctx.globalAlpha = 0.22;
    // 居中裁剪铺满
    const ratio = img.width / img.height;
    const targetRatio = W / (H * 0.35);
    let sw, sh, sx, sy;
    if (ratio > targetRatio) {
      sh = img.height;
      sw = sh * targetRatio;
      sx = (img.width - sw) / 2;
      sy = 0;
    } else {
      sw = img.width;
      sh = sw / targetRatio;
      sx = 0;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H * 0.35);
    // 渐变蒙板淡入宣纸 (H*0.18 → H*0.42, 完全不透明)
    const grad = ctx.createLinearGradient(0, H * 0.18, 0, H * 0.42);
    grad.addColorStop(0, "rgba(245, 240, 226, 0)");
    grad.addColorStop(1, "rgba(245, 240, 226, 1)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, H * 0.18, W, H * 0.24);
    ctx.restore();
  } catch (e) {
    console.warn("[share-card] cover bg failed, fallback to paper:", e);
    // 失败时画一层淡墨晕, 不影响整体
    ctx.save();
    ctx.globalAlpha = 0.08;
    const grad = ctx.createRadialGradient(W / 2, H * 0.2, 50, W / 2, H * 0.2, W * 0.6);
    grad.addColorStop(0, COLORS.ink);
    grad.addColorStop(1, "rgba(60, 44, 30, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H * 0.4);
    ctx.restore();
  }
}

function drawPaperBackground(ctx: CanvasRenderingContext2D) {
  // 基础米色
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, W, H);

  // 角落渐变（更暗）
  const cornerGrad = ctx.createRadialGradient(0, 0, 100, 0, 0, W);
  cornerGrad.addColorStop(0, "rgba(139, 115, 85, 0.15)");
  cornerGrad.addColorStop(1, "rgba(139, 115, 85, 0)");
  ctx.fillStyle = cornerGrad;
  ctx.fillRect(0, 0, W, H);

  const cornerGrad2 = ctx.createRadialGradient(W, H, 100, W, H, W);
  cornerGrad2.addColorStop(0, "rgba(139, 115, 85, 0.18)");
  cornerGrad2.addColorStop(1, "rgba(139, 115, 85, 0)");
  ctx.fillStyle = cornerGrad2;
  ctx.fillRect(0, 0, W, H);

  // 宣纸纤维噪点（稀疏）
  ctx.globalAlpha = 0.04;
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? COLORS.ink : COLORS.bronze;
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = Math.random() * 1.5;
    ctx.fillRect(x, y, r, r);
  }
  ctx.globalAlpha = 1;
}

function drawTopDecor(ctx: CanvasRenderingContext2D) {
  // 顶部双横线（朱砂 + 墨）
  ctx.fillStyle = COLORS.cinnabar;
  ctx.fillRect(W / 2 - 40, 70, 80, 2);
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(W / 2 - 120, 100, 240, 1);

  // 飞白墨点（左上 + 右上）
  drawInkDot(ctx, 100, 120, 35, 0.12);
  drawInkDot(ctx, W - 100, 120, 28, 0.10);
}

function drawCategoryBadge(ctx: CanvasRenderingContext2D, category: string) {
  ctx.font = `500 28px ${FONT_SERIF}`;
  ctx.fillStyle = COLORS.cinnabar;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const text = category.toUpperCase();
  const w = ctx.measureText(text).width + 50;
  const x = (W - w) / 2;
  const y = 200;

  // 边框
  ctx.strokeStyle = COLORS.cinnabar;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, 50);
  ctx.fillText(text, W / 2, y + 25);
}

function drawDynasty(ctx: CanvasRenderingContext2D, dynasty: string, y: number) {
  ctx.font = `400 26px ${FONT_SERIF}`;
  ctx.fillStyle = COLORS.bronze;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(`【${dynasty}】`, W / 2, y);
}

function drawTitle(ctx: CanvasRenderingContext2D, title: string, startY: number): number {
  // 标题字数决定字号: 2字 120 / 3字 100 / 4字 88 / 5-6字 76 / 7-8字 64 / >8字 52
  const len = title.replace(/[\s，。！？、；：《》【】]/g, "").length;
  let fontSize: number;
  if (len <= 2) fontSize = 120;
  else if (len <= 3) fontSize = 100;
  else if (len <= 4) fontSize = 88;
  else if (len <= 6) fontSize = 76;
  else if (len <= 8) fontSize = 64;
  else fontSize = 52;

  ctx.font = `700 ${fontSize}px ${FONT_SERIF}`;
  ctx.fillStyle = COLORS.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // 自动断行: 每行最多 8 个汉字 (受 fontSize 动态调整)
  const charsPerLine = fontSize >= 100 ? 6 : fontSize >= 76 ? 7 : 8;
  const lines = wrapText(ctx, title, W - 200, charsPerLine);

  let y = startY;
  const lineHeight = Math.round(fontSize * 1.3);
  const maxLines = 5;
  for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
    ctx.fillText(lines[i], W / 2, y);
    y += lineHeight;
  }

  // 第 6 行用省略号
  if (lines.length > maxLines) {
    ctx.fillText("…", W / 2, y);
    y += lineHeight;
  }

  return y;
}

function drawCinnabarDivider(ctx: CanvasRenderingContext2D, y: number) {
  ctx.fillStyle = COLORS.cinnabar;
  ctx.fillRect(W / 2 - 30, y, 60, 2);
  // 中央一个圆点
  ctx.beginPath();
  ctx.arc(W / 2, y + 1, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawExcerpt(ctx: CanvasRenderingContext2D, excerpt: string, startY: number): number {
  ctx.font = `400 30px ${FONT_SERIF}`;
  ctx.fillStyle = COLORS.inkLight;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // 摘要每行最多 18 个字
  const lines = wrapText(ctx, excerpt, W - 280, 18);
  const maxLines = 5;

  let y = startY;
  const lineHeight = 50;
  for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
    ctx.fillText(lines[i], W / 2, y);
    y += lineHeight;
  }
  if (lines.length > maxLines) {
    ctx.fillText("…", W / 2, y);
    y += lineHeight;
  }
  return y;
}

function drawAuthor(ctx: CanvasRenderingContext2D, author: string, y: number) {
  ctx.font = `400 24px ${FONT_SERIF}`;
  ctx.fillStyle = COLORS.bronze;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText(`— ${author}`, W - 200, y);
}

function drawTags(ctx: CanvasRenderingContext2D, tags: string[], y: number) {
  ctx.font = `400 22px ${FONT_SERIF}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const items = tags.slice(0, 3);
  // 计算总宽, 居中
  const padX = 24, padY = 10, gap = 12;
  let totalW = 0;
  const widths: number[] = [];
  for (const t of items) {
    const w = ctx.measureText(`#${t}`).width + padX * 2;
    widths.push(w);
    totalW += w;
  }
  totalW += gap * (items.length - 1);
  let x = (W - totalW) / 2;
  for (let i = 0; i < items.length; i++) {
    const w = widths[i];
    const h = 44;
    // 圆角矩形背景
    ctx.fillStyle = "rgba(181, 58, 42, 0.08)";
    roundRect(ctx, x, y, w, h, 22);
    ctx.fill();
    // 描边
    ctx.strokeStyle = "rgba(181, 58, 42, 0.35)";
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, w, h, 22);
    ctx.stroke();
    // 文字
    ctx.fillStyle = COLORS.cinnabar;
    ctx.fillText(`#${items[i]}`, x + w / 2, y + h / 2);
    x += w + gap;
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawFooter(ctx: CanvasRenderingContext2D, articleUrl: string) {
  const footerY = H - 240;

  // 朱砂细线
  ctx.fillStyle = COLORS.cinnabar;
  ctx.fillRect(W / 2 - 200, footerY, 400, 1);

  // 左侧：「溯光」印章 + 文字
  const leftX = 120;
  const leftY = footerY + 50;

  // 大方印
  drawSeal(ctx, leftX, leftY, 100, "溯光", COLORS.cinnabar, 2);

  ctx.font = `700 36px ${FONT_SERIF}`;
  ctx.fillStyle = COLORS.ink;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("溯光", leftX + 120, leftY + 5);

  ctx.font = `400 18px ${FONT_SERIF}`;
  ctx.fillStyle = COLORS.bronze;
  ctx.fillText("Aetherlight", leftX + 120, leftY + 48);
  ctx.fillText("文明长河中的一缕光", leftX + 120, leftY + 76);

  // 右侧：URL + 二维码
  const rightX = W - 280;
  const qrSize = 140;

  // 二维码占位（用 QR API 异步加载，这里先画占位框）
  // 实际二维码在 drawQRCode 中绘制
  ctx.fillStyle = COLORS.white;
  ctx.fillRect(rightX, leftY, qrSize, qrSize);
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(rightX, leftY, qrSize, qrSize);

  // 异步加载二维码
  const qrImg = new Image();
  qrImg.crossOrigin = "anonymous";
  qrImg.onload = () => {
    ctx.drawImage(qrImg, rightX, leftY, qrSize, qrSize);
  };
  qrImg.onerror = () => {
    // 加载失败，画一个"溯"字
    ctx.fillStyle = COLORS.ink;
    ctx.font = `700 50px ${FONT_SERIF}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("溯", rightX + qrSize / 2, leftY + qrSize / 2);
  };
  const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(articleUrl)}&color=3C2C1E&bgcolor=F5F0E2&margin=0`;
  qrImg.src = qrApi;

  // URL 文字
  ctx.font = `400 18px ${FONT_SERIF}`;
  ctx.fillStyle = COLORS.bronze;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  const displayUrl = articleUrl.replace(/^https?:\/\//, "").slice(0, 32);
  ctx.fillText(displayUrl, rightX + qrSize, leftY + 30);
  ctx.fillText("扫码查看详情", rightX + qrSize, leftY + 58);

  // 底部水印
  ctx.font = `400 16px ${FONT_SERIF}`;
  ctx.fillStyle = COLORS.bronze;
  ctx.textAlign = "center";
  ctx.globalAlpha = 0.5;
  ctx.fillText("Generated by 溯光 Aetherlight", W / 2, H - 60);
  ctx.globalAlpha = 1;
}

function drawInkSplash(ctx: CanvasRenderingContext2D) {
  // 右下角水墨飞溅
  drawInkDot(ctx, W - 80, H - 80, 50, 0.15);
  drawInkDot(ctx, W - 180, H - 60, 25, 0.10);
  // 左下角
  drawInkDot(ctx, 60, H - 100, 35, 0.12);
  drawInkDot(ctx, 140, H - 80, 18, 0.08);
}

/**
 * 画一个不规则墨点（飞白效果）
 */
function drawInkDot(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  // 不规则椭圆形
  const points = 12;
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const variance = 0.7 + Math.random() * 0.5;
    const x = cx + Math.cos(angle) * r * variance;
    const y = cy + Math.sin(angle) * r * variance * 0.7;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * 印章
 */
function drawSeal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  text: string,
  color: string,
  borderWidth: number = 3
) {
  // 印泥背景
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);

  // 文字（白色）
  ctx.fillStyle = COLORS.paper;
  ctx.font = `900 ${size * 0.5}px ${FONT_SERIF}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 1-2 字居中；>2 字分两行
  if (text.length <= 2) {
    ctx.fillText(text, x + size / 2, y + size / 2);
  } else {
    // 两字一行
    const half = Math.ceil(text.length / 2);
    const top = text.slice(0, half);
    const bot = text.slice(half);
    ctx.fillText(top, x + size / 2, y + size * 0.32);
    ctx.fillText(bot, x + size / 2, y + size * 0.72);
  }

  // 印章边缘破损（细节）
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = COLORS.paper;
  for (let i = 0; i < 8; i++) {
    const px = x + Math.random() * size;
    const py = y + Math.random() * size;
    const pr = Math.random() * 3;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/**
 * 按 maxCharsPerLine 自动断行（按字符数，不按像素）
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxCharsPerLine: number
): string[] {
  // 1. 先按字符拆段（中文按字，英文按词）
  const segments: string[] = [];
  let buffer = "";
  for (const ch of text) {
    if (/[\s，。！？、；：""''《》【】()（）]/.test(ch)) {
      if (buffer) {
        segments.push(buffer);
        buffer = "";
      }
      segments.push(ch);
    } else {
      buffer += ch;
    }
  }
  if (buffer) segments.push(buffer);

  // 2. 按 maxCharsPerLine 拼行
  const lines: string[] = [];
  let current = "";
  for (const seg of segments) {
    const test = current + seg;
    if (test.length > maxCharsPerLine && current) {
      lines.push(current);
      current = seg;
    } else {
      current = test;
    }
    // 段是标点 → 立刻换行
    if (/[。！？]/.test(seg) && current.length >= maxCharsPerLine * 0.6) {
      lines.push(current);
      current = "";
    }
  }
  if (current) lines.push(current);

  // 3. 二次校验：单行超过 maxWidth 也强制断行
  const result: string[] = [];
  for (const line of lines) {
    if (ctx.measureText(line).width <= maxWidth) {
      result.push(line);
    } else {
      // 按字符硬切
      let buf = "";
      for (const ch of line) {
        if (ctx.measureText(buf + ch).width > maxWidth && buf) {
          result.push(buf);
          buf = ch;
        } else {
          buf += ch;
        }
      }
      if (buf) result.push(buf);
    }
  }
  return result;
}

/**
 * 下载 dataURL 为文件
 */
export function downloadDataURL(dataURL: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 复制 dataURL 图片到剪贴板（PNG only）
 */
export async function copyImageToClipboard(dataURL: string): Promise<boolean> {
  if (typeof ClipboardItem === "undefined") return false;
  try {
    const blob = await (await fetch(dataURL)).blob();
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob }),
    ]);
    return true;
  } catch {
    return false;
  }
}

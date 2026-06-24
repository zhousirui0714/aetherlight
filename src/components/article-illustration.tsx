// 中国风卡片插画组件 - 纯 CSS + SVG，100% 可靠
// 根据文章分类和标题动态生成精美的中国风插画

import React from "react";
import { type Category } from "@/lib/knowledge-data";

interface ArticleIllustrationProps {
  category: Category | string;
  title: string;
  emoji: string;
}

// 从标题中提取关键词，用于个性化装饰
function extractKeywords(title: string): string[] {
  const keywords: string[] = [];
  
  // 提取书名号内容
  const bookMatch = title.match(/《(.+?)》/);
  if (bookMatch) keywords.push(bookMatch[1]);
  
  // 提取冒号后的副标题
  const colonMatch = title.match(/[:：](.+)/);
  if (colonMatch) keywords.push(colonMatch[1]);
  
  // 提取特定主题词
  const themeWords = ["春", "夏", "秋", "冬", "月", "花", "雪", "风", "雨", "云", "山", "水", "茶", "酒"];
  themeWords.forEach(word => {
    if (title.includes(word)) keywords.push(word);
  });
  
  return keywords;
}

// 分类主题配置
const CATEGORY_THEMES: Record<string, {
  bgGradient: string;
  pattern: string;
  accentColor: string;
  decorativeElements: (title: string) => React.ReactNode;
}> = {
  "节气": {
    bgGradient: "linear-gradient(135deg, #a8e6cf 0%, #dcedc1 50%, #ffd3b6 100%)",
    pattern: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.3) 0%, transparent 40%)",
    accentColor: "#4a7c59",
    decorativeElements: (title: string) => {
      const keywords = extractKeywords(title);
      const isSpring = keywords.some(k => ["春", "花"].includes(k));
      const isSummer = keywords.some(k => ["夏", "荷"].includes(k));
      const isAutumn = keywords.some(k => ["秋", "月"].includes(k));
      const isWinter = keywords.some(k => ["冬", "雪"].includes(k));
      
      return (
        <>
          {/* 根据季节显示不同装饰 */}
          {isSpring && (
            <>
              <svg className="absolute top-4 right-4 w-16 h-16 opacity-50" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="8" fill="#ff9a9e" />
                <circle cx="50" cy="30" r="10" fill="#ff9a9e" opacity="0.7" />
                <circle cx="70" cy="50" r="10" fill="#ff9a9e" opacity="0.7" />
                <circle cx="50" cy="70" r="10" fill="#ff9a9e" opacity="0.7" />
                <circle cx="30" cy="50" r="10" fill="#ff9a9e" opacity="0.7" />
              </svg>
              <svg className="absolute bottom-6 left-6 w-10 h-10 opacity-40 rotate-45" viewBox="0 0 50 50">
                <path d="M25 5 Q35 20 25 45 Q15 20 25 5" fill="#4a7c59" />
              </svg>
            </>
          )}
          {isSummer && (
            <>
              <svg className="absolute top-4 right-4 w-20 h-20 opacity-40" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="30" fill="#ff6b9d" opacity="0.6" />
                <circle cx="50" cy="50" r="20" fill="#ff9a9e" opacity="0.8" />
                <circle cx="50" cy="50" r="10" fill="#ffc3a0" />
              </svg>
              <svg className="absolute bottom-4 left-4 w-12 h-16 opacity-50" viewBox="0 0 60 100">
                <path d="M30 10 Q20 30 30 50 Q40 30 30 10" fill="#27ae60" />
                <path d="M25 40 Q15 55 25 70 Q35 55 25 40" fill="#27ae60" />
              </svg>
            </>
          )}
          {isAutumn && (
            <>
              <svg className="absolute top-4 right-4 w-16 h-16 opacity-50" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="35" fill="#f1c40f" opacity="0.6" />
                <circle cx="58" cy="45" r="30" fill="rgba(255,255,255,0.3)" />
              </svg>
              <svg className="absolute bottom-6 left-6 w-12 h-12 opacity-40" viewBox="0 0 50 50">
                <path d="M25 5 Q35 20 25 45 Q15 20 25 5" fill="#e67e22" />
              </svg>
            </>
          )}
          {isWinter && (
            <>
              <svg className="absolute top-4 right-4 w-20 h-20 opacity-40" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="8" fill="#fff" />
                <circle cx="30" cy="30" r="6" fill="#fff" opacity="0.8" />
                <circle cx="70" cy="30" r="6" fill="#fff" opacity="0.8" />
                <circle cx="30" cy="70" r="6" fill="#fff" opacity="0.8" />
                <circle cx="70" cy="70" r="6" fill="#fff" opacity="0.8" />
              </svg>
              <svg className="absolute bottom-0 left-0 w-full h-24 opacity-30" viewBox="0 0 200 80">
                <path d="M0 60 Q50 30 100 50 T200 40 L200 80 L0 80 Z" fill="#fff" />
              </svg>
            </>
          )}
          {/* 默认装饰 */}
          {!isSpring && !isSummer && !isAutumn && !isWinter && (
            <>
              <svg className="absolute top-4 right-4 w-16 h-16 opacity-40" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="8" fill="#ff9a9e" />
                <circle cx="50" cy="30" r="10" fill="#ff9a9e" opacity="0.6" />
              </svg>
              <svg className="absolute bottom-6 left-6 w-10 h-10 opacity-30 rotate-45" viewBox="0 0 50 50">
                <path d="M25 5 Q35 20 25 45 Q15 20 25 5" fill="#4a7c59" />
              </svg>
            </>
          )}
        </>
      );
    },
  },
  "节日": {
    bgGradient: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fec428 100%)",
    pattern: "radial-gradient(circle at 70% 20%, rgba(255,255,255,0.4) 0%, transparent 50%)",
    accentColor: "#c0392b",
    decorativeElements: (title: string) => {
      const keywords = extractKeywords(title);
      const hasDragon = keywords.some(k => ["龙", "端午"].includes(k));
      const hasMoon = keywords.some(k => ["月", "中秋"].includes(k));
      const hasSpring = keywords.some(k => ["春", "年", "岁"].includes(k));
      
      return (
        <>
          {hasDragon && (
            <svg className="absolute top-3 right-3 w-16 h-16 opacity-50" viewBox="0 0 100 100">
              <path d="M20 50 Q30 30 50 40 T80 50 Q70 60 50 55 T20 50" fill="none" stroke="#e74c3c" strokeWidth="3" />
              <circle cx="25" cy="48" r="3" fill="#e74c3c" />
            </svg>
          )}
          {hasMoon && (
            <svg className="absolute top-4 right-4 w-16 h-16 opacity-50" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="30" fill="#f1c40f" opacity="0.7" />
              <circle cx="58" cy="45" r="28" fill="rgba(255,255,255,0.3)" />
            </svg>
          )}
          {hasSpring && (
            <>
              <svg className="absolute top-3 right-3 w-14 h-14 opacity-50" viewBox="0 0 100 100">
                <rect x="40" y="20" width="20" height="50" rx="10" fill="#e74c3c" />
                <rect x="35" y="15" width="30" height="8" rx="4" fill="#c0392b" />
                <rect x="35" y="67" width="30" height="8" rx="4" fill="#c0392b" />
                <line x1="50" y1="75" x2="50" y2="90" stroke="#c0392b" strokeWidth="2" />
                <circle cx="50" cy="92" r="3" fill="#f39c12" />
              </svg>
              <svg className="absolute bottom-4 left-4 w-16 h-10 opacity-30" viewBox="0 0 120 60">
                <path d="M20 40 Q10 40 10 30 Q10 20 20 20 Q20 10 35 10 Q50 10 50 20 Q60 15 70 25 Q80 20 90 30 Q100 30 100 40 Z" fill="#fff" />
              </svg>
            </>
          )}
          {/* 默认灯笼装饰 */}
          {!hasDragon && !hasMoon && !hasSpring && (
            <>
              <svg className="absolute top-3 right-3 w-14 h-14 opacity-50" viewBox="0 0 100 100">
                <rect x="40" y="20" width="20" height="50" rx="10" fill="#e74c3c" />
                <rect x="35" y="15" width="30" height="8" rx="4" fill="#c0392b" />
                <rect x="35" y="67" width="30" height="8" rx="4" fill="#c0392b" />
                <line x1="50" y1="75" x2="50" y2="90" stroke="#c0392b" strokeWidth="2" />
                <circle cx="50" cy="92" r="3" fill="#f39c12" />
              </svg>
              <svg className="absolute bottom-4 left-4 w-16 h-10 opacity-30" viewBox="0 0 120 60">
                <path d="M20 40 Q10 40 10 30 Q10 20 20 20 Q20 10 35 10 Q50 10 50 20 Q60 15 70 25 Q80 20 90 30 Q100 30 100 40 Z" fill="#fff" />
              </svg>
            </>
          )}
        </>
      );
    },
  },
  "诗词": {
    bgGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
    pattern: "radial-gradient(circle at 30% 70%, rgba(255,255,255,0.2) 0%, transparent 40%)",
    accentColor: "#2c3e50",
    decorativeElements: (title: string) => {
      const keywords = extractKeywords(title);
      const hasMoon = keywords.some(k => ["月", "夜"].includes(k));
      const hasWine = keywords.some(k => ["酒", "醉"].includes(k));
      const hasMountain = keywords.some(k => ["山", "岳"].includes(k));
      
      return (
        <>
          {hasMoon && (
            <svg className="absolute top-4 right-4 w-16 h-16 opacity-50" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="30" fill="#f1c40f" />
              <circle cx="60" cy="45" r="28" fill="rgba(255,255,255,0.3)" />
            </svg>
          )}
          {hasWine && (
            <svg className="absolute bottom-4 left-4 w-14 h-14 opacity-40" viewBox="0 0 100 100">
              <path d="M30 20 L30 60 Q30 80 50 80 Q70 80 70 60 L70 20 Z" fill="#8b4513" opacity="0.6" />
              <ellipse cx="50" cy="20" rx="20" ry="8" fill="#654321" opacity="0.6" />
            </svg>
          )}
          {hasMountain && (
            <svg className="absolute bottom-0 left-0 w-full h-20 opacity-30" viewBox="0 0 200 80">
              <path d="M0 60 Q50 30 100 50 T200 40 L200 80 L0 80 Z" fill="#2c3e50" opacity="0.4" />
              <path d="M0 70 Q40 50 80 65 T160 55 L200 80 L0 80 Z" fill="#2c3e50" opacity="0.6" />
            </svg>
          )}
          {/* 默认竹叶装饰 */}
          {!hasMoon && !hasWine && !hasMountain && (
            <>
              <svg className="absolute top-4 right-4 w-16 h-16 opacity-40" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="30" fill="#f1c40f" />
                <circle cx="60" cy="45" r="28" fill="rgba(255,255,255,0.3)" />
              </svg>
              <svg className="absolute bottom-4 left-4 w-12 h-16 opacity-30" viewBox="0 0 60 100">
                <path d="M30 10 Q20 30 30 50 Q40 30 30 10" fill="#27ae60" />
                <path d="M25 40 Q15 55 25 70 Q35 55 25 40" fill="#27ae60" />
                <path d="M35 50 Q25 65 35 80 Q45 65 35 50" fill="#27ae60" />
              </svg>
            </>
          )}
        </>
      );
    },
  },
  "典籍": {
    bgGradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ff9a9e 100%)",
    pattern: "radial-gradient(circle at 60% 40%, rgba(255,255,255,0.3) 0%, transparent 45%)",
    accentColor: "#8b4513",
    decorativeElements: (title: string) => {
      const keywords = extractKeywords(title);
      const hasConfucius = keywords.some(k => ["论语", "孔子", "儒"].includes(k));
      const hasTao = keywords.some(k => ["道德经", "老子", "道"].includes(k));
      const hasPoetry = keywords.some(k => ["诗", "诗经"].includes(k));
      
      return (
        <>
          {hasConfucius && (
            <>
              <svg className="absolute top-3 right-3 w-16 h-20 opacity-40" viewBox="0 0 100 120">
                {[0, 12, 24, 36, 48, 60].map((x, i) => (
                  <rect key={i} x={x} y="10" width="8" height="100" rx="2" fill="#8b4513" opacity="0.6" />
                ))}
                <rect x="0" y="30" width="72" height="3" fill="#654321" />
                <rect x="0" y="90" width="72" height="3" fill="#654321" />
              </svg>
              <svg className="absolute bottom-4 left-4 w-10 h-10 opacity-50" viewBox="0 0 60 60">
                <rect x="5" y="5" width="50" height="50" rx="4" fill="#c0392b" />
                <text x="30" y="38" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="bold">儒</text>
              </svg>
            </>
          )}
          {hasTao && (
            <>
              <svg className="absolute top-4 right-4 w-16 h-16 opacity-40" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#8b4513" strokeWidth="2" />
                <path d="M50 10 A40 40 0 0 1 50 90 A20 20 0 0 0 50 50 A20 20 0 0 1 50 10" fill="#8b4513" opacity="0.3" />
                <circle cx="50" cy="30" r="5" fill="#fff" />
                <circle cx="50" cy="70" r="5" fill="#8b4513" />
              </svg>
              <svg className="absolute bottom-4 left-4 w-10 h-10 opacity-50" viewBox="0 0 60 60">
                <rect x="5" y="5" width="50" height="50" rx="4" fill="#c0392b" />
                <text x="30" y="38" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="bold">道</text>
              </svg>
            </>
          )}
          {hasPoetry && (
            <>
              <svg className="absolute top-3 right-3 w-16 h-20 opacity-40" viewBox="0 0 100 120">
                {[0, 12, 24, 36, 48, 60].map((x, i) => (
                  <rect key={i} x={x} y="10" width="8" height="100" rx="2" fill="#8b4513" opacity="0.6" />
                ))}
                <rect x="0" y="30" width="72" height="3" fill="#654321" />
                <rect x="0" y="90" width="72" height="3" fill="#654321" />
              </svg>
              <svg className="absolute bottom-4 left-4 w-10 h-10 opacity-50" viewBox="0 0 60 60">
                <rect x="5" y="5" width="50" height="50" rx="4" fill="#c0392b" />
                <text x="30" y="38" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="bold">诗</text>
              </svg>
            </>
          )}
          {/* 默认竹简装饰 */}
          {!hasConfucius && !hasTao && !hasPoetry && (
            <>
              <svg className="absolute top-3 right-3 w-16 h-20 opacity-40" viewBox="0 0 100 120">
                {[0, 12, 24, 36, 48, 60].map((x, i) => (
                  <rect key={i} x={x} y="10" width="8" height="100" rx="2" fill="#8b4513" opacity="0.6" />
                ))}
                <rect x="0" y="30" width="72" height="3" fill="#654321" />
                <rect x="0" y="90" width="72" height="3" fill="#654321" />
              </svg>
              <svg className="absolute bottom-4 left-4 w-10 h-10 opacity-50" viewBox="0 0 60 60">
                <rect x="5" y="5" width="50" height="50" rx="4" fill="#c0392b" />
                <text x="30" y="38" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="bold">文</text>
              </svg>
            </>
          )}
        </>
      );
    },
  },
  "非遗": {
    bgGradient: "linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 50%, #fcb69f 100%)",
    pattern: "radial-gradient(circle at 40% 60%, rgba(255,255,255,0.25) 0%, transparent 40%)",
    accentColor: "#e74c3c",
    decorativeElements: (title: string) => {
      const keywords = extractKeywords(title);
      const hasOpera = keywords.some(k => ["曲", "戏", "昆"].includes(k));
      const hasCeramic = keywords.some(k => ["瓷", "陶", "窑"].includes(k));
      const hasPaperCut = keywords.some(k => ["剪纸", "纸"].includes(k));
      
      return (
        <>
          {hasOpera && (
            <svg className="absolute top-4 right-4 w-16 h-16 opacity-40" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="35" fill="none" stroke="#e74c3c" strokeWidth="2" />
              <path d="M30 40 Q50 30 70 40 M30 60 Q50 70 70 60" stroke="#e74c3c" strokeWidth="2" fill="none" />
              <circle cx="40" cy="45" r="3" fill="#e74c3c" />
              <circle cx="60" cy="45" r="3" fill="#e74c3c" />
            </svg>
          )}
          {hasCeramic && (
            <svg className="absolute top-4 right-4 w-16 h-20 opacity-40" viewBox="0 0 100 120">
              <ellipse cx="50" cy="30" rx="30" ry="15" fill="#3498db" opacity="0.6" />
              <path d="M20 30 L20 90 Q20 110 50 110 Q80 110 80 90 L80 30" fill="#3498db" opacity="0.6" />
              <circle cx="50" cy="60" r="15" fill="none" stroke="#fff" strokeWidth="2" opacity="0.5" />
            </svg>
          )}
          {hasPaperCut && (
            <svg className="absolute top-4 right-4 w-16 h-16 opacity-40" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e74c3c" strokeWidth="2" />
              <path d="M50 10 L50 90 M10 50 L90 50" stroke="#e74c3c" strokeWidth="2" />
              <circle cx="50" cy="50" r="15" fill="#e74c3c" opacity="0.3" />
            </svg>
          )}
          {/* 默认剪纸装饰 */}
          {!hasOpera && !hasCeramic && !hasPaperCut && (
            <>
              <svg className="absolute top-4 right-4 w-14 h-14 opacity-40" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e74c3c" strokeWidth="2" />
                <path d="M50 10 L50 90 M10 50 L90 50" stroke="#e74c3c" strokeWidth="2" />
                <circle cx="50" cy="50" r="15" fill="#e74c3c" opacity="0.3" />
              </svg>
              <svg className="absolute bottom-3 left-0 w-full h-8 opacity-30" viewBox="0 0 200 30">
                <path d="M0 15 Q25 5 50 15 T100 15 T150 15 T200 15" fill="none" stroke="#e74c3c" strokeWidth="2" />
              </svg>
            </>
          )}
        </>
      );
    },
  },
  "民俗": {
    bgGradient: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 50%, #fbc2eb 100%)",
    pattern: "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.3) 0%, transparent 45%)",
    accentColor: "#34495e",
    decorativeElements: (title: string) => {
      const keywords = extractKeywords(title);
      const hasTea = keywords.some(k => ["茶", "茗"].includes(k));
      const hasRitual = keywords.some(k => ["礼", "仪"].includes(k));
      const hasCalligraphy = keywords.some(k => ["对联", "联", "书"].includes(k));
      
      return (
        <>
          {hasTea && (
            <svg className="absolute top-4 right-4 w-14 h-14 opacity-40" viewBox="0 0 100 100">
              <ellipse cx="50" cy="60" rx="25" ry="20" fill="#8b4513" />
              <rect x="40" y="40" width="20" height="20" rx="10" fill="#8b4513" />
              <path d="M75 55 Q85 50 85 60 Q85 70 75 65" fill="none" stroke="#8b4513" strokeWidth="3" />
              <rect x="45" y="35" width="10" height="8" rx="5" fill="#654321" />
            </svg>
          )}
          {hasRitual && (
            <svg className="absolute top-4 right-4 w-16 h-16 opacity-40" viewBox="0 0 100 100">
              <rect x="20" y="30" width="60" height="50" rx="4" fill="#8b4513" opacity="0.6" />
              <rect x="30" y="20" width="40" height="10" rx="2" fill="#654321" opacity="0.6" />
              <circle cx="50" cy="55" r="10" fill="#c0392b" opacity="0.5" />
            </svg>
          )}
          {hasCalligraphy && (
            <svg className="absolute top-4 right-4 w-12 h-20 opacity-40" viewBox="0 0 60 120">
              <rect x="10" y="10" width="40" height="100" rx="2" fill="#c0392b" opacity="0.6" />
              <text x="30" y="50" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold">福</text>
              <text x="30" y="80" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold">禄</text>
            </svg>
          )}
          {/* 默认茶壶装饰 */}
          {!hasTea && !hasRitual && !hasCalligraphy && (
            <>
              <svg className="absolute top-4 right-4 w-14 h-14 opacity-40" viewBox="0 0 100 100">
                <ellipse cx="50" cy="60" rx="25" ry="20" fill="#8b4513" />
                <rect x="40" y="40" width="20" height="20" rx="10" fill="#8b4513" />
                <path d="M75 55 Q85 50 85 60 Q85 70 75 65" fill="none" stroke="#8b4513" strokeWidth="3" />
                <rect x="45" y="35" width="10" height="8" rx="5" fill="#654321" />
              </svg>
              <svg className="absolute bottom-4 left-4 w-12 h-8 opacity-30" viewBox="0 0 80 40">
                <path d="M10 25 Q5 25 5 20 Q5 15 10 15 Q10 10 20 10 Q30 10 30 15 Q35 12 40 18 Q45 15 50 20 Q55 20 55 25 Z" fill="#fff" />
              </svg>
            </>
          )}
        </>
      );
    },
  },
  "人物": {
    bgGradient: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 50%, #f093fb 100%)",
    pattern: "radial-gradient(circle at 35% 65%, rgba(255,255,255,0.25) 0%, transparent 40%)",
    accentColor: "#2c3e50",
    decorativeElements: (title: string) => {
      const keywords = extractKeywords(title);
      const hasPoet = keywords.some(k => ["诗", "李白", "杜甫"].includes(k));
      const hasPhilosopher = keywords.some(k => ["孔子", "老子", "庄子"].includes(k));
      const hasCalligrapher = keywords.some(k => ["书", "王羲之"].includes(k));
      
      return (
        <>
          {/* 山水背景 */}
          <svg className="absolute bottom-0 left-0 w-full h-24 opacity-30" viewBox="0 0 200 80">
            <path d="M0 60 Q50 30 100 50 T200 40 L200 80 L0 80 Z" fill="#2c3e50" opacity="0.4" />
            <path d="M0 70 Q40 50 80 65 T160 55 L200 80 L0 80 Z" fill="#2c3e50" opacity="0.6" />
          </svg>
          
          {hasPoet && (
            <svg className="absolute top-4 right-4 w-14 h-14 opacity-50" viewBox="0 0 100 100">
              <path d="M30 20 L30 60 Q30 80 50 80 Q70 80 70 60 L70 20 Z" fill="#8b4513" opacity="0.6" />
              <ellipse cx="50" cy="20" rx="20" ry="8" fill="#654321" opacity="0.6" />
              <circle cx="50" cy="50" r="15" fill="#f1c40f" opacity="0.3" />
            </svg>
          )}
          {hasPhilosopher && (
            <svg className="absolute top-3 right-3 w-12 h-12 opacity-50" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="25" fill="#c0392b" />
              <text x="30" y="38" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold">圣</text>
            </svg>
          )}
          {hasCalligrapher && (
            <svg className="absolute top-4 right-4 w-12 h-16 opacity-40" viewBox="0 0 60 100">
              <rect x="25" y="10" width="10" height="80" rx="5" fill="#2c3e50" opacity="0.6" />
              <circle cx="30" cy="15" r="8" fill="#2c3e50" opacity="0.6" />
            </svg>
          )}
          {/* 默认印章装饰 */}
          {!hasPoet && !hasPhilosopher && !hasCalligrapher && (
            <svg className="absolute top-3 right-3 w-10 h-10 opacity-50" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="25" fill="#c0392b" />
              <text x="30" y="38" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold">印</text>
            </svg>
          )}
        </>
      );
    },
  },
  "戏曲": {
    bgGradient: "linear-gradient(135deg, #f6d365 0%, #fda085 50%, #f093fb 100%)",
    pattern: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.25) 0%, transparent 45%)",
    accentColor: "#8b4513",
    decorativeElements: (title: string) => {
      const keywords = extractKeywords(title);
      const hasPeking = keywords.some(k => ["京剧", "国粹"].includes(k));
      const hasShadow = keywords.some(k => ["皮影", "影"].includes(k));
      const hasKunqu = keywords.some(k => ["昆曲", "昆"].includes(k));
      
      return (
        <>
          {hasPeking && (
            <>
              <svg className="absolute top-4 right-4 w-16 h-16 opacity-40" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="35" fill="#c0392b" opacity="0.3" />
                <circle cx="50" cy="50" r="30" fill="none" stroke="#8b4513" strokeWidth="2" />
                <path d="M35 40 L40 35 M65 40 L60 35" stroke="#8b4513" strokeWidth="2" />
                <circle cx="42" cy="48" r="3" fill="#8b4513" />
                <circle cx="58" cy="48" r="3" fill="#8b4513" />
              </svg>
              <svg className="absolute bottom-4 left-4 w-14 h-14 opacity-30" viewBox="0 0 100 100">
                <path d="M20 50 Q50 20 80 50 Q50 80 20 50" fill="none" stroke="#c0392b" strokeWidth="2" />
              </svg>
            </>
          )}
          {hasShadow && (
            <>
              <svg className="absolute top-4 right-4 w-20 h-16 opacity-40" viewBox="0 0 120 80">
                <rect x="10" y="10" width="100" height="60" rx="4" fill="none" stroke="#8b4513" strokeWidth="2" />
                <path d="M30 30 Q50 20 70 30 L70 50 Q50 60 30 50 Z" fill="#8b4513" opacity="0.3" />
                <circle cx="40" cy="35" r="2" fill="#8b4513" />
                <circle cx="60" cy="35" r="2" fill="#8b4513" />
              </svg>
              <svg className="absolute bottom-3 left-0 w-full h-8 opacity-25" viewBox="0 0 200 30">
                <path d="M0 15 Q25 5 50 15 T100 15 T150 15 T200 15" fill="none" stroke="#8b4513" strokeWidth="2" />
              </svg>
            </>
          )}
          {hasKunqu && (
            <>
              <svg className="absolute top-4 right-4 w-16 h-20 opacity-40" viewBox="0 0 100 120">
                <ellipse cx="50" cy="40" rx="20" ry="25" fill="#f6d365" opacity="0.5" />
                <path d="M30 65 Q50 55 70 65 L70 100 Q50 110 30 100 Z" fill="#fda085" opacity="0.4" />
              </svg>
              <svg className="absolute bottom-4 left-4 w-12 h-8 opacity-30" viewBox="0 0 80 40">
                <path d="M10 25 Q5 25 5 20 Q5 15 10 15 Q10 10 20 10 Q30 10 30 15 Q35 12 40 18 Q45 15 50 20 Q55 20 55 25 Z" fill="#fff" />
              </svg>
            </>
          )}
          {!hasPeking && !hasShadow && !hasKunqu && (
            <>
              <svg className="absolute top-4 right-4 w-16 h-16 opacity-40" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="35" fill="#c0392b" opacity="0.3" />
                <circle cx="50" cy="50" r="30" fill="none" stroke="#8b4513" strokeWidth="2" />
              </svg>
              <svg className="absolute bottom-4 left-4 w-14 h-14 opacity-30" viewBox="0 0 100 100">
                <path d="M20 50 Q50 20 80 50 Q50 80 20 50" fill="none" stroke="#c0392b" strokeWidth="2" />
              </svg>
            </>
          )}
        </>
      );
    },
  },
  "工艺": {
    bgGradient: "linear-gradient(135deg, #d4fc79 0%, #96e6a1 50%, #84fab0 100%)",
    pattern: "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3) 0%, transparent 40%)",
    accentColor: "#2d6a4f",
    decorativeElements: (title: string) => {
      const keywords = extractKeywords(title);
      const hasEmbroidery = keywords.some(k => ["刺绣", "绣"].includes(k));
      const hasDye = keywords.some(k => ["扎染", "染"].includes(k));
      const hasKite = keywords.some(k => ["风筝", "鸢"].includes(k));
      const hasIron = keywords.some(k => ["铁画", "铁"].includes(k));
      
      return (
        <>
          {hasEmbroidery && (
            <>
              <svg className="absolute top-4 right-4 w-16 h-16 opacity-40" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="8" fill="#e74c3c" />
                <circle cx="50" cy="30" r="8" fill="#e74c3c" opacity="0.6" />
                <circle cx="70" cy="50" r="8" fill="#e74c3c" opacity="0.6" />
                <circle cx="50" cy="70" r="8" fill="#e74c3c" opacity="0.6" />
                <circle cx="30" cy="50" r="8" fill="#e74c3c" opacity="0.6" />
                <line x1="50" y1="20" x2="50" y2="80" stroke="#2d6a4f" strokeWidth="1" opacity="0.4" />
                <line x1="20" y1="50" x2="80" y2="50" stroke="#2d6a4f" strokeWidth="1" opacity="0.4" />
              </svg>
              <svg className="absolute bottom-4 left-4 w-12 h-12 opacity-30" viewBox="0 0 60 60">
                <path d="M30 10 L35 25 L50 25 L38 35 L43 50 L30 40 L17 50 L22 35 L10 25 L25 25 Z" fill="#2d6a4f" />
              </svg>
            </>
          )}
          {hasDye && (
            <>
              <svg className="absolute top-4 right-4 w-20 h-20 opacity-40" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="30" fill="#3498db" opacity="0.3" />
                <circle cx="50" cy="50" r="20" fill="#fff" opacity="0.4" />
                <circle cx="50" cy="50" r="10" fill="#3498db" opacity="0.3" />
              </svg>
              <svg className="absolute bottom-4 left-4 w-16 h-16 opacity-30" viewBox="0 0 100 100">
                <path d="M20 50 Q35 30 50 50 T80 50" fill="none" stroke="#3498db" strokeWidth="2" />
                <path d="M20 60 Q35 40 50 60 T80 60" fill="none" stroke="#3498db" strokeWidth="2" />
              </svg>
            </>
          )}
          {hasKite && (
            <>
              <svg className="absolute top-4 right-4 w-16 h-20 opacity-40" viewBox="0 0 80 120">
                <path d="M40 10 L60 40 L40 70 L20 40 Z" fill="#e74c3c" opacity="0.5" />
                <line x1="40" y1="70" x2="35" y2="110" stroke="#2d6a4f" strokeWidth="1" />
                <line x1="40" y1="70" x2="45" y2="110" stroke="#2d6a4f" strokeWidth="1" />
              </svg>
              <svg className="absolute bottom-4 left-4 w-12 h-8 opacity-30" viewBox="0 0 80 40">
                <path d="M10 25 Q5 25 5 20 Q5 15 10 15 Q10 10 20 10 Q30 10 30 15 Q35 12 40 18 Q45 15 50 20 Q55 20 55 25 Z" fill="#fff" />
              </svg>
            </>
          )}
          {hasIron && (
            <>
              <svg className="absolute top-4 right-4 w-16 h-16 opacity-40" viewBox="0 0 100 100">
                <path d="M20 80 L35 20 L50 50 L65 20 L80 80" fill="none" stroke="#2c3e50" strokeWidth="3" />
                <circle cx="35" cy="20" r="3" fill="#2c3e50" />
                <circle cx="65" cy="20" r="3" fill="#2c3e50" />
              </svg>
              <svg className="absolute bottom-4 left-4 w-12 h-12 opacity-30" viewBox="0 0 60 60">
                <path d="M30 5 L35 20 L50 20 L38 30 L43 45 L30 35 L17 45 L22 30 L10 20 L25 20 Z" fill="#2c3e50" />
              </svg>
            </>
          )}
          {!hasEmbroidery && !hasDye && !hasKite && !hasIron && (
            <>
              <svg className="absolute top-4 right-4 w-16 h-16 opacity-40" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="30" fill="#2d6a4f" opacity="0.2" />
                <path d="M50 20 L50 80 M20 50 L80 50" stroke="#2d6a4f" strokeWidth="1" opacity="0.3" />
              </svg>
              <svg className="absolute bottom-4 left-4 w-12 h-12 opacity-30" viewBox="0 0 60 60">
                <path d="M30 10 L35 25 L50 25 L38 35 L43 50 L30 40 L17 50 L22 35 L10 25 L25 25 Z" fill="#2d6a4f" />
              </svg>
            </>
          )}
        </>
      );
    },
  },
};

export function ArticleIllustration({ category, title, emoji }: ArticleIllustrationProps) {
  const theme = CATEGORY_THEMES[category] || CATEGORY_THEMES["典籍"];
  
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 主背景渐变 */}
      <div 
        className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
        style={{ background: theme.bgGradient }}
      />
      
      {/* 光晕效果 */}
      <div 
        className="absolute inset-0"
        style={{ background: theme.pattern }}
      />
      
      {/* 装饰元素 - 基于标题动态生成 */}
      {theme.decorativeElements(title)}
      
      {/* 中心 emoji */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="text-7xl transition-transform duration-500 group-hover:scale-110 drop-shadow-lg"
          style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))" }}
        >
          {emoji}
        </div>
      </div>
      
      {/* 分类标签 */}
      <span 
        className="absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-serif tracking-widest backdrop-blur-sm"
        style={{ 
          background: "rgba(255,255,255,0.8)",
          color: theme.accentColor,
          border: `1px solid ${theme.accentColor}20`
        }}
      >
        {category}
      </span>
      
      {/* 底部渐变遮罩 */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/10 to-transparent" />
    </div>
  );
}

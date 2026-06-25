/**
 * 经典典籍数据访问层
 *
 * 数据源（按优先级）：
 *   1. 6 本硬编码字典（出师表 / 道德经 / 论语 / 孟子 / 离骚 / 逍遥游）
 *   2. 30+ 本外链映射（点跳转不下载内容）
 *
 * 设计原则：
 *   - 零爬虫、零侵权
 *   - 运行时零网络
 *   - 完整原文 + 权威外链
 */

import { ancientBooksHardcoded, type HardcodedBook } from "@/data/ancient-books-hardcoded";
import { findBookLink, type BookLink } from "@/data/ancient-book-links";

export interface AncientBookData {
  title: string;
  author?: string;
  dynasty: string;
  content: string;
  translation?: string;
  source: string;
  bookLink: BookLink;
}

export function getAncientBook(query: string): AncientBookData | null {
  if (!query) return null;
  const trimmed = query.trim();

  // 1. 硬编码字典
  if (ancientBooksHardcoded[trimmed]) {
    return ancientBooksHardcoded[trimmed];
  }
  // 模糊匹配
  for (const [key, book] of Object.entries(ancientBooksHardcoded)) {
    if (trimmed.includes(key) || book.title.includes(trimmed)) {
      return book;
    }
  }

  // 2. 仅有外链映射（无原文）
  const link = findBookLink(trimmed);
  if (link) {
    return {
      title: link.name,
      dynasty: link.category,
      content: `《${link.name}》${link.brief}\n\n该典籍的完整原文暂未收录于本站，您可以点击下方链接前往权威平台阅读：`,
      source: "外链跳转",
      bookLink: link,
    };
  }

  return null;
}

/** 列出所有硬编码典籍 */
export function listAllAncientBooks(): Array<{
  title: string;
  author?: string;
  dynasty: string;
  brief: string;
  category: string;
}> {
  return Object.values(ancientBooksHardcoded).map((b) => ({
    title: b.title,
    author: b.author,
    dynasty: b.dynasty,
    brief: b.bookLink.brief,
    category: b.bookLink.category,
  }));
}

// 占位：原 ctext API 暂时未启用（ctext 限速），保留接口签名
export function listAllCtextBooks() {
  return [];
}

export function ctextChapterUrl(urn: string): string {
  const path = urn.replace(/^ctp:/, "");
  return `https://ctext.org/${path}`;
}

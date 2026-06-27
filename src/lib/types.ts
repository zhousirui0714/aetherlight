/**
 * 深度知识库类型定义
 * 
 * 设计理念：从"广而浅"转向"深而精"
 */

import { KnowledgeEntry, Person, Book } from "./cultural-knowledge";

// ============================================
// 深度知识库类型
// ============================================

export interface DeepKnowledgeSection {
  title: string;
  content: string;
  expandable?: boolean;
}

export interface TimelineEvent {
  year: string;
  event: string;
}

export interface HistoricalContext {
  era: string;
  description: string;
  keyEvents: {
    year: string;
    event: string;
  }[];
}

export interface Relationship {
  name: string;
  relationship: string;
  description: string;
  poems?: string[];
  famousQuote?: string;
}

export interface PoetryCharacteristic {
  description: string;
  examples?: string[];
  techniques?: string[];
}

export interface FamousQuote {
  quote: string;
  source: string;
  interpretation: string;
}

export interface Relic {
  name: string;
  location: string;
  description: string;
  highlights: string[];
}

export interface Allusion {
  title: string;
  story: string;
  origin: string;
  usage: string;
}

export interface HistoricalComment {
  era: string;
  critic: string;
  comment: string;
  source: string;
  note?: string;
}

export interface ModernResearch {
  scholar: string;
  work: string;
  contribution: string;
}

export interface CulturalInfluence {
  文学: string[];
  艺术: string[];
  生活: string[];
  精神: string[];
}

export interface RecommendedReading {
  title: string;
  author?: string;
  editor?: string;
  note: string;
}

export interface LearningPath {
  step: number;
  title: string;
  resources: string[];
}

// ============================================
// 深度人物数据
// ============================================

export interface DeepPerson extends Person {
  nameVariants?: string[];
  longTermResidence?: string;
  timeline?: TimelineEvent[];
  historicalContext?: HistoricalContext;
  relationships?: Relationship[];
  poetryCharacteristics?: {
    浪漫主义?: PoetryCharacteristic;
    语言风格?: {
      description: string;
      features: string[];
    };
    题材分类?: {
      [key: string]: {
        count: string;
        description: string;
        famous: string[];
      };
    };
  };
  famousQuotes?: {
    [category: string]: FamousQuote[];
  };
  relics?: Relic[];
  allusions?: Allusion[];
  historicalComments?: HistoricalComment[];
  modernResearch?: ModernResearch[];
  culturalInfluence?: CulturalInfluence;
  recommendedReadings?: RecommendedReading[];
}

// ============================================
// 深度知识条目
// ============================================

export interface DetailedAnswer {
  overview: string;
  sections: DeepKnowledgeSection[];
}

export interface DeepKnowledgeEntry extends Omit<KnowledgeEntry, "answer"> {
  answer: string;
  detailedAnswer?: DetailedAnswer;
  detailedNodes?: KnowledgeGraphNode[];
  relatedQuestions?: string[];
  learningPath?: LearningPath[];
}

// ============================================
// 深度典籍数据
// ============================================

export interface DeepBook extends Book {
  authorVariants?: string[];
  creationBackground?: {
    year?: string;
    place?: string;
    context?: string;
  };
  fullContent?: string;
  chapterAnalysis?: {
    chapter: string;
    summary: string;
  }[];
  commentaries?: {
    era: string;
    commentator: string;
    highlights: string;
  }[];
  modernResearch?: ModernResearch[];
  adaptations?: {
    type: string;
    work: string;
    year?: string;
  }[];
}

// ============================================
// 导出类型
// ============================================

export type {
  DeepPerson,
  DeepKnowledgeEntry,
  DeepBook,
  TimelineEvent,
  HistoricalContext,
  Relationship,
  PoetryCharacteristic,
  FamousQuote,
  Relic,
  Allusion,
  HistoricalComment,
  ModernResearch,
  CulturalInfluence,
  RecommendedReading,
  LearningPath,
  DeepKnowledgeSection
};

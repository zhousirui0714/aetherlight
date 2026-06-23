import { useEffect, useRef, useState } from "react";
import { X, BookOpen, User, Calendar, Award, FileText, ExternalLink, Loader2 } from "lucide-react";
import { Person, Book } from "@/lib/cultural-knowledge";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'person' | 'book';
  data: Person | Book;
  title?: string; // 可选的标题，用于API查询
}

interface ExtendedBook extends Book {
  translation?: string;
  fullContent?: string;
}

export function Modal({ isOpen, onClose, type, data, title }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [extendedContent, setExtendedContent] = useState<ExtendedBook | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // 获取更多内容
  useEffect(() => {
    if (isOpen && type === "book" && title) {
      fetchExtendedContent(title);
    }
  }, [isOpen, type, title]);

  const fetchExtendedContent = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ancient-books?q=${encodeURIComponent(query)}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setExtendedContent(result.data);
      }
    } catch (error) {
      console.error("获取典籍内容失败:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div
        ref={overlayRef}
        className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl animate-in fade-in zoom-in duration-200"
      >
        <div className="flex items-center justify-between border-b border-border p-6">
          <div className="flex items-center gap-3">
            {type === "person" ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                <User className="h-5 w-5 text-blue-500" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                <BookOpen className="h-5 w-5 text-amber-500" />
              </div>
            )}
            <div>
              <h3 className="font-serif text-xl font-semibold text-foreground">
                {type === "person" ? (data as Person).name : (data as Book).title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {type === "person" ? `${(data as Person).dynasty}学者` : `${(data as Book).dynasty}典籍`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6">
          {type === "person" ? (
            <PersonDetail person={data as Person} />
          ) : (
            <BookDetail 
              book={data as Book} 
              extendedContent={extendedContent}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function PersonDetail({ person }: { person: Person }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-secondary/30 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {person.birthYear && person.deathYear ? (
            <span>{person.birthYear} - {person.deathYear}</span>
          ) : (
            <span>生卒年不详</span>
          )}
        </div>
      </div>

      <div>
        <h4 className="mb-3 flex items-center gap-2 font-serif text-base font-semibold text-foreground">
          <User className="h-4 w-4 text-blue-500" />
          人物简介
        </h4>
        <p className="font-serif leading-relaxed text-foreground/90">
          {person.description}
        </p>
      </div>

      <div>
        <h4 className="mb-3 flex items-center gap-2 font-serif text-base font-semibold text-foreground">
          <Award className="h-4 w-4 text-amber-500" />
          主要成就
        </h4>
        <ul className="space-y-2">
          {person.achievements.map((achievement, index) => (
            <li key={index} className="flex items-start gap-2 font-serif text-sm text-foreground/90">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {achievement}
            </li>
          ))}
        </ul>
      </div>

      {person.works.length > 0 && (
        <div>
          <h4 className="mb-3 flex items-center gap-2 font-serif text-base font-semibold text-foreground">
            <BookOpen className="h-4 w-4 text-green-500" />
            代表著作
          </h4>
          <div className="flex flex-wrap gap-2">
            {person.works.map((work, index) => (
              <span
                key={index}
                className="rounded-full bg-primary/10 px-3 py-1 font-serif text-sm text-primary"
              >
                {work}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BookDetail({ book, extendedContent, loading }: { book: Book; extendedContent: ExtendedBook | null; loading: boolean }) {
  // 使用扩展内容或原始内容
  const displayContent = extendedContent?.fullContent || extendedContent?.content || book.content;
  const displaySummary = extendedContent?.translation || book.summary;

  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-3 flex items-center gap-2 font-serif text-base font-semibold text-foreground">
          <FileText className="h-4 w-4 text-amber-500" />
          内容简介
        </h4>
        <p className="font-serif leading-relaxed text-foreground/90">
          {displaySummary}
        </p>
      </div>

      {book.author && (
        <div className="rounded-xl border border-border bg-secondary/30 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>作者：{book.author}</span>
          </div>
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="flex items-center gap-2 font-serif text-base font-semibold text-foreground">
            <BookOpen className="h-4 w-4 text-green-500" />
            原文节选
            {loading && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </h4>
          <a
            href="https://ctext.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
          >
            中国哲学书电子化计划
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div className="rounded-xl border border-border bg-secondary/30 p-4">
          <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-foreground/90">
            {displayContent}
          </pre>
        </div>
      </div>

      {book.chapters && book.chapters.length > 0 && (
        <div>
          <h4 className="mb-3 font-serif text-base font-semibold text-foreground">章节目录</h4>
          <div className="grid grid-cols-2 gap-2">
            {book.chapters.map((chapter, index) => (
              <div
                key={index}
                className="rounded-lg border border-border bg-secondary/50 px-3 py-2 font-serif text-sm text-foreground/80"
              >
                {chapter}
              </div>
            ))}
          </div>
        </div>
      )}

      {extendedContent && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-xs text-muted-foreground">
            以上内容来源于：{extendedContent.source}
          </p>
        </div>
      )}
    </div>
  );
}

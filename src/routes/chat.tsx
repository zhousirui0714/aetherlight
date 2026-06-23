import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Send, Sparkles, ThumbsUp, Heart, Clock, BookOpen, MessageSquare, GraduationCap, ExternalLink, Lightbulb, User, Expand } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { KnowledgeEntry, Person, Book, KnowledgeGraphNode } from "@/lib/cultural-knowledge";
import { getPerson, getBook } from "@/lib/cultural-knowledge";
import { KnowledgeGraph } from "@/components/knowledge-graph";
import { Modal } from "@/components/modal";
import { DeepPersonDetail } from "@/components/deep-person-detail";
import { liBaiDeepKnowledge, duFuDeepKnowledge, suShiDeepKnowledge } from "@/lib/deep-knowledge";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "问答助手 · 溯光" },
      { name: "description", content: "向 AI 雅士请教中国传统文化，每答皆有出处。" },
    ],
  }),
  component: ChatPage,
});

const HOT_QUESTIONS = [
  "李白",
  "杜甫",
  "苏轼",
  "《诗经》的'风雅颂'指什么？",
  "端午节的由来？",
  "昆曲为何被称为'百戏之祖'？",
];

type HistoryItem = { id: string; question: string; created_at: string };

function ChatPage() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [knowledgeResponses, setKnowledgeResponses] = useState<Record<string, KnowledgeEntry>>({});
  const [currentGraphNodes, setCurrentGraphNodes] = useState<KnowledgeGraphNode[]>([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalType, setModalType] = useState<'person' | 'book'>('book');
  const [modalData, setModalData] = useState<Person | Book | null>(null);
  const [deepDetailOpen, setDeepDetailOpen] = useState(false);
  const [deepPersonName, setDeepPersonName] = useState<string | null>(null);
  
  const transport = useRef(new DefaultChatTransport({ api: "/api/chat" }));
  const { messages, sendMessage, status } = useChat({
    transport: transport.current,
    onFinish: async ({ message }) => {
      try {
        const { data } = await supabase.auth.getSession();
        const uid = data.session?.user?.id;
        if (!uid) return;
        const lastUser = [...messages].reverse().find((m) => m.role === "user");
        const q = lastUser ? extractText(lastUser) : "";
        const a = extractText(message);
        if (q && a) {
          await supabase.from("qa_history").insert({ user_id: uid, question: q, answer: a });
          loadHistory();
        }
      } catch {}
    },
  });

  const handleKnowledgeResponse = async (question: string) => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: question }] }),
      });
      
      const data = await response.json();
      if (data.type === "knowledge" && data.data) {
        const knowledge = data.data as KnowledgeEntry;
        setKnowledgeResponses(prev => ({
          ...prev,
          [question]: knowledge
        }));
        // 更新知识图谱
        if (knowledge.graphNodes) {
          setCurrentGraphNodes(knowledge.graphNodes);
        }
      } else {
        setCurrentGraphNodes([]);
      }
    } catch (error) {
      console.error("Failed to fetch knowledge response:", error);
      setCurrentGraphNodes([]);
    }
  };

  const handleGraphNodeClick = (node: KnowledgeGraphNode) => {
    // 根据节点类型和名称打开对应的深度面板
    if (node.type === "person") {
      if (node.label === "李白") {
        setDeepPersonName("李白");
        setDeepDetailOpen(true);
        return;
      }
      if (node.label === "杜甫") {
        setDeepPersonName("杜甫");
        setDeepDetailOpen(true);
        return;
      }
      if (node.label === "苏轼" || node.label === "苏东坡") {
        setDeepPersonName("苏轼");
        setDeepDetailOpen(true);
        return;
      }
      
      // 其他人物尝试获取普通详情
      const person = getPerson(node.label);
      if (person) {
        setModalType('person');
        setModalData(person);
        setModalIsOpen(true);
      }
    } else if (node.type === "book") {
      const book = getBook(node.label);
      if (book) {
        setModalType('book');
        setModalData(book);
        setModalIsOpen(true);
      }
    }
  };

  const loadHistory = async () => {
    try {
      const { data } = await supabase
        .from("qa_history")
        .select("id, question, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setHistory(data as HistoryItem[]);
    } catch {}
  };

  useEffect(() => { loadHistory(); }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const loading = status === "submitted" || status === "streaming";

  const submit = (text: string) => {
    if (!text.trim() || loading) return;
    sendMessage({ text });
    handleKnowledgeResponse(text);
    setInput("");
  };

  return (
    <AppShell>
      <div className="mb-8 text-center">
        <div className="font-serif text-xs tracking-[0.4em] text-accent">ASK THE SAGE</div>
        <h1 className="mt-3 font-serif text-4xl text-foreground">问 道 雅 士</h1>
        <p className="mt-2 text-sm text-muted-foreground">关于诗词、节气、典籍、人物 —— 一问即得</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* main chat */}
        <section className="flex h-[calc(100vh-260px)] min-h-[560px] flex-col overflow-hidden rounded-3xl border border-border bg-card">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h2 className="font-serif text-2xl text-foreground">向雅士请教</h2>
                <p className="mt-2 text-sm text-muted-foreground">不妨从下面这些问题开始</p>
                <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                  {HOT_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => submit(q)}
                      className="group rounded-2xl border border-border bg-background/40 px-5 py-4 text-left text-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-secondary"
                    >
                      <span className="font-serif text-base text-foreground group-hover:text-primary">{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((m, index) => {
                  if (m.role === "assistant") {
                    const prevMessage = messages[index - 1];
                    const userQuestion = prevMessage?.role === "user" ? extractText(prevMessage) : "";
                    const knowledge = knowledgeResponses[userQuestion];
                    return <Message key={m.id} m={m} knowledge={knowledge} onOpenModal={setModalIsOpen} setModalType={setModalType} setModalData={setModalData} onOpenDeepDetail={(name) => { setDeepPersonName(name); setDeepDetailOpen(true); }} />;
                  }
                  return <Message key={m.id} m={m} />;
                })}
                {status === "submitted" && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                    <span className="font-serif text-sm">研墨中…</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); submit(input); }}
            className="flex items-end gap-2 border-t border-border bg-background/30 p-4"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); }
              }}
              placeholder="向雅士请教…"
              rows={1}
              className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/70"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-10 items-center gap-2 rounded-full bg-primary px-5 font-serif text-sm tracking-widest text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" /> 发送
            </button>
          </form>
        </section>

        {/* sidebar: knowledge graph + history */}
        <aside className="flex flex-col gap-4">
          {/* knowledge graph */}
          <div className="flex-1 rounded-3xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-accent" />
              <h3 className="font-serif text-base tracking-[0.25em] text-foreground/80">知 识 图 谱</h3>
            </div>
            <KnowledgeGraph nodes={currentGraphNodes} onNodeClick={handleGraphNodeClick} />
          </div>

          {/* history */}
          <div className="h-64 rounded-3xl border border-border bg-card p-5 overflow-hidden flex flex-col">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              <h3 className="font-serif text-base tracking-[0.25em] text-foreground/80">历 史 问 答</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {history.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  登录后可查看您与雅士的过往对谈
                </p>
              ) : (
                <ul className="space-y-2">
                  {history.map((h) => (
                    <li key={h.id}>
                      <button
                        onClick={() => submit(h.question)}
                        className="block w-full rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-foreground/80 transition hover:border-border hover:bg-secondary"
                      >
                        <p className="line-clamp-2 font-serif">{h.question}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {new Date(h.created_at).toLocaleDateString("zh-CN")}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Modal for person/book detail */}
      {modalIsOpen && modalData && (
        <Modal
          isOpen={modalIsOpen}
          onClose={() => setModalIsOpen(false)}
          type={modalType}
          data={modalData}
        />
      )}

      {/* 深度人物详情 - 李白 */}
      {deepDetailOpen && deepPersonName === "李白" && (
        <DeepPersonDetail
          name={liBaiDeepKnowledge.person.name}
          dynasty={liBaiDeepKnowledge.person.dynasty}
          birthYear={liBaiDeepKnowledge.person.birthYear}
          deathYear={liBaiDeepKnowledge.person.deathYear}
          description="李白（701年-762年），字太白，号青莲居士，唐代伟大的浪漫主义诗人，被誉为诗仙。他一生创作诗歌千余首，在中国文学史上占有举足轻重的地位。"
          timeline={liBaiDeepKnowledge.person.timeline}
          relationships={liBaiDeepKnowledge.person.relationships}
          poetryFeatures={liBaiDeepKnowledge.person.poetryCharacteristics}
          famousQuotes={liBaiDeepKnowledge.person.famousQuotes}
          relics={liBaiDeepKnowledge.person.relics}
          allusions={liBaiDeepKnowledge.person.allusions}
          historicalComments={liBaiDeepKnowledge.person.historicalComments}
          recommendedReadings={liBaiDeepKnowledge.person.recommendedReadings}
          learningPath={liBaiDeepKnowledge.person.learningPath}
          onClose={() => setDeepDetailOpen(false)}
          onNodeClick={(nodeId, nodeType) => {
            console.log("Clicked node:", nodeId, nodeType);
          }}
        />
      )}

      {/* 深度人物详情 - 杜甫 */}
      {deepDetailOpen && deepPersonName === "杜甫" && (
        <DeepPersonDetail
          name={duFuDeepKnowledge.person.name}
          dynasty={duFuDeepKnowledge.person.dynasty}
          birthYear={duFuDeepKnowledge.person.birthYear}
          deathYear={duFuDeepKnowledge.person.deathYear}
          description="杜甫（712年-770年），字子美，号少陵野老，唐代伟大的现实主义诗人，被誉为诗圣。他的诗深刻反映了唐代社会的现实，被后人称为'诗史'。"
          timeline={duFuDeepKnowledge.person.timeline}
          relationships={duFuDeepKnowledge.person.relationships}
          poetryFeatures={duFuDeepKnowledge.person.poetryCharacteristics}
          famousQuotes={duFuDeepKnowledge.person.famousQuotes}
          relics={duFuDeepKnowledge.person.relics}
          historicalComments={duFuDeepKnowledge.person.historicalComments}
          recommendedReadings={duFuDeepKnowledge.person.recommendedReadings}
          learningPath={duFuDeepKnowledge.person.learningPath}
          onClose={() => setDeepDetailOpen(false)}
          onNodeClick={(nodeId, nodeType) => {
            console.log("Clicked node:", nodeId, nodeType);
          }}
        />
      )}

      {/* 深度人物详情 - 苏轼 */}
      {deepDetailOpen && deepPersonName === "苏轼" && (
        <DeepPersonDetail
          name={suShiDeepKnowledge.person.name}
          dynasty={suShiDeepKnowledge.person.dynasty}
          birthYear={suShiDeepKnowledge.person.birthYear}
          deathYear={suShiDeepKnowledge.person.deathYear}
          description="苏轼（1037年-1101年），字子瞻，号东坡居士，北宋文学家、书画家。他开创了豪放派词风，与辛弃疾并称'苏辛'，是宋代文学的最高成就者之一。"
          timeline={suShiDeepKnowledge.person.timeline}
          relationships={suShiDeepKnowledge.person.relationships}
          poetryFeatures={suShiDeepKnowledge.person.poetryCharacteristics}
          famousQuotes={suShiDeepKnowledge.person.famousQuotes}
          relics={suShiDeepKnowledge.person.relics}
          historicalComments={suShiDeepKnowledge.person.historicalComments}
          recommendedReadings={suShiDeepKnowledge.person.recommendedReadings}
          learningPath={suShiDeepKnowledge.person.learningPath}
          onClose={() => setDeepDetailOpen(false)}
          onNodeClick={(nodeId, nodeType) => {
            console.log("Clicked node:", nodeId, nodeType);
          }}
        />
      )}
    </AppShell>
  );
}

function extractText(m: UIMessage) {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

interface KnowledgeMessageProps {
  knowledge: KnowledgeEntry;
  question: string;
  onOpenModal: (open: boolean) => void;
  setModalType: (type: 'person' | 'book') => void;
  setModalData: (data: Person | Book | null) => void;
  onOpenDeepDetail?: (name: string) => void;
}

function KnowledgeMessage({ knowledge, onOpenModal, setModalType, setModalData, onOpenDeepDetail }: KnowledgeMessageProps) {
  const [showInterpretation, setShowInterpretation] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleSourceClick = (sourceTitle: string) => {
    // 尝试匹配人物或典籍
    const person = getPerson(sourceTitle.replace(/《|》/g, ""));
    const book = getBook(sourceTitle.replace(/《|》/g, ""));
    
    if (person) {
      setModalType('person');
      setModalData(person);
      onOpenModal(true);
    } else if (book) {
      setModalType('book');
      setModalData(book);
      onOpenModal(true);
    }
  };

  return (
    <div className="flex gap-3">
      <div className="seal mt-1 h-7 shrink-0 px-2.5">溯</div>
      <div className="flex-1 rounded-2xl rounded-tl-md border border-border bg-background/40 p-5">
        <p className="whitespace-pre-wrap font-serif leading-[2] text-foreground">
          {knowledge.answer}
        </p>

        {knowledge.quotes.length > 0 && (
          <div className="mt-6 border-l-2 border-primary/30 pl-4">
            <p className="text-xs text-muted-foreground mb-3">📖 引用原文</p>
            {knowledge.quotes.map((quote, index) => (
              <div key={index} className="mb-4 last:mb-0">
                <button
                  onClick={() => handleSourceClick(quote.title)}
                  className="font-serif text-sm text-primary hover:underline"
                >
                  《{quote.title}》
                </button>
                <p className="mt-2 font-serif text-sm leading-relaxed italic text-foreground/90">
                  {quote.text}
                </p>
                <button
                  onClick={() => handleSourceClick(quote.author)}
                  className="mt-1 text-xs text-muted-foreground hover:text-primary hover:underline"
                >
                  —— {quote.dynasty} · {quote.author}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          <p className="text-xs text-muted-foreground mb-2">📚 出处</p>
          <div className="flex flex-wrap gap-2">
            {knowledge.sources.map((source, index) => (
              <button
                key={index}
                onClick={() => handleSourceClick(source.title)}
                className="inline-flex items-center gap-1 rounded-full bg-secondary/50 px-3 py-1.5 text-xs text-foreground/80 hover:bg-secondary hover:text-foreground transition"
              >
                <BookOpen className="h-3 w-3" />
                {source.title}
                {source.url && <ExternalLink className="h-3 w-3" />}
              </button>
            ))}
          </div>
        </div>

        {knowledge.interpretations && (
          <div className="mt-4">
            <button
              onClick={() => setShowInterpretation(!showInterpretation)}
              className="flex items-center gap-2 rounded-lg border border-border/50 px-4 py-2 text-sm text-muted-foreground hover:border-primary/30 hover:text-foreground transition"
            >
              <MessageSquare className="h-4 w-4" />
              {showInterpretation ? "收起现代释义" : "点击查看现代释义"}
            </button>
            {showInterpretation && (
              <p className="mt-3 pl-2 font-serif text-sm leading-relaxed text-foreground/90">
                {knowledge.interpretations}
              </p>
            )}
          </div>
        )}

        {knowledge.scholarAnalysis && (
          <div className="mt-3">
            <button
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="flex items-center gap-2 rounded-lg border border-border/50 px-4 py-2 text-sm text-muted-foreground hover:border-primary/30 hover:text-foreground transition"
            >
              <GraduationCap className="h-4 w-4" />
              {showAnalysis ? "收起学者解读" : "点击查看学者解读"}
            </button>
            {showAnalysis && (
              <p className="mt-3 pl-2 font-serif text-sm leading-relaxed text-foreground/90 italic">
                {knowledge.scholarAnalysis}
              </p>
            )}
          </div>
        )}

        {/* 深度了解按钮 */}
        {(knowledge.quotes.some(q => q.author === "李白") ||
          knowledge.quotes.some(q => q.author === "杜甫") ||
          knowledge.quotes.some(q => q.author === "苏轼")) && onOpenDeepDetail && (
          <div className="mt-5 flex flex-wrap gap-2">
            {knowledge.quotes.some(q => q.author === "李白") && (
              <button
                onClick={() => onOpenDeepDetail("李白")}
                className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm text-primary hover:bg-primary/10 transition"
              >
                <Expand className="h-4 w-4" />
                深入了解李白
              </button>
            )}
            {knowledge.quotes.some(q => q.author === "杜甫") && (
              <button
                onClick={() => onOpenDeepDetail("杜甫")}
                className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-4 py-2.5 text-sm text-accent hover:bg-accent/10 transition"
              >
                <Expand className="h-4 w-4" />
                深入了解杜甫
              </button>
            )}
            {knowledge.quotes.some(q => q.author === "苏轼") && (
              <button
                onClick={() => onOpenDeepDetail("苏轼")}
                className="flex items-center gap-2 rounded-lg border border-secondary/30 bg-secondary/5 px-4 py-2.5 text-sm text-secondary-foreground hover:bg-secondary/10 transition"
              >
                <Expand className="h-4 w-4" />
                深入了解苏轼
              </button>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center gap-1 border-t border-border/60 pt-3 text-muted-foreground">
          <button className="flex items-center gap-1 rounded-full px-3 py-1 text-xs hover:bg-secondary hover:text-foreground">
            <ThumbsUp className="h-3.5 w-3.5" /> 赞
          </button>
          <button className="flex items-center gap-1 rounded-full px-3 py-1 text-xs hover:bg-secondary hover:text-foreground">
            <Heart className="h-3.5 w-3.5" /> 收藏
          </button>
        </div>
      </div>
    </div>
  );
}

function Message({ m, knowledge, onOpenModal, setModalType, setModalData, onOpenDeepDetail }: { m: UIMessage; knowledge?: KnowledgeEntry; onOpenModal?: (open: boolean) => void; setModalType?: (type: 'person' | 'book') => void; setModalData?: (data: Person | Book | null) => void; onOpenDeepDetail?: (name: string) => void; }) {
  const text = extractText(m);
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-br-md bg-primary px-5 py-3 text-primary-foreground shadow-sm">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
        </div>
      </div>
    );
  }

  if (knowledge && onOpenModal && setModalType && setModalData) {
    return <KnowledgeMessage knowledge={knowledge} question={text} onOpenModal={onOpenModal} setModalType={setModalType} setModalData={setModalData} onOpenDeepDetail={onOpenDeepDetail} />;
  }

  const sourceMatch = text.match(/(——[\s\S]+)$/);
  const body = sourceMatch ? text.slice(0, sourceMatch.index).trimEnd() : text;
  const source = sourceMatch ? sourceMatch[1].trim() : null;
  return (
    <div className="flex gap-3">
      <div className="seal mt-1 h-7 shrink-0 px-2.5">溯</div>
      <div className="flex-1 rounded-2xl rounded-tl-md border border-border bg-background/40 p-5">
        <p className="whitespace-pre-wrap font-serif leading-[2] text-foreground">{body}</p>
        {source && (
          <p className="mt-3 text-xs italic text-muted-foreground">{source}</p>
        )}
        <div className="mt-4 flex items-center gap-1 border-t border-border/60 pt-3 text-muted-foreground">
          <button className="flex items-center gap-1 rounded-full px-3 py-1 text-xs hover:bg-secondary hover:text-foreground">
            <ThumbsUp className="h-3.5 w-3.5" /> 赞
          </button>
          <button className="flex items-center gap-1 rounded-full px-3 py-1 text-xs hover:bg-secondary hover:text-foreground">
            <Heart className="h-3.5 w-3.5" /> 收藏
          </button>
        </div>
      </div>
    </div>
  );
}

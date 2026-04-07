import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useMemories } from "@/hooks/use-memories";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Send, Trash2, Brain, Sparkles, FileText, Link as LinkIcon,
  ArrowUpRight, Bot, User, ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { semanticSearch } from "@/lib/search";
import type { Memory } from "@shared/schema";

interface SourceRef {
  id: number;
  title: string;
  type: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceRef[];
  isTyping?: boolean;
}

const SUGGESTED_PROMPTS = [
  { icon: "💡", text: "Какие идеи проектов я записывал?" },
  { icon: "📚", text: "Что я изучаю по программированию?" },
  { icon: "🏷️", text: "Покажи статистику по тегам" },
  { icon: "🔗", text: "Сколько у меня воспоминаний?" },
  { icon: "🕐", text: "Что я добавлял на этой неделе?" },
  { icon: "🎨", text: "Расскажи о моих дизайн-ресурсах" },
];

function pluralRu(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} ${many}`;
  if (mod10 === 1) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} ${few}`;
  return `${n} ${many}`;
}

function generateAIResponse(query: string, memories: Memory[]): { content: string; sources: SourceRef[] } {
  const q = query.toLowerCase();
  const results = semanticSearch(memories, query, "semantic").slice(0, 4);
  const sources: SourceRef[] = results.map(r => ({ id: r.id, title: r.title, type: r.type }));

  const isTagQ = /тег|метк/.test(q);
  const isCountQ = /сколько|количество|всего/.test(q);
  const isWeekQ = /недел|недавн|сегодня|сейчас/.test(q);
  const isStatQ = /статистик|аналитик|обзор/.test(q);

  let content = "";

  if (isCountQ || isStatQ) {
    const textCount = memories.filter(m => m.type === "text").length;
    const linkCount = memories.filter(m => m.type === "link").length;
    const fileCount = memories.filter(m => m.type === "file").length;
    const allTags = new Set(memories.flatMap(m => m.tags));
    content =
      `В вашей базе знаний хранится **${pluralRu(memories.length, "воспоминание", "воспоминания", "воспоминаний")}**.\n\n` +
      `**По типу:**\n` +
      `• 📝 Текстовых заметок: ${textCount}\n` +
      `• 🔗 Ссылок: ${linkCount}\n` +
      `• 📎 Файлов: ${fileCount}\n\n` +
      `**Уникальных тегов:** ${allTags.size}`;
    return { content, sources: [] };
  }

  if (isTagQ) {
    const tagCounts: Record<string, number> = {};
    memories.forEach(m => m.tags.forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; }));
    const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (sorted.length === 0) {
      content = "В вашей базе пока нет тегов. Добавьте их при создании воспоминаний — это поможет лучше организовать и искать информацию.";
    } else {
      content =
        `Ваши наиболее используемые теги (всего ${Object.keys(tagCounts).length} уникальных):\n\n` +
        sorted.map(([tag, count]) => `• **#${tag}** — ${pluralRu(count, "запись", "записи", "записей")}`).join("\n");
    }
    return { content, sources: [] };
  }

  if (isWeekQ) {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = memories.filter(m => new Date(m.createdAt).getTime() > weekAgo);
    if (recent.length === 0) {
      content = "За последнюю неделю вы не добавляли новых воспоминаний. Самое время что-нибудь записать!";
    } else {
      content =
        `За последние 7 дней вы добавили **${pluralRu(recent.length, "воспоминание", "воспоминания", "воспоминаний")}**:\n\n` +
        recent.slice(0, 4).map(m => `• **${m.title}** — ${(m.summary || m.content).slice(0, 70)}...`).join("\n");
    }
    return { content, sources: recent.slice(0, 4).map(m => ({ id: m.id, title: m.title, type: m.type })) };
  }

  if (results.length === 0) {
    content =
      `По запросу «${query}» я не нашёл подходящих записей.\n\n` +
      `**Попробуйте:**\n` +
      `• Использовать более общие слова\n` +
      `• Переключиться в режим поиска по ключевым словам\n` +
      `• Сохранить информацию по этой теме`;
    return { content, sources: [] };
  }

  const main = results[0];
  const excerpt = (main.summary || main.content).slice(0, 180);

  if (results.length === 1) {
    content =
      `Нашёл одну запись, которая соответствует вашему запросу:\n\n` +
      `**${main.title}**\n${excerpt}${excerpt.length >= 180 ? "..." : ""}`;
  } else {
    content =
      `Нашёл **${pluralRu(results.length, "запись", "записи", "записей")}** по вашему запросу.\n\n` +
      `**Наиболее релевантная:** ${main.title}\n${excerpt}${excerpt.length >= 180 ? "..." : ""}\n\n` +
      (results.length > 1
        ? `**Также связаны:**\n${results.slice(1).map(r => `• ${r.title}`).join("\n")}`
        : "");
  }

  return { content, sources };
}

function renderContent(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Bold **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return <span key={j}>{part}</span>;
    });
    return <p key={i} className={line.startsWith("•") ? "ml-2" : ""}>{parts}</p>;
  });
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-1">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-primary/60"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

export default function Chat() {
  const { data: memories = [] } = useMemories();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("chatHistory_v2");
      if (saved) setMessages(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const persist = messages.filter(m => !m.isTyping);
    localStorage.setItem("chatHistory_v2", JSON.stringify(persist));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async (text?: string) => {
    const query = (text ?? input).trim();
    if (!query || isLoading) return;

    setInput("");

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: query,
    };
    const typingId = (Date.now() + 1).toString();
    const typingMsg: ChatMessage = {
      id: typingId,
      role: "assistant",
      content: "",
      isTyping: true,
    };

    setMessages(prev => [...prev, userMsg, typingMsg]);
    setIsLoading(true);

    // Simulate AI latency (800–1600 ms)
    const delay = 800 + Math.random() * 800;
    await new Promise(r => setTimeout(r, delay));

    try {
      const { content, sources } = generateAIResponse(query, memories);
      const assistantMsg: ChatMessage = {
        id: typingId,
        role: "assistant",
        content,
        sources: sources.length > 0 ? sources : undefined,
      };
      setMessages(prev => prev.map(m => m.id === typingId ? assistantMsg : m));
    } catch {
      toast({ title: "Ошибка", description: "Не удалось обработать запрос", variant: "destructive" });
      setMessages(prev => prev.filter(m => m.id !== typingId));
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [input, isLoading, memories, toast]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
    localStorage.removeItem("chatHistory_v2");
    toast({ title: "История очищена" });
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-0px)] md:h-screen p-4 md:p-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary p-2.5 rounded-2xl">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Memory Assistant</h1>
            <p className="text-xs text-muted-foreground">
              {memories.length > 0
                ? `Доступно ${pluralRu(memories.length, "воспоминание", "воспоминания", "воспоминаний")}`
                : "Загрузка базы..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs gap-1.5 hidden sm:flex">
            <Sparkles className="w-3 h-3" />
            MVP · Локальный AI
          </Badge>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground">
              <Trash2 className="w-4 h-4 mr-1.5" />
              Очистить
            </Button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center h-full text-center py-10"
          >
            <div className="bg-primary/10 text-primary p-5 rounded-3xl mb-6">
              <Brain className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Чем могу помочь?</h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              Я анализирую ваши воспоминания и отвечаю на вопросы с источниками
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4 py-2">
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[80%] space-y-3 ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                    {/* Bubble */}
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-card border border-border/60 text-foreground rounded-tl-sm"
                    }`}>
                      {msg.isTyping ? (
                        <TypingIndicator />
                      ) : msg.role === "user" ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="space-y-1">{renderContent(msg.content)}</div>
                      )}
                    </div>

                    {/* Source cards */}
                    {msg.sources && msg.sources.length > 0 && !msg.isTyping && (
                      <div className="w-full space-y-1.5">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide ml-1">
                          Источники
                        </p>
                        {msg.sources.map(src => {
                          const Icon = src.type === "link" ? LinkIcon : FileText;
                          return (
                            <Link key={src.id} href={`/memory/${src.id}`}>
                              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/60 hover:bg-muted border border-border/50 hover:border-primary/30 transition-all group cursor-pointer">
                                <div className="p-1.5 rounded-lg bg-background border border-border/50 text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-medium flex-1 truncate group-hover:text-primary transition-colors">
                                  {src.title}
                                </span>
                                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-xl bg-secondary text-foreground flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Suggested prompts row */}
      <div className="shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {SUGGESTED_PROMPTS.map(p => (
            <button
              key={p.text}
              onClick={() => handleSend(p.text)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 bg-card hover:border-primary/40 hover:bg-primary/5 text-xs text-muted-foreground hover:text-foreground transition-all shrink-0 disabled:opacity-40"
            >
              <span>{p.icon}</span>
              <span>{p.text}</span>
              <ChevronRight className="w-3 h-3 opacity-40" />
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2 items-end mt-1">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Задайте вопрос о ваших воспоминаниях... (Enter — отправить, Shift+Enter — перенос)"
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none bg-card border-border/60 rounded-2xl text-sm min-h-[44px] max-h-[120px] py-3 px-4 focus-visible:ring-primary/30 overflow-hidden"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          <Button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="h-11 w-11 rounded-xl shrink-0 shadow-md shadow-primary/20"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

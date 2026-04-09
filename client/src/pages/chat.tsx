import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useMemories } from "@/hooks/use-memories";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Send, Trash2, Brain, Sparkles, FileText, Link as LinkIcon,
  ArrowUpRight, Bot, User, ChevronRight, MessageCircle
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
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
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
          className="w-1.5 h-1.5 rounded-full bg-primary/50"
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
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
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-0px)] md:h-screen p-4 md:p-6 gap-3">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-xl blur-md opacity-30" />
            <div className="relative bg-gradient-to-br from-primary to-purple-600 text-white p-2.5 rounded-xl shadow-lg shadow-primary/20">
              <Brain className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight" data-testid="text-chat-title">Memory Assistant</h1>
            <p className="text-[11px] text-muted-foreground">
              {memories.length > 0
                ? `${pluralRu(memories.length, "воспоминание", "воспоминания", "воспоминаний")} в базе`
                : "Загрузка базы..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] gap-1 hidden sm:flex px-2 py-1 rounded-lg font-medium">
            <Sparkles className="w-3 h-3" />
            Локальный AI
          </Badge>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground h-8 text-xs" data-testid="button-clear-chat">
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Очистить
            </Button>
          )}
        </div>
      </motion.div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-full text-center py-10"
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-3xl blur-xl opacity-20" />
              <div className="relative bg-gradient-to-br from-primary/10 to-purple-500/10 text-primary p-6 rounded-3xl border border-primary/10">
                <MessageCircle className="w-10 h-10" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2">Чем могу помочь?</h2>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              Я анализирую ваши воспоминания и отвечаю на вопросы с источниками
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3 py-2">
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/15 to-purple-500/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className={`max-w-[80%] space-y-2.5 ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-md shadow-md shadow-primary/15"
                        : "bg-card border border-border/40 text-foreground rounded-tl-md"
                    }`}>
                      {msg.isTyping ? (
                        <TypingIndicator />
                      ) : msg.role === "user" ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="space-y-1">{renderContent(msg.content)}</div>
                      )}
                    </div>

                    {msg.sources && msg.sources.length > 0 && !msg.isTyping && (
                      <div className="w-full space-y-1">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                          Источники
                        </p>
                        {msg.sources.map(src => {
                          const Icon = src.type === "link" ? LinkIcon : FileText;
                          return (
                            <Link key={src.id} href={`/memory/${src.id}`}>
                              <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/40 hover:bg-muted/60 border border-border/30 hover:border-primary/20 transition-all group cursor-pointer" data-testid={`link-source-${src.id}`}>
                                <div className="p-1.5 rounded-lg bg-card border border-border/30 text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                                  <Icon className="w-3 h-3" />
                                </div>
                                <span className="text-xs font-medium flex-1 truncate group-hover:text-primary transition-colors">
                                  {src.title}
                                </span>
                                <ArrowUpRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-secondary text-foreground flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="shrink-0">
        <div className="flex gap-1.5 overflow-x-auto pb-2 hide-scrollbar">
          {SUGGESTED_PROMPTS.map(p => (
            <button
              key={p.text}
              onClick={() => handleSend(p.text)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/30 bg-card hover:border-primary/30 hover:bg-primary/5 text-[11px] text-muted-foreground hover:text-foreground transition-all shrink-0 disabled:opacity-40 font-medium"
              data-testid={`button-prompt-${p.text.slice(0, 10)}`}
            >
              <span>{p.icon}</span>
              <span>{p.text}</span>
              <ChevronRight className="w-3 h-3 opacity-30" />
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-end mt-1">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Задайте вопрос о ваших воспоминаниях..."
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none bg-card border-border/30 rounded-xl text-sm min-h-[42px] max-h-[120px] py-2.5 px-4 focus-visible:ring-primary/30 overflow-hidden shadow-sm"
            style={{ fieldSizing: "content" } as React.CSSProperties}
            data-testid="input-chat"
          />
          <Button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="h-[42px] w-[42px] rounded-xl shrink-0 shadow-lg shadow-primary/20"
            data-testid="button-send"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

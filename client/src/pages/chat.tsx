import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useMemories, useChatMessage } from "@/hooks/use-memories";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Send, Trash2, Brain, Sparkles, FileText, Link as LinkIcon,
  ArrowUpRight, Bot, User, MessageCircle, Search, Layers, Tag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  { icon: Search, text: "Какие идеи проектов я записывал?" },
  { icon: Brain, text: "Что я изучаю по программированию?" },
  { icon: Tag, text: "Покажи статистику по тегам" },
  { icon: Layers, text: "Сколько у меня воспоминаний?" },
  { icon: MessageCircle, text: "Что я добавлял на этой неделе?" },
  { icon: Sparkles, text: "Расскажи о моих файлах и ссылках" },
];

const FEATURE_CARDS = [
  {
    icon: Brain,
    color: "text-primary",
    bg: "from-primary/10 to-purple-500/10",
    border: "border-primary/15",
    title: "Умный поиск по памяти",
    desc: "Задайте вопрос в свободной форме — AI найдёт нужное в ваших записях",
  },
  {
    icon: Layers,
    color: "text-emerald-500",
    bg: "from-emerald-500/10 to-green-500/10",
    border: "border-emerald-500/15",
    title: "Источники с ссылками",
    desc: "Каждый ответ сопровождается ссылками на записи, из которых взята информация",
  },
  {
    icon: Sparkles,
    color: "text-amber-500",
    bg: "from-amber-500/10 to-orange-500/10",
    border: "border-amber-500/15",
    title: "Аналитика и статистика",
    desc: "Узнайте сколько записей, какие теги используются и что добавлено за неделю",
  },
];

function pluralRu(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} ${many}`;
  if (mod10 === 1) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} ${few}`;
  return `${n} ${many}`;
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
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary/60"
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

export default function Chat() {
  const { data: memories = [] } = useMemories();
  const { data: appStatus } = useQuery<{ aiAvailable: boolean; modelName: string }>({
    queryKey: ["/api/status"],
  });
  const chatMutation = useChatMessage();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("chatHistory_v3");
      if (saved) setMessages(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const persist = messages.filter(m => !m.isTyping);
    localStorage.setItem("chatHistory_v3", JSON.stringify(persist));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async (text?: string) => {
    const query = (text ?? input).trim();
    if (!query || isLoading) return;
    setInput("");

    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: query };
    const typingId = (Date.now() + 1).toString();
    const typingMsg: ChatMessage = { id: typingId, role: "assistant", content: "", isTyping: true };

    setMessages(prev => [...prev, userMsg, typingMsg]);
    setIsLoading(true);

    // Build conversation history for context
    const history = messages
      .filter(m => !m.isTyping)
      .slice(-8)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const result = await chatMutation.mutateAsync({ message: query, history });
      const assistantMsg: ChatMessage = {
        id: typingId,
        role: "assistant",
        content: result.content,
        sources: result.sources?.length > 0 ? result.sources : undefined,
      };
      setMessages(prev => prev.map(m => m.id === typingId ? assistantMsg : m));
    } catch (err) {
      toast({ title: "Ошибка", description: "Не удалось обработать запрос", variant: "destructive" });
      setMessages(prev => prev.filter(m => m.id !== typingId));
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [input, isLoading, messages, chatMutation, toast]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
    localStorage.removeItem("chatHistory_v3");
    toast({ title: "История очищена" });
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-0px)] md:h-screen p-4 md:p-6 gap-3">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between shrink-0 pb-2 border-b border-border/30"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-xl blur-md opacity-25" />
            <div className="relative bg-gradient-to-br from-primary to-purple-600 text-white p-2.5 rounded-xl shadow-lg shadow-primary/20">
              <Brain className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight" data-testid="text-chat-title">Memory Assistant</h1>
              <div className="flex items-center gap-1.5">
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">онлайн</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {memories.length > 0
                ? `${pluralRu(memories.length, "воспоминание", "воспоминания", "воспоминаний")} в базе знаний`
                : "Загрузка базы..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] gap-1 hidden sm:flex px-2 py-1 rounded-lg">
            <Sparkles className="w-3 h-3" />
            {appStatus?.modelName ?? "AI"}
          </Badge>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground h-8 text-xs gap-1" data-testid="button-clear-chat">
              <Trash2 className="w-3.5 h-3.5" />Очистить
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
            className="flex flex-col items-center justify-center h-full py-10"
          >
            <div className="relative mb-5">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-3xl blur-xl opacity-15" />
              <div className="relative bg-gradient-to-br from-primary/10 to-purple-500/10 text-primary p-5 rounded-3xl border border-primary/10">
                <MessageCircle className="w-9 h-9" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-1.5">Чем могу помочь?</h2>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed text-center mb-8">
              Задайте вопрос о ваших воспоминаниях — получите ответ с источниками
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
              {FEATURE_CARDS.map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.2 + i * 0.1 }}
                  className={`p-4 rounded-xl border ${card.border} bg-gradient-to-br ${card.bg}`}
                >
                  <card.icon className={`w-5 h-5 ${card.color} mb-2.5`} />
                  <p className="text-sm font-semibold text-foreground mb-1 leading-tight">{card.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4 py-2">
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/15 to-purple-500/15 border border-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className={`max-w-[80%] space-y-2 ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed relative ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-primary to-primary/85 text-primary-foreground rounded-tr-md shadow-lg shadow-primary/20"
                        : "bg-card border border-border/50 text-foreground rounded-tl-md shadow-sm shadow-black/[0.04] dark:shadow-black/[0.2]"
                    }`}>
                      {msg.role === "assistant" && !msg.isTyping && (
                        <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-primary/30 rounded-full -ml-px" />
                      )}
                      {msg.isTyping ? (
                        <TypingIndicator />
                      ) : msg.role === "user" ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="space-y-1 pl-2">{renderContent(msg.content)}</div>
                      )}
                    </div>

                    {msg.sources && msg.sources.length > 0 && !msg.isTyping && (
                      <div className="w-full">
                        <div className="bg-muted/40 border border-border/50 rounded-xl p-3 space-y-1.5 shadow-sm shadow-black/[0.03]">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                            <Layers className="w-3 h-3" />Источники ({msg.sources.length})
                          </p>
                          {msg.sources.map(src => {
                            const Icon = src.type === "link" ? LinkIcon : src.type === "file" ? FileText : FileText;
                            return (
                              <Link key={src.id} href={`/memory/${src.id}`}>
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-card hover:bg-card/80 border border-border/30 hover:border-primary/20 transition-all group cursor-pointer" data-testid={`link-source-${src.id}`}>
                                  <div className={`p-1.5 rounded-md shrink-0 ${
                                    src.type === "link" ? "bg-emerald-500/10 text-emerald-500" :
                                    src.type === "file" ? "bg-amber-500/10 text-amber-500" :
                                    "bg-blue-500/10 text-blue-500"
                                  }`}>
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
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-secondary border border-border/30 text-foreground flex items-center justify-center shrink-0 mt-0.5">
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

      <div className="shrink-0 space-y-2.5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {SUGGESTED_PROMPTS.map(p => (
            <button
              key={p.text}
              onClick={() => handleSend(p.text)}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/30 bg-card hover:border-primary/30 hover:bg-primary/5 text-[11px] text-muted-foreground hover:text-foreground transition-all disabled:opacity-40 font-medium text-left"
              data-testid={`button-prompt-${p.text.slice(0, 10)}`}
            >
              <p.icon className="w-3.5 h-3.5 shrink-0 opacity-60" />
              <span className="truncate">{p.text}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Задайте вопрос о ваших воспоминаниях..."
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none bg-card border-border/30 rounded-xl text-sm min-h-[44px] max-h-[120px] py-3 px-4 focus-visible:ring-primary/30 overflow-hidden shadow-sm"
            style={{ fieldSizing: "content" } as React.CSSProperties}
            data-testid="input-chat"
          />
          <Button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="h-11 w-11 rounded-xl shrink-0 shadow-lg shadow-primary/20"
            data-testid="button-send"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/50 text-center">Enter — отправить · Shift+Enter — новая строка</p>
      </div>
    </div>
  );
}

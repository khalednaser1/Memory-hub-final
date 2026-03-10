import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useMemories } from "@/hooks/use-memories";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Trash2, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { semanticSearch } from "@/lib/search";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ id: number; title: string }>;
}

const EXAMPLE_PROMPTS = [
  "Какие статьи я читал про дизайн?",
  "Расскажи мне о моих проектах",
  "Какие теги я использую чаще всего?",
  "Что я узнал на этой неделе?"
];

export default function Chat() {
  const { data: memories = [] } = useMemories();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        // Ignore
      }
    }
  }, []);

  // Save chat history
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Search memories
      const results = semanticSearch(memories, input, 'semantic');
      const topResults = results.slice(0, 3);

      // Generate response
      let assistantResponse = "";
      const sources = topResults.map(r => ({ id: r.id, title: r.title }));

      if (topResults.length > 0) {
        assistantResponse = `На основе ваших воспоминаний:\n\n`;
        
        // Generate a helpful response based on the query and found memories
        if (input.toLowerCase().includes('статья') || input.toLowerCase().includes('читал')) {
          assistantResponse += `Я нашел ${topResults.length} материал(ов) которые могут вас заинтересовать:\n`;
          topResults.forEach(m => {
            assistantResponse += `• **${m.title}** - ${m.summary || m.content.slice(0, 50)}...\n`;
          });
        } else if (input.toLowerCase().includes('проект')) {
          assistantResponse += `Вы работали над несколькими проектами:\n`;
          topResults.forEach(m => {
            assistantResponse += `• **${m.title}** - ${m.summary || m.content.slice(0, 50)}...\n`;
          });
        } else if (input.toLowerCase().includes('тег')) {
          const tags: Record<string, number> = {};
          memories.forEach(m => {
            m.tags.forEach(tag => {
              tags[tag] = (tags[tag] || 0) + 1;
            });
          });
          const topTags = Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 5);
          assistantResponse += `Ваши самые популярные теги:\n`;
          topTags.forEach(([tag, count]) => {
            assistantResponse += `• **${tag}** - используется ${count} раз(a)\n`;
          });
        } else {
          assistantResponse += `Я нашел релевантные воспоминания:\n`;
          topResults.forEach(m => {
            assistantResponse += `• **${m.title}** - ${m.summary || m.content.slice(0, 50)}...\n`;
          });
        }

        assistantResponse += `\n**Источники:**\n`;
        topResults.forEach((m, idx) => {
          assistantResponse += `${idx + 1}. [${m.title}](/memory/${m.id})\n`;
        });
      } else {
        assistantResponse = `Я не нашел релевантные воспоминания для вашего запроса "${input}".\n\nПопробуйте:\n• Переформулировать вопрос\n• Сохранить связанное воспоминание\n• Использовать более общие термины`;
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantResponse,
        sources: topResults.length > 0 ? sources : undefined
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось обработать запрос", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    localStorage.removeItem('chatHistory');
    toast({ title: "История чата очищена" });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 h-[calc(100vh-80px)] md:h-[calc(100vh-0px)] flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Умный ассистент</h1>
          <p className="text-muted-foreground mt-1">Задавайте вопросы о своих воспоминаниях</p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Trash2 className="w-4 h-4 mr-2" />
            Очистить
          </Button>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Zap className="w-16 h-16 text-primary/30 mb-6" />
          <h2 className="text-2xl font-semibold mb-2">Начните разговор</h2>
          <p className="text-muted-foreground text-center max-w-md mb-8">
            Ассистент будет искать в ваших воспоминаниях и предоставлять ответы с источниками
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
            {EXAMPLE_PROMPTS.map(prompt => (
              <button
                key={prompt}
                onClick={() => {
                  setInput(prompt);
                }}
                className="p-4 text-left text-sm rounded-lg border border-border/50 hover:border-primary/50 hover:bg-card/50 transition-all"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto mb-6 space-y-4 pr-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl p-4 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card border border-border/50'
              }`}>
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.sources.map(source => (
                      <Link key={source.id} href={`/memory/${source.id}`} className="block">
                        <Badge variant="secondary" className="hover:opacity-80 cursor-pointer text-xs">
                          📄 {source.title}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
          placeholder="Задайте вопрос..."
          disabled={isLoading}
          className="bg-card border-border/50"
        />
        <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
          {isLoading ? "..." : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

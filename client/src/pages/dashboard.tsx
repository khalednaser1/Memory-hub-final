import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Plus, TrendingUp, Tag, Calendar } from "lucide-react";
import { useMemories, useCreateMemory } from "@/hooks/use-memories";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MemoryCard } from "@/components/memory-card";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function Dashboard() {
  const { data: memories, isLoading } = useMemories();
  const { toast } = useToast();
  const createMemory = useCreateMemory();
  
  const [quickTitle, setQuickTitle] = useState("");
  const [quickContent, setQuickContent] = useState("");

  const handleQuickCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    
    try {
      await createMemory.mutateAsync({
        title: quickTitle,
        content: quickContent,
        type: 'text',
        tags: []
      });
      toast({ title: "Успешно!", description: "Воспоминание добавлено" });
      setQuickTitle("");
      setQuickContent("");
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось сохранить", variant: "destructive" });
    }
  };

  const recentMemories = memories?.slice(0, 5) || [];
  const thisWeekCount = memories?.filter(m => {
    const memDate = new Date(m.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return memDate >= weekAgo;
  }).length || 0;

  const tagCounts: Record<string, number> = {};
  memories?.forEach(m => {
    m.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const typeCounts = {
    text: memories?.filter(m => m.type === 'text').length || 0,
    link: memories?.filter(m => m.type === 'link').length || 0,
    file: memories?.filter(m => m.type === 'file').length || 0
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Добро пожаловать</h1>
          <p className="text-muted-foreground mt-2">Обзор вашей памяти в одном месте</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Всего воспоминаний</p>
                <p className="text-4xl font-bold text-foreground mt-2">{memories?.length || 0}</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">На этой неделе</p>
                <p className="text-4xl font-bold text-foreground mt-2">{thisWeekCount}</p>
              </div>
              <div className="bg-accent/10 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Топ тег</p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {topTags.length > 0 ? topTags[0][0] : "—"}
                </p>
                {topTags.length > 0 && <p className="text-xs text-muted-foreground mt-1">{topTags[0][1]} воспоминаний</p>}
              </div>
              <div className="bg-secondary/10 p-3 rounded-lg">
                <Tag className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </Card>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Memories */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Недавние воспоминания</h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/library">Смотреть все</Link>
            </Button>
          </div>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-20 bg-card border border-border/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentMemories.length > 0 ? (
            <div className="space-y-3">
              {recentMemories.map((memory) => (
                <Link key={memory.id} href={`/memory/${memory.id}`} className="block">
                  <div className="p-4 bg-card border border-border/50 rounded-lg hover:border-primary/50 hover:bg-card/80 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">{memory.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{memory.summary || memory.content.slice(0, 60)}...</p>
                      </div>
                      <span className="text-xs text-muted-foreground ml-4 shrink-0">{format(new Date(memory.createdAt), 'd MMM', { locale: ru })}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card/30 border border-border/50 rounded-lg">
              <p className="text-muted-foreground mb-4">Нет воспоминаний</p>
              <Button asChild><Link href="/capture">Создать первое воспоминание</Link></Button>
            </div>
          )}
        </motion.div>

        {/* Quick Capture & Popular Tags */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="space-y-6">
          {/* Quick Capture */}
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <h3 className="font-semibold mb-4">Быстрое добавление</h3>
            <form onSubmit={handleQuickCapture} className="space-y-3">
              <Input 
                placeholder="Заголовок..." 
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="bg-background border-border/50"
              />
              <Textarea 
                placeholder="Содержимое..." 
                value={quickContent}
                onChange={(e) => setQuickContent(e.target.value)}
                className="bg-background border-border/50 min-h-20 resize-none"
              />
              <Button 
                type="submit" 
                className="w-full" 
                disabled={!quickTitle.trim() || createMemory.isPending}
              >
                <Plus className="w-4 h-4 mr-2" />
                {createMemory.isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </form>
          </Card>

          {/* Popular Tags */}
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <h3 className="font-semibold mb-4">Популярные теги</h3>
            {topTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {topTags.slice(0, 8).map(([tag, count]) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-secondary/80 transition-colors">
                    {tag} <span className="ml-1 text-xs opacity-70">({count})</span>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Нет тегов</p>
            )}
          </Card>

          {/* By Type Stats */}
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <h3 className="font-semibold mb-4">По типам</h3>
            <div className="space-y-4">
              {[
                { label: 'Текст', value: typeCounts.text, color: 'bg-blue-500' },
                { label: 'Ссылка', value: typeCounts.link, color: 'bg-green-500' },
                { label: 'Файл', value: typeCounts.file, color: 'bg-purple-500' }
              ].map(stat => (
                <div key={stat.label}>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <span className="font-semibold">{stat.value}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${stat.color} transition-all`}
                      style={{ width: `${memories?.length ? (stat.value / memories.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Plus, TrendingUp, Tag, Calendar, Layers, FileText, LinkIcon, FileArchive, ArrowRight, Sparkles } from "lucide-react";
import { useMemories, useCreateMemory } from "@/hooks/use-memories";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

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

  const typeData = [
    { label: 'Текст', value: typeCounts.text, icon: FileText, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
    { label: 'Ссылки', value: typeCounts.link, icon: LinkIcon, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Файлы', value: typeCounts.file, icon: FileArchive, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' }
  ];

  return (
    <div className="max-w-7xl mx-auto p-5 md:p-8 lg:p-10 space-y-8">
      <motion.div variants={container} initial="hidden" animate="show">
        <motion.div variants={item} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight" data-testid="text-dashboard-title">Добро пожаловать</h1>
            <Sparkles className="w-6 h-6 text-primary animate-pulse-slow" />
          </div>
          <p className="text-muted-foreground">Обзор вашей памяти в одном месте</p>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="p-5 border-border/30 bg-card stat-card card-hover" data-testid="card-stat-total">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Всего</p>
                <p className="text-4xl font-bold text-foreground mt-1.5 tabular-nums">{memories?.length || 0}</p>
                <p className="text-[11px] text-muted-foreground mt-1">воспоминаний</p>
              </div>
              <div className="bg-gradient-to-br from-primary/15 to-purple-500/15 p-3 rounded-2xl">
                <Layers className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-5 border-border/30 bg-card stat-card card-hover" data-testid="card-stat-week">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Неделя</p>
                <p className="text-4xl font-bold text-foreground mt-1.5 tabular-nums">{thisWeekCount}</p>
                <p className="text-[11px] text-muted-foreground mt-1">новых записей</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500/15 to-green-500/15 p-3 rounded-2xl">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </Card>

          <Card className="p-5 border-border/30 bg-card stat-card card-hover" data-testid="card-stat-tags">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Топ тег</p>
                <p className="text-2xl font-bold text-foreground mt-1.5 truncate max-w-[140px]">
                  {topTags.length > 0 ? `#${topTags[0][0]}` : "—"}
                </p>
                {topTags.length > 0 && <p className="text-[11px] text-muted-foreground mt-1">{topTags[0][1]} воспоминаний</p>}
              </div>
              <div className="bg-gradient-to-br from-amber-500/15 to-orange-500/15 p-3 rounded-2xl">
                <Tag className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold" data-testid="text-recent-title">Недавние воспоминания</h2>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-1.5" data-testid="link-view-all">
              <Link href="/library">Смотреть все <ArrowRight className="w-3.5 h-3.5" /></Link>
            </Button>
          </div>
          
          {isLoading ? (
            <div className="space-y-2.5">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-[72px] bg-card border border-border/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentMemories.length > 0 ? (
            <div className="space-y-2">
              {recentMemories.map((memory, idx) => (
                <motion.div key={memory.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: idx * 0.05 }}>
                  <Link href={`/memory/${memory.id}`} className="block" data-testid={`link-recent-${memory.id}`}>
                    <div className="p-4 bg-card border border-border/30 rounded-xl hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all cursor-pointer group">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`shrink-0 p-2 rounded-lg ${memory.type === 'link' ? 'bg-emerald-500/10 text-emerald-500' : memory.type === 'file' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                            {memory.type === 'link' ? <LinkIcon className="w-3.5 h-3.5" /> : memory.type === 'file' ? <FileArchive className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-medium text-sm group-hover:text-primary transition-colors truncate" data-testid={`text-recent-title-${memory.id}`}>{memory.title}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{memory.summary || memory.content.slice(0, 80)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {memory.tags.slice(0, 1).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 hidden sm:flex">{tag}</Badge>
                          ))}
                          <span className="text-[11px] text-muted-foreground">{format(new Date(memory.createdAt), 'd MMM', { locale: ru })}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-card/50 border border-border/30 rounded-2xl border-dashed">
              <Layers className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Нет воспоминаний</p>
              <Button asChild className="rounded-xl" data-testid="button-create-first"><Link href="/capture">Создать первое</Link></Button>
            </div>
          )}

          <Card className="p-5 border-border/30 bg-card" data-testid="card-by-type">
            <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">По типам</h3>
            <div className="grid grid-cols-3 gap-3">
              {typeData.map(stat => (
                <div key={stat.label} className={`${stat.bg} rounded-xl p-4 text-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.text} mx-auto mb-2`} />
                  <p className="text-2xl font-bold tabular-nums" data-testid={`text-type-count-${stat.label}`}>{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="space-y-5">
          <Card className="p-5 border-border/30 bg-card" data-testid="card-quick-add">
            <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Быстрое добавление</h3>
            <form onSubmit={handleQuickCapture} className="space-y-3">
              <Input 
                placeholder="Заголовок..." 
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="bg-muted/40 border-border/30 rounded-xl h-10 text-sm"
                data-testid="input-quick-title"
              />
              <Textarea 
                placeholder="Содержимое..." 
                value={quickContent}
                onChange={(e) => setQuickContent(e.target.value)}
                className="bg-muted/40 border-border/30 min-h-[72px] resize-none rounded-xl text-sm"
                data-testid="input-quick-content"
              />
              <Button 
                type="submit" 
                className="w-full rounded-xl h-9 text-sm" 
                disabled={!quickTitle.trim() || createMemory.isPending}
                data-testid="button-quick-save"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                {createMemory.isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </form>
          </Card>

          <Card className="p-5 border-border/30 bg-card" data-testid="card-popular-tags">
            <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Популярные теги</h3>
            {topTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {topTags.slice(0, 8).map(([tag, count]) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors text-xs px-2.5 py-1 rounded-lg" data-testid={`badge-tag-${tag}`}>
                    #{tag} <span className="ml-1 text-[10px] opacity-60">{count}</span>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Нет тегов</p>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

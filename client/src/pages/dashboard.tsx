import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Plus, TrendingUp, Tag, Layers, FileText, LinkIcon, FileArchive, ArrowRight, Sparkles, Zap, Clock } from "lucide-react";
import { useMemories, useCreateMemory } from "@/hooks/use-memories";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } }
};

function WeekActivity({ memories }: { memories: { createdAt: string }[] }) {
  const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
  const counts = days.map(d => memories.filter(m => isSameDay(new Date(m.createdAt), d)).length);
  const max = Math.max(...counts, 1);

  return (
    <div className="flex items-end gap-1.5 h-10">
      {days.map((d, i) => {
        const h = Math.max(4, (counts[i] / max) * 40);
        const isToday = i === 6;
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div
              className={`w-full rounded-sm transition-all duration-500 ${isToday ? "bg-primary" : counts[i] > 0 ? "bg-primary/40" : "bg-border/60"}`}
              style={{ height: `${h}px` }}
              title={`${format(d, "d MMM", { locale: ru })}: ${counts[i]}`}
            />
          </div>
        );
      })}
    </div>
  );
}

function TypeBar({ label, value, total, color, bg, text, Icon }: {
  label: string; value: number; total: number;
  color: string; bg: string; text: string; Icon: React.ElementType;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`${bg} p-1.5 rounded-md`}>
            <Icon className={`w-3 h-3 ${text}`} />
          </div>
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{pct}%</span>
          <span className="text-sm font-bold tabular-nums w-6 text-right">{value}</span>
        </div>
      </div>
      <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
        />
      </div>
    </div>
  );
}

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
      await createMemory.mutateAsync({ title: quickTitle, content: quickContent, type: "text", tags: [] });
      toast({ title: "Сохранено", description: "Воспоминание добавлено в базу" });
      setQuickTitle("");
      setQuickContent("");
    } catch {
      toast({ title: "Ошибка", description: "Не удалось сохранить", variant: "destructive" });
    }
  };

  const total = memories?.length || 0;
  const recentMemories = memories?.slice(0, 5) || [];
  const thisWeekCount = memories?.filter(m => {
    return new Date(m.createdAt) >= subDays(new Date(), 7);
  }).length || 0;

  const tagCounts: Record<string, number> = {};
  memories?.forEach(m => m.tags.forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; }));
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const typeCounts = {
    text: memories?.filter(m => m.type === "text").length || 0,
    link: memories?.filter(m => m.type === "link").length || 0,
    file: memories?.filter(m => m.type === "file").length || 0,
  };

  const typeData = [
    { label: "Текст", value: typeCounts.text, Icon: FileText, color: "from-blue-500 to-blue-600", bg: "bg-blue-500/10", text: "text-blue-500" },
    { label: "Ссылки", value: typeCounts.link, Icon: LinkIcon, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-500/10", text: "text-emerald-500" },
    { label: "Файлы", value: typeCounts.file, Icon: FileArchive, color: "from-amber-500 to-amber-600", bg: "bg-amber-500/10", text: "text-amber-500" },
  ];

  return (
    <div className="max-w-7xl mx-auto p-5 md:p-8 lg:p-10 space-y-8">
      <motion.div variants={container} initial="hidden" animate="show">

        <motion.div variants={item} className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="section-label mb-2">Панель управления</p>
              <div className="flex items-center gap-2.5 mb-1.5">
                <h1 className="text-3xl md:text-[2rem] font-bold tracking-tight" data-testid="text-dashboard-title">
                  Добро пожаловать
                </h1>
                <Sparkles className="w-5 h-5 text-primary animate-pulse-slow" />
              </div>
              <p className="meta-text">Ваша персональная база знаний под контролем</p>
            </div>
            <Button asChild className="hidden md:flex rounded-xl h-9 text-sm gap-1.5 shadow-lg shadow-primary/20" data-testid="button-new-memory">
              <Link href="/capture"><Plus className="w-4 h-4" />Новое</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="p-5 stat-card card-hover relative overflow-hidden shadow-sm shadow-black/[0.04] dark:shadow-black/[0.2] border-border/50" data-testid="card-stat-total">
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/40 via-primary to-purple-500/40" />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="section-label">Всего</p>
                <p className="text-4xl font-bold text-foreground mt-1.5 tabular-nums">{total}</p>
                <p className="meta-text mt-1">воспоминаний в базе</p>
              </div>
              <div className="bg-gradient-to-br from-primary/15 to-purple-500/15 p-3 rounded-2xl">
                <Layers className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-5 stat-card card-hover relative overflow-hidden shadow-sm shadow-black/[0.04] dark:shadow-black/[0.2] border-border/50" data-testid="card-stat-week">
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500/40 via-emerald-500 to-green-500/40" />
            <div className="flex items-center justify-between relative z-10 mb-3">
              <div>
                <p className="section-label">Неделя</p>
                <p className="text-4xl font-bold text-foreground mt-1.5 tabular-nums">{thisWeekCount}</p>
                <p className="meta-text mt-1">новых записей</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500/15 to-green-500/15 p-3 rounded-2xl">
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
            <WeekActivity memories={memories || []} />
          </Card>

          <Card className="p-5 stat-card card-hover relative overflow-hidden shadow-sm shadow-black/[0.04] dark:shadow-black/[0.2] border-border/50" data-testid="card-stat-tags">
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/40 via-amber-500 to-orange-500/40" />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="section-label">Топ тег</p>
                <p className="text-2xl font-bold text-foreground mt-1.5 truncate max-w-[140px]">
                  {topTags.length > 0 ? `#${topTags[0][0]}` : "—"}
                </p>
                {topTags.length > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-1">{topTags[0][1]} воспоминаний</p>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {topTags.slice(1, 3).map(([tag]) => (
                    <span key={tag} className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">#{tag}</span>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-500/15 to-orange-500/15 p-3 rounded-2xl">
                <Tag className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-2 space-y-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-base font-semibold" data-testid="text-recent-title">Недавние воспоминания</h2>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-primary gap-1.5 text-xs h-7" data-testid="link-view-all">
              <Link href="/library">Все записи <ArrowRight className="w-3 h-3" /></Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-card border border-border/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentMemories.length > 0 ? (
            <div className="space-y-1.5">
              {recentMemories.map((memory, idx) => (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.28, delay: idx * 0.05 }}
                >
                  <Link href={`/memory/${memory.id}`} className="block" data-testid={`link-recent-${memory.id}`}>
                    <div className="flex items-center gap-3 p-3.5 bg-card border border-border/30 rounded-xl hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all group relative overflow-hidden">
                      <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${memory.type === "link" ? "bg-emerald-500" : memory.type === "file" ? "bg-amber-500" : "bg-blue-500"}`} />
                      <div className={`shrink-0 p-2 rounded-lg ${memory.type === "link" ? "bg-emerald-500/10 text-emerald-500" : memory.type === "file" ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"}`}>
                        {memory.type === "link" ? <LinkIcon className="w-3.5 h-3.5" /> : memory.type === "file" ? <FileArchive className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm group-hover:text-primary transition-colors truncate" data-testid={`text-recent-title-${memory.id}`}>{memory.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{memory.summary || memory.content.slice(0, 90)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {memory.tags.slice(0, 1).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 hidden sm:flex">{tag}</Badge>
                        ))}
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">{format(new Date(memory.createdAt), "d MMM", { locale: ru })}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-card/50 border border-border/30 rounded-2xl border-dashed">
              <Layers className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4 text-sm">Нет воспоминаний. Начните прямо сейчас.</p>
              <Button asChild className="rounded-xl h-9 text-sm" data-testid="button-create-first">
                <Link href="/capture"><Plus className="w-3.5 h-3.5 mr-1.5" />Создать первое</Link>
              </Button>
            </div>
          )}

          <Card className="p-5 shadow-sm shadow-black/[0.04] dark:shadow-black/[0.2] border-border/50" data-testid="card-by-type">
            <div className="flex items-center justify-between mb-5">
              <h3 className="section-label">Распределение по типам</h3>
              <span className="meta-text">{total} записей</span>
            </div>
            <div className="space-y-3.5">
              {typeData.map(stat => (
                <TypeBar key={stat.label} {...stat} total={total} />
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="space-y-5"
        >
          <Card className="overflow-hidden shadow-sm shadow-black/[0.04] dark:shadow-black/[0.2] border-border/50" data-testid="card-quick-add">
            <div className="h-0.5 bg-gradient-to-r from-primary via-purple-500 to-primary/0" />
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Быстрое добавление</h3>
              </div>
              <form onSubmit={handleQuickCapture} className="space-y-3">
                <Input
                  placeholder="Заголовок..."
                  value={quickTitle}
                  onChange={e => setQuickTitle(e.target.value)}
                  className="bg-muted/40 border-border/30 rounded-xl h-10 text-sm focus-visible:ring-primary/30"
                  data-testid="input-quick-title"
                />
                <Textarea
                  placeholder="Содержимое..."
                  value={quickContent}
                  onChange={e => setQuickContent(e.target.value)}
                  className="bg-muted/40 border-border/30 min-h-[72px] resize-none rounded-xl text-sm focus-visible:ring-primary/30"
                  data-testid="input-quick-content"
                />
                <Button
                  type="submit"
                  className="w-full rounded-xl h-9 text-sm shadow-md shadow-primary/15"
                  disabled={!quickTitle.trim() || createMemory.isPending}
                  data-testid="button-quick-save"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  {createMemory.isPending ? "Сохранение..." : "Сохранить"}
                </Button>
              </form>
            </div>
          </Card>

          <Card className="p-5 shadow-sm shadow-black/[0.04] dark:shadow-black/[0.2] border-border/50" data-testid="card-popular-tags">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Популярные теги</h3>
            </div>
            {topTags.length > 0 ? (
              <div className="space-y-2">
                {topTags.slice(0, 8).map(([tag, count], idx) => {
                  const maxCount = topTags[0][1];
                  const pct = Math.round((count / maxCount) * 100);
                  return (
                    <div key={tag} className="flex items-center gap-2 group" data-testid={`badge-tag-${tag}`}>
                      <span className="text-xs text-muted-foreground w-4 shrink-0 tabular-nums">{idx + 1}</span>
                      <div className="flex-1 relative">
                        <div className="h-6 bg-muted/40 rounded-md overflow-hidden">
                          <motion.div
                            className="h-full bg-primary/10 rounded-md"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 + idx * 0.05 }}
                          />
                        </div>
                        <span className="absolute inset-y-0 left-2.5 flex items-center text-xs font-medium text-foreground">#{tag}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground tabular-nums w-4 text-right shrink-0">{count}</span>
                    </div>
                  );
                })}
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

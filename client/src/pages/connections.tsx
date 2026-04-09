import { useMemories } from "@/hooks/use-memories";
import { motion } from "framer-motion";
import { Network, Database, Hash, User, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function Connections() {
  const { data: memories, isLoading } = useMemories();

  const aggregated = {
    topics: new Map<string, number>(),
    people: new Map<string, number>(),
    tags: new Map<string, number>()
  };

  memories?.forEach(m => {
    m.tags?.forEach(t => aggregated.tags.set(t, (aggregated.tags.get(t) || 0) + 1));
    m.entities?.topics?.forEach(t => aggregated.topics.set(t, (aggregated.topics.get(t) || 0) + 1));
    m.entities?.people?.forEach(p => aggregated.people.set(p, (aggregated.people.get(p) || 0) + 1));
  });

  const getTopItems = (map: Map<string, number>) => {
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
  };

  const topTopics = getTopItems(aggregated.topics);
  const topPeople = getTopItems(aggregated.people);
  const topTags = getTopItems(aggregated.tags);

  return (
    <div className="max-w-7xl mx-auto p-5 md:p-10">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center max-w-2xl mx-auto pt-6">
        <div className="relative inline-block mb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-2xl blur-lg opacity-25" />
          <div className="relative inline-flex items-center justify-center p-3.5 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl border border-primary/15">
            <Network className="w-7 h-7 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-3" data-testid="text-connections-title">Связи Знаний</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Обзор ключевых тем, людей и тегов, извлеченных из ваших воспоминаний. 
          Это базовое визуальное представление вашего графа знаний.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Database className="w-8 h-8 animate-pulse text-muted-foreground/20" />
        </div>
      ) : memories?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border/30">
          <Globe className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Недостаточно данных для построения связей.</p>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          <motion.div variants={item} className="bg-card border border-border/30 rounded-2xl p-6 card-hover" data-testid="card-topics">
            <h2 className="text-sm font-semibold mb-5 flex items-center gap-2 pb-3.5 border-b border-border/30 uppercase tracking-wider text-muted-foreground">
              <div className="p-1.5 rounded-lg bg-blue-500/10">
                <Hash className="w-4 h-4 text-blue-500" />
              </div>
              Ключевые Темы
            </h2>
            <div className="flex flex-col gap-2.5">
              {topTopics.length > 0 ? topTopics.map(([topic, count], i) => (
                <div key={i} className="flex items-center justify-between group">
                  <span className="text-foreground text-sm font-medium truncate pr-3">{topic}</span>
                  <Badge variant="secondary" className="rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors text-[10px] px-2 font-semibold">
                    {count}
                  </Badge>
                </div>
              )) : <span className="text-muted-foreground text-xs">Нет извлеченных тем</span>}
            </div>
          </motion.div>

          <motion.div variants={item} className="bg-card border border-border/30 rounded-2xl p-6 card-hover" data-testid="card-people">
            <h2 className="text-sm font-semibold mb-5 flex items-center gap-2 pb-3.5 border-b border-border/30 uppercase tracking-wider text-muted-foreground">
              <div className="p-1.5 rounded-lg bg-purple-500/10">
                <User className="w-4 h-4 text-purple-500" />
              </div>
              Упомянутые Люди
            </h2>
            <div className="flex flex-wrap gap-2">
              {topPeople.length > 0 ? topPeople.map(([person, count], i) => (
                <div key={i} className="bg-muted/50 px-3 py-2 rounded-xl flex items-center gap-2 border border-border/30 hover:border-purple-500/30 transition-colors text-sm">
                  <span className="font-medium">{person}</span>
                  <span className="text-[10px] text-muted-foreground font-semibold bg-card px-1.5 py-0.5 rounded">x{count}</span>
                </div>
              )) : <span className="text-muted-foreground text-xs">Нет извлеченных людей</span>}
            </div>
          </motion.div>

          <motion.div variants={item} className="bg-card border border-border/30 rounded-2xl p-6 card-hover" data-testid="card-tags">
            <h2 className="text-sm font-semibold mb-5 flex items-center gap-2 pb-3.5 border-b border-border/30 uppercase tracking-wider text-muted-foreground">
              <div className="p-1.5 rounded-lg bg-amber-500/10">
                <Hash className="w-4 h-4 text-amber-500" />
              </div>
              Популярные Теги
            </h2>
            <div className="flex flex-wrap gap-2 relative">
              {topTags.length > 0 ? topTags.map(([tag, count], i) => (
                <div 
                  key={i} 
                  className="rounded-lg bg-secondary/70 text-secondary-foreground border border-border/30 flex items-center justify-center font-medium hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all cursor-default"
                  style={{ 
                    padding: `${0.3 + (count * 0.04)}rem ${0.6 + (count * 0.08)}rem`,
                    fontSize: `${0.75 + (count * 0.04)}rem`,
                  }}
                >
                  #{tag}
                </div>
              )) : <span className="text-muted-foreground text-xs">Нет тегов</span>}
            </div>
          </motion.div>

        </motion.div>
      )}
    </div>
  );
}

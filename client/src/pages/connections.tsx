import { useMemories } from "@/hooks/use-memories";
import { motion } from "framer-motion";
import { Network, Database, Hash, User, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Connections() {
  const { data: memories, isLoading } = useMemories();

  // Aggregate entities for a simple map view
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
    <div className="max-w-7xl mx-auto p-6 md:p-10">
      <div className="mb-10 text-center max-w-2xl mx-auto pt-8">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
          <Network className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-4">Связи Знаний</h1>
        <p className="text-muted-foreground">
          Обзор ключевых тем, людей и тегов, извлеченных из ваших воспоминаний. 
          Это базовое визуальное представление вашего графа знаний.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Database className="w-8 h-8 animate-pulse text-muted-foreground/30" />
        </div>
      ) : memories?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-border/50">
          <p className="text-muted-foreground">Недостаточно данных для построения связей.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 pb-4 border-b border-border/50">
              <Hash className="w-5 h-5 text-primary" />
              Ключевые Темы
            </h2>
            <div className="flex flex-col gap-3">
              {topTopics.length > 0 ? topTopics.map(([topic, count], i) => (
                <div key={i} className="flex items-center justify-between group">
                  <span className="text-foreground font-medium truncate pr-4">{topic}</span>
                  <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {count}
                  </Badge>
                </div>
              )) : <span className="text-muted-foreground text-sm">Нет извлеченных тем</span>}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 pb-4 border-b border-border/50">
              <User className="w-5 h-5 text-accent-foreground" />
              Упомянутые Люди
            </h2>
            <div className="flex flex-wrap gap-2">
              {topPeople.length > 0 ? topPeople.map(([person, count], i) => (
                <div key={i} className="bg-muted px-3 py-2 rounded-xl flex items-center gap-2 border border-border/50 hover:border-accent-foreground/30 transition-colors">
                  <span className="text-sm font-medium">{person}</span>
                  <span className="text-[10px] text-muted-foreground font-semibold bg-background px-1.5 rounded-md">x{count}</span>
                </div>
              )) : <span className="text-muted-foreground text-sm">Нет извлеченных людей</span>}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 pb-4 border-b border-border/50">
              <Hash className="w-5 h-5 text-muted-foreground" />
              Популярные Теги
            </h2>
            <div className="flex flex-wrap gap-3 relative">
              {topTags.length > 0 ? topTags.map(([tag, count], i) => (
                <div 
                  key={i} 
                  className="rounded-full bg-secondary text-secondary-foreground border border-border/50 flex items-center justify-center font-medium"
                  style={{ 
                    padding: `${0.25 + (count * 0.05)}rem ${0.75 + (count * 0.1)}rem`,
                    fontSize: `${0.8 + (count * 0.05)}rem`,
                    opacity: 1 - (i * 0.03)
                  }}
                >
                  #{tag}
                </div>
              )) : <span className="text-muted-foreground text-sm">Нет тегов</span>}
            </div>
          </motion.div>

        </div>
      )}
    </div>
  );
}

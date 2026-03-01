import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, Layers, LayoutGrid, List } from "lucide-react";
import { useMemories } from "@/hooks/use-memories";
import { MemoryCard } from "@/components/memory-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function Library() {
  const { data: memories, isLoading } = useMemories();
  const [filterType, setFilterType] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredMemories = memories?.filter(m => !filterType || m.type === filterType) || [];

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Ваша Библиотека</h1>
          <p className="text-muted-foreground">
            {isLoading ? "Загрузка..." : `Всего ${memories?.length || 0} воспоминаний сохранено.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-muted/50 p-1 rounded-xl">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setFilterType(null)}
              className={`rounded-lg ${!filterType ? 'bg-background shadow-sm' : ''}`}
            >
              Все
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setFilterType('text')}
              className={`rounded-lg ${filterType === 'text' ? 'bg-background shadow-sm' : ''}`}
            >
              Тексты
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setFilterType('link')}
              className={`rounded-lg ${filterType === 'link' ? 'bg-background shadow-sm' : ''}`}
            >
              Ссылки
            </Button>
          </div>
          <div className="h-8 w-px bg-border/50 mx-1 hidden sm:block"></div>
          <div className="hidden sm:flex bg-muted/50 p-1 rounded-xl">
            <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-lg ${viewMode === 'grid' ? 'bg-background shadow-sm' : ''}`} onClick={() => setViewMode('grid')}>
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-lg ${viewMode === 'list' ? 'bg-background shadow-sm' : ''}`} onClick={() => setViewMode('list')}>
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 max-w-4xl'}`}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-5 border border-border/50 h-56 flex flex-col">
              <div className="flex justify-between mb-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-6 w-3/4 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
              <div className="mt-auto flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredMemories.length > 0 ? (
        <motion.div 
          layout
          className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 max-w-4xl'}`}
        >
          <AnimatePresence mode="popLayout">
            {filteredMemories.map((memory) => (
              <motion.div
                key={memory.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <MemoryCard memory={memory} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-3xl border border-border/50 border-dashed">
          <Layers className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">Здесь пока пусто</h3>
          <p className="text-muted-foreground mb-6">Добавьте свое первое воспоминание, чтобы начать собирать базу знаний.</p>
          <Button asChild>
            <a href="/capture">Добавить воспоминание</a>
          </Button>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Layers, LayoutGrid, List, Library as LibIcon } from "lucide-react";
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
    <div className="max-w-7xl mx-auto p-5 md:p-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <LibIcon className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-library-title">Ваша Библиотека</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-[34px]">
            {isLoading ? "Загрузка..." : `${memories?.length || 0} воспоминаний сохранено`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-muted/40 p-1 rounded-xl border border-border/30">
            {[
              { value: null, label: "Все" },
              { value: "text", label: "Тексты" },
              { value: "link", label: "Ссылки" },
            ].map(btn => (
              <Button 
                key={btn.label}
                variant="ghost" 
                size="sm" 
                onClick={() => setFilterType(btn.value)}
                className={`rounded-lg text-xs font-medium h-8 ${filterType === btn.value ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
                data-testid={`button-filter-${btn.label}`}
              >
                {btn.label}
              </Button>
            ))}
          </div>
          <div className="h-6 w-px bg-border/30 mx-0.5 hidden sm:block" />
          <div className="hidden sm:flex bg-muted/40 p-1 rounded-xl border border-border/30">
            <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-lg ${viewMode === 'grid' ? 'bg-card shadow-sm' : ''}`} onClick={() => setViewMode('grid')} data-testid="button-view-grid">
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-lg ${viewMode === 'list' ? 'bg-card shadow-sm' : ''}`} onClick={() => setViewMode('list')} data-testid="button-view-list">
              <List className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 max-w-4xl'}`}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-5 border border-border/30 h-52 flex flex-col">
              <div className="flex justify-between mb-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-5 w-16 rounded-lg" />
              </div>
              <Skeleton className="h-5 w-3/4 mb-2 rounded" />
              <Skeleton className="h-4 w-full mb-1.5 rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <div className="mt-auto flex gap-2 pt-3">
                <Skeleton className="h-5 w-14 rounded" />
                <Skeleton className="h-5 w-18 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredMemories.length > 0 ? (
        <motion.div 
          layout
          className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 max-w-4xl'}`}
        >
          <AnimatePresence mode="popLayout">
            {filteredMemories.map((memory) => (
              <motion.div
                key={memory.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <MemoryCard memory={memory} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="text-center py-20 bg-card/50 rounded-2xl border border-border/30 border-dashed">
          <Layers className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <h3 className="text-lg font-medium mb-2">Здесь пока пусто</h3>
          <p className="text-muted-foreground text-sm mb-5">Добавьте свое первое воспоминание, чтобы начать собирать базу знаний.</p>
          <Button asChild className="rounded-xl" data-testid="button-add-first">
            <Link href="/capture">Добавить воспоминание</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useMemories } from "@/hooks/use-memories";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MemoryCard } from "@/components/memory-card";
import { Tag, Search, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface TagEntry {
  name: string;
  count: number;
}

const TAG_COLORS = [
  "bg-blue-500/12 text-blue-700 dark:text-blue-300 border-blue-500/20",
  "bg-purple-500/12 text-purple-700 dark:text-purple-300 border-purple-500/20",
  "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  "bg-orange-500/12 text-orange-700 dark:text-orange-300 border-orange-500/20",
  "bg-pink-500/12 text-pink-700 dark:text-pink-300 border-pink-500/20",
  "bg-cyan-500/12 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
  "bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-500/20",
  "bg-red-500/12 text-red-700 dark:text-red-300 border-red-500/20",
];

export default function Tags() {
  const { data: memories = [], isLoading } = useMemories();
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = useMemo<TagEntry[]>(() => {
    const counts: Record<string, number> = {};
    memories.forEach(m => {
      m.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [memories]);

  const filteredTags = useMemo(() =>
    allTags.filter(t => t.name.toLowerCase().includes(search.toLowerCase())),
    [allTags, search]
  );

  const memoriesForTag = useMemo(() =>
    selectedTag ? memories.filter(m => m.tags.includes(selectedTag)) : [],
    [memories, selectedTag]
  );

  const maxCount = allTags[0]?.count || 1;
  const getColor = (idx: number) => TAG_COLORS[idx % TAG_COLORS.length];

  return (
    <div className="max-w-7xl mx-auto p-5 md:p-10">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-1">
            <Tag className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-tags-title">Теги</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-[34px]">
            {allTags.length > 0
              ? `${allTags.length} уникальных тегов из ${memories.length} воспоминаний`
              : "Нет тегов"}
          </p>
        </div>
      </motion.div>

      {selectedTag ? (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Button variant="outline" onClick={() => setSelectedTag(null)} className="gap-1.5 rounded-xl h-9 text-xs border-border/30" data-testid="button-back-tags">
              <ArrowLeft className="w-3.5 h-3.5" />
              Все теги
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm px-3 py-1.5 rounded-lg font-medium" data-testid="badge-selected-tag">#{selectedTag}</Badge>
              <span className="text-muted-foreground text-xs">{memoriesForTag.length} воспоминаний</span>
            </div>
          </div>

          {memoriesForTag.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {memoriesForTag.map(memory => (
                <MemoryCard key={memory.id} memory={memory} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-card border border-border/30 rounded-2xl">
              <p className="text-muted-foreground text-sm">Нет воспоминаний с этим тегом</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 inset-y-0 my-auto w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по тегам..."
              className="pl-10 pr-10 bg-card border-border/30 rounded-xl h-10 text-sm"
              data-testid="input-tag-search"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 inset-y-0 my-auto text-muted-foreground hover:text-foreground transition-colors" data-testid="button-clear-tag-search">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-[88px] bg-card border border-border/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredTags.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                <AnimatePresence>
                  {filteredTags.map((tag, idx) => (
                    <motion.button
                      key={tag.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15, delay: idx * 0.02 }}
                      onClick={() => setSelectedTag(tag.name)}
                      className={`p-3.5 rounded-xl border text-left hover:scale-[1.03] active:scale-100 transition-all cursor-pointer ${getColor(idx)}`}
                      data-testid={`button-tag-${tag.name}`}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <Tag className="w-3.5 h-3.5 opacity-60" />
                        <span className="text-[10px] font-bold opacity-60">{tag.count}</span>
                      </div>
                      <p className="font-semibold text-xs truncate">#{tag.name}</p>
                      <div className="mt-2 h-1 bg-current/15 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-current/40 rounded-full"
                          style={{ width: `${(tag.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>

              <div className="bg-card border border-border/30 rounded-xl p-5">
                <h2 className="text-[10px] font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Рейтинг тегов</h2>
                <div className="space-y-2.5">
                  {filteredTags.slice(0, 10).map((tag, idx) => (
                    <div key={tag.name} className="flex items-center gap-3 group">
                      <span className="text-muted-foreground text-[10px] w-4 text-right shrink-0 font-mono">{idx + 1}</span>
                      <button
                        onClick={() => setSelectedTag(tag.name)}
                        className="font-medium hover:text-primary transition-colors text-xs"
                        data-testid={`link-tag-rank-${tag.name}`}
                      >
                        #{tag.name}
                      </button>
                      <div className="flex-1 h-1 bg-muted/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/50 rounded-full transition-all"
                          style={{ width: `${(tag.count / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-mono">{tag.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-card border border-border/30 rounded-2xl">
              {search ? (
                <>
                  <Tag className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Теги не найдены: «{search}»</p>
                </>
              ) : (
                <>
                  <Tag className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm mb-4">У ваших воспоминаний нет тегов</p>
                  <Button asChild className="rounded-xl" data-testid="button-add-first-tag">
                    <Link href="/capture">Добавить первое воспоминание с тегом</Link>
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

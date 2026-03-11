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

  // Color palette for tags (cycles)
  const TAG_COLORS = [
    "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
    "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30",
    "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30",
    "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30",
    "bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-500/30",
    "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
    "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30",
    "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30",
  ];
  const getColor = (idx: number) => TAG_COLORS[idx % TAG_COLORS.length];

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Теги</h1>
        <p className="text-muted-foreground">
          {allTags.length > 0
            ? `${allTags.length} уникальных тегов из ${memories.length} воспоминаний`
            : "Нет тегов"}
        </p>
      </div>

      {selectedTag ? (
        /* ── Filtered view for a specific tag ── */
        <div>
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" onClick={() => setSelectedTag(null)} className="gap-2 rounded-xl">
              <ArrowLeft className="w-4 h-4" />
              Все теги
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-base px-4 py-2 rounded-xl">#{selectedTag}</Badge>
              <span className="text-muted-foreground text-sm">{memoriesForTag.length} воспоминаний</span>
            </div>
          </div>

          {memoriesForTag.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {memoriesForTag.map(memory => (
                <MemoryCard key={memory.id} memory={memory} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card border border-border/50 rounded-3xl">
              <p className="text-muted-foreground">Нет воспоминаний с этим тегом</p>
            </div>
          )}
        </div>
      ) : (
        /* ── Main tags view ── */
        <div className="space-y-8">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 inset-y-0 my-auto w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по тегам..."
              className="pl-10 pr-10 bg-card border-border/60 rounded-xl"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 inset-y-0 my-auto text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-20 bg-card border border-border/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredTags.length > 0 ? (
            <>
              {/* Tag cloud grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                <AnimatePresence>
                  {filteredTags.map((tag, idx) => (
                    <motion.button
                      key={tag.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.15, delay: idx * 0.03 }}
                      onClick={() => setSelectedTag(tag.name)}
                      className={`p-4 rounded-xl border text-left hover:scale-105 active:scale-100 transition-all cursor-pointer ${getColor(idx)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Tag className="w-4 h-4 opacity-70" />
                        <span className="text-xs font-semibold opacity-70">{tag.count}</span>
                      </div>
                      <p className="font-semibold text-sm truncate">#{tag.name}</p>
                      {/* Usage bar */}
                      <div className="mt-2 h-1 bg-current/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-current/50 rounded-full"
                          style={{ width: `${(tag.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>

              {/* Top tags by frequency */}
              <div className="bg-card border border-border/50 rounded-2xl p-6">
                <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Рейтинг тегов</h2>
                <div className="space-y-3">
                  {filteredTags.slice(0, 10).map((tag, idx) => (
                    <div key={tag.name} className="flex items-center gap-4 group">
                      <span className="text-muted-foreground text-xs w-5 text-right shrink-0">{idx + 1}</span>
                      <button
                        onClick={() => setSelectedTag(tag.name)}
                        className="font-medium hover:text-primary transition-colors text-sm"
                      >
                        #{tag.name}
                      </button>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/60 rounded-full transition-all"
                          style={{ width: `${(tag.count / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{tag.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 bg-card border border-border/50 rounded-3xl">
              {search ? (
                <>
                  <Tag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Теги не найдены: «{search}»</p>
                </>
              ) : (
                <>
                  <Tag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">У ваших воспоминаний нет тегов</p>
                  <Button asChild>
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

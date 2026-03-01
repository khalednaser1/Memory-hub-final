import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search as SearchIcon, Brain, TextSearch, Loader2 } from "lucide-react";
import { useSearchMemories } from "@/hooks/use-memories";
import { MemoryCard } from "@/components/memory-card";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function Search() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [mode, setMode] = useState<'semantic' | 'keyword'>('semantic');

  // Simple debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 2) {
        setDebouncedQuery(query.trim());
      } else {
        setDebouncedQuery("");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: searchData, isLoading, isFetching } = useSearchMemories(debouncedQuery, mode);

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 min-h-full flex flex-col">
      <div className="max-w-2xl mx-auto w-full mb-12 text-center pt-8 md:pt-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">Интеллектуальный Поиск</h1>
        
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-focus-within:bg-primary/30 transition-all duration-500 opacity-50"></div>
          <div className="relative flex items-center bg-card border-2 border-border/80 rounded-2xl overflow-hidden shadow-sm focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all">
            <SearchIcon className="w-6 h-6 text-muted-foreground ml-6" />
            <Input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Опишите, что вы ищете (например, 'статья про дизайн интерфейсов')..."
              className="h-16 border-0 shadow-none focus-visible:ring-0 text-lg px-4 bg-transparent"
            />
            {isFetching && (
              <Loader2 className="w-5 h-5 text-primary animate-spin mr-6" />
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <ToggleGroup type="single" value={mode} onValueChange={(v) => v && setMode(v as any)} className="bg-muted/50 p-1 rounded-xl">
            <ToggleGroupItem value="semantic" aria-label="Смысловой поиск" className="rounded-lg px-4 flex gap-2 data-[state=on]:bg-background data-[state=on]:shadow-sm data-[state=on]:text-primary transition-all">
              <Brain className="w-4 h-4" />
              По смыслу
            </ToggleGroupItem>
            <ToggleGroupItem value="keyword" aria-label="По ключевым словам" className="rounded-lg px-4 flex gap-2 data-[state=on]:bg-background data-[state=on]:shadow-sm transition-all">
              <TextSearch className="w-4 h-4" />
              По словам
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="flex-1">
        {debouncedQuery ? (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-medium text-muted-foreground">
                Результаты для "{debouncedQuery}"
              </h2>
              {searchData?.results && (
                <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  Найдено: {searchData.results.length}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-card rounded-2xl p-6 border border-border/50 h-40 animate-pulse flex flex-col gap-4">
                    <div className="h-6 bg-muted rounded w-1/3"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : searchData?.results && searchData.results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchData.results.map((result, idx) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                  >
                    <MemoryCard memory={result} highlightReason={mode === 'semantic'} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <SearchIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-foreground mb-2">Ничего не найдено</h3>
                <p className="text-muted-foreground">Попробуйте изменить запрос или режим поиска.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-60 mt-10">
            <Brain className="w-16 h-16 text-muted-foreground/50 mb-6" />
            <h3 className="text-xl font-medium mb-2 text-balance">Начните вводить текст для поиска</h3>
            <p className="text-muted-foreground max-w-md">
              Смысловой поиск позволяет находить связанные идеи даже если вы не помните точных слов.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

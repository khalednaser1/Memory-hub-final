import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Search as SearchIcon, Brain, TextSearch, Loader2, FileText, Link as LinkIcon, Hash, Calendar, ExternalLink, ArrowRight, Sparkles } from "lucide-react";
import { useSearchMemories, useMemories } from "@/hooks/use-memories";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { MemoryResponse, SearchResult as SchemaSearchResult } from "@shared/schema";

type SearchResult = MemoryResponse & { relevanceScore?: number; matchReason?: string };

const SCORE_BADGES: Record<string, { label: string; cls: string }> = {
  "Точное совпадение": { label: "Точный", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25" },
  "Синонимы":          { label: "Синоним", cls: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25" },
  "Теги":              { label: "Тег", cls: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/25" },
};

function getMatchBadges(reason?: string) {
  if (!reason) return [];
  return reason.split(" + ").map(r => SCORE_BADGES[r] || { label: r, cls: "bg-muted text-muted-foreground border-border" });
}

function ResultItem({ result, selected, onClick }: { result: SearchResult; selected: boolean; onClick: () => void }) {
  const Icon = result.type === "link" ? LinkIcon : FileText;
  const badges = getMatchBadges(result.matchReason);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
        selected
          ? "border-primary/40 bg-primary/5 shadow-sm shadow-primary/5"
          : "border-border/30 bg-card hover:border-primary/20 hover:shadow-sm"
      }`}
      data-testid={`button-result-${result.id}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg shrink-0 transition-colors ${selected ? "bg-primary/15 text-primary" : "bg-muted/60 text-muted-foreground"}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className={`font-semibold text-sm truncate ${selected ? "text-primary" : "text-foreground"}`} data-testid={`text-result-title-${result.id}`}>
              {result.title}
            </h3>
            {result.relevanceScore !== undefined && (
              <span className="text-[10px] font-mono text-muted-foreground shrink-0 bg-muted/60 px-1.5 py-0.5 rounded">
                {Math.round(result.relevanceScore * 100)}%
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
            {result.summary || result.content}
          </p>
          <div className="flex flex-wrap gap-1">
            {badges.map((b, i) => (
              <span key={i} className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${b.cls}`}>
                {b.label}
              </span>
            ))}
            {result.tags.slice(0, 2).map(tag => (
              <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-secondary/60 text-secondary-foreground">
                <Hash className="w-2.5 h-2.5" />{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

function PreviewPanel({ memory }: { memory: SearchResult }) {
  return (
    <motion.div
      key={memory.id}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="h-full overflow-y-auto"
    >
      <div className="p-6 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="text-xs rounded-lg">
              {memory.type === "text" ? "Заметка" : memory.type === "link" ? "Ссылка" : "Файл"}
            </Badge>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(memory.createdAt), "d MMM yyyy", { locale: ru })}
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1" data-testid="text-preview-title">{memory.title}</h2>
          {memory.matchReason && (
            <div className="flex flex-wrap gap-1 mt-2">
              {getMatchBadges(memory.matchReason).map((b, i) => (
                <span key={i} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${b.cls}`}>
                  {b.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {memory.summary && (
          <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-primary mb-1.5 uppercase tracking-wider flex items-center gap-1"><Sparkles className="w-3 h-3" />AI Выжимка</p>
            <p className="text-sm text-foreground/90 leading-relaxed">{memory.summary}</p>
          </div>
        )}

        <div className="bg-muted/30 border border-border/30 rounded-xl p-4">
          <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Содержимое</p>
          {memory.type === "link" ? (
            <a href={memory.content} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-sm break-all">
              {memory.content} <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          ) : (
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap line-clamp-10">{memory.content}</p>
          )}
        </div>

        {memory.tags.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Теги</p>
            <div className="flex flex-wrap gap-1.5">
              {memory.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs rounded-lg">#{tag}</Badge>
              ))}
            </div>
          </div>
        )}

        {(memory.entities?.people?.length > 0 || memory.entities?.topics?.length > 0) && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Сущности</p>
            <div className="flex flex-wrap gap-1">
              {memory.entities.people?.map((p: string) => (
                <Badge key={p} variant="outline" className="text-xs rounded-lg">{p}</Badge>
              ))}
              {memory.entities.topics?.map((t: string) => (
                <Badge key={t} variant="outline" className="text-xs text-muted-foreground rounded-lg">{t}</Badge>
              ))}
            </div>
          </div>
        )}

        <Link href={`/memory/${memory.id}`} className="block" data-testid="link-open-full">
          <div className="flex items-center justify-between p-3 bg-muted/40 hover:bg-muted/60 rounded-xl transition-colors group cursor-pointer border border-border/30">
            <span className="text-sm font-medium">Открыть полную карточку</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </Link>
      </div>
    </motion.div>
  );
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [mode, setMode] = useState<"semantic" | "keyword">("semantic");
  const [selected, setSelected] = useState<SearchResult | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim().length > 2 ? query.trim() : "");
    }, 450);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: searchData, isLoading, isFetching } = useSearchMemories(debouncedQuery, mode);
  const results: SearchResult[] = searchData?.results || [];

  useEffect(() => {
    if (results.length > 0 && (!selected || !results.find(r => r.id === selected.id))) {
      setSelected(results[0]);
    }
    if (results.length === 0) setSelected(null);
  }, [results]);

  return (
    <div className="h-[calc(100vh-2rem)] md:h-screen flex flex-col p-4 md:p-6 gap-4">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <SearchIcon className="w-5 h-5 text-muted-foreground" />
          </div>
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Опишите, что вы ищете..."
            className="pl-12 pr-12 h-12 text-sm bg-card border-border/30 focus-visible:ring-primary/30 rounded-xl shadow-sm"
            data-testid="input-search"
          />
          {isFetching && (
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          )}
        </div>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={v => v && setMode(v as "semantic" | "keyword")}
          className="bg-muted/40 p-1 rounded-xl shrink-0 border border-border/30"
        >
          <ToggleGroupItem value="semantic" className="rounded-lg px-3 gap-1.5 data-[state=on]:bg-card data-[state=on]:shadow-sm data-[state=on]:text-primary text-xs font-medium" data-testid="button-mode-semantic">
            <Brain className="w-3.5 h-3.5" />По смыслу
          </ToggleGroupItem>
          <ToggleGroupItem value="keyword" className="rounded-lg px-3 gap-1.5 data-[state=on]:bg-card data-[state=on]:shadow-sm text-xs font-medium" data-testid="button-mode-keyword">
            <TextSearch className="w-3.5 h-3.5" />По словам
          </ToggleGroupItem>
        </ToggleGroup>
      </motion.div>

      {debouncedQuery && !isLoading && (
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground" data-testid="text-results-count">
            {results.length > 0
              ? `Найдено ${results.length} результат(ов) для «${debouncedQuery}»`
              : `Ничего не найдено для «${debouncedQuery}»`}
          </p>
        </div>
      )}

      <div className="flex-1 min-h-0 flex gap-4">
        <div className="w-full md:w-[42%] flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {!debouncedQuery ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <div className="bg-primary/5 p-5 rounded-3xl mb-5">
                  <Brain className="w-10 h-10 text-primary/30" />
                </div>
                <p className="text-muted-foreground text-sm">Введите запрос для поиска по вашей базе знаний</p>
              </div>
            ) : isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-border/30 bg-card animate-pulse h-24" />
              ))
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <SearchIcon className="w-10 h-10 text-muted-foreground/20 mb-4" />
                <p className="font-medium mb-1 text-sm">Ничего не найдено</p>
                <p className="text-xs text-muted-foreground">Попробуйте другой запрос или режим поиска</p>
              </div>
            ) : (
              <AnimatePresence>
                {results.map((result, idx) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.04 }}
                  >
                    <ResultItem
                      result={result}
                      selected={selected?.id === result.id}
                      onClick={() => setSelected(result)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        <div className="hidden md:flex flex-1 min-h-0 bg-card border border-border/30 rounded-xl overflow-hidden">
          {selected ? (
            <PreviewPanel memory={selected} />
          ) : debouncedQuery ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
              <SearchIcon className="w-10 h-10 text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground text-sm">Выберите результат для предпросмотра</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
              <div className="bg-primary/5 p-5 rounded-3xl mb-5">
                <Brain className="w-10 h-10 text-primary/15" />
              </div>
              <h3 className="text-base font-medium mb-1 text-muted-foreground/70">Панель предпросмотра</h3>
              <p className="text-xs text-muted-foreground/50 max-w-xs">
                Результаты поиска будут показаны слева, а детали выбранного — здесь.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

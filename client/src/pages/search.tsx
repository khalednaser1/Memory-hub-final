import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Search as SearchIcon, Brain, TextSearch, Loader2, FileText, Link as LinkIcon, Hash, Calendar, ExternalLink, ArrowRight, Sparkles, Command, Zap, BookOpen, Globe, File as FileIcon, FileCheck } from "lucide-react";
import { useSearchMemories } from "@/hooks/use-memories";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { MemoryResponse } from "@shared/schema";

type SearchResult = MemoryResponse & { relevanceScore?: number; matchReason?: string };

const SCORE_BADGES: Record<string, { label: string; cls: string }> = {
  "Точное совпадение": { label: "Точный", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25" },
  "Синонимы":          { label: "Синоним", cls: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25" },
  "Теги":              { label: "Тег", cls: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/25" },
};

const TYPE_ACCENT = {
  text: "bg-blue-500",
  link: "bg-emerald-500",
  file: "bg-amber-500",
};

function getMatchBadges(reason?: string) {
  if (!reason) return [];
  return reason.split(" + ").map(r => SCORE_BADGES[r] || { label: r, cls: "bg-muted text-muted-foreground border-border" });
}

const FEATURE_CARDS = [
  {
    icon: Brain,
    color: "text-primary",
    bg: "bg-primary/8",
    title: "Семантический поиск",
    desc: "Находит по смыслу, а не точным словам — понимает синонимы и контекст",
  },
  {
    icon: Zap,
    color: "text-emerald-500",
    bg: "bg-emerald-500/8",
    title: "Мгновенный предпросмотр",
    desc: "Видите содержимое прямо в поиске, без перехода на страницу",
  },
  {
    icon: BookOpen,
    color: "text-amber-500",
    bg: "bg-amber-500/8",
    title: "Полное содержимое",
    desc: "AI-выжимка, теги и сущности каждой записи — в панели справа",
  },
];

function ResultItem({ result, selected, onClick }: { result: SearchResult; selected: boolean; onClick: () => void }) {
  const Icon = result.type === "link" ? LinkIcon : FileText;
  const badges = getMatchBadges(result.matchReason);
  const accent = TYPE_ACCENT[result.type as keyof typeof TYPE_ACCENT] || TYPE_ACCENT.text;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border transition-all duration-200 relative overflow-hidden ${
        selected
          ? "border-primary/40 bg-primary/5 shadow-sm shadow-primary/5"
          : "border-border/30 bg-card hover:border-primary/20 hover:shadow-sm"
      }`}
      data-testid={`button-result-${result.id}`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 transition-opacity duration-200 ${accent} ${selected ? "opacity-100" : "opacity-0"}`} />
      <div className="p-4 flex items-start gap-3">
        <div className={`p-2 rounded-lg shrink-0 transition-colors ${selected ? "bg-primary/15 text-primary" : "bg-muted/60 text-muted-foreground"}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className={`font-semibold text-sm truncate ${selected ? "text-primary" : "text-foreground"}`} data-testid={`text-result-title-${result.id}`}>
              {result.title}
            </h3>
            {result.relevanceScore !== undefined && (
              <span className="text-[10px] font-mono text-muted-foreground shrink-0 bg-muted/60 px-1.5 py-0.5 rounded tabular-nums">
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
  const accent = TYPE_ACCENT[memory.type as keyof typeof TYPE_ACCENT] || TYPE_ACCENT.text;

  return (
    <motion.div
      key={memory.id}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="h-full overflow-y-auto"
    >
      <div className={`h-1 w-full ${accent} shrink-0`} />
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
            {memory.relevanceScore !== undefined && (
              <span className="ml-auto text-[10px] font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                Релевантность: {Math.round(memory.relevanceScore * 100)}%
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-foreground leading-tight" data-testid="text-preview-title">{memory.title}</h2>
          {memory.matchReason && (
            <div className="flex flex-wrap gap-1 mt-2.5">
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
            <p className="text-[10px] font-semibold text-primary mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />AI Выжимка
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed">{memory.summary}</p>
          </div>
        )}

        {memory.type === "link" ? (
          <div className="space-y-3">
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
              <div className="flex items-start gap-2 mb-2">
                <Globe className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  {(memory as any).linkTitle && <p className="font-medium text-sm text-foreground mb-0.5">{(memory as any).linkTitle}</p>}
                  {(memory as any).linkDomain && <p className="text-[11px] text-muted-foreground mb-1">{(memory as any).linkDomain}</p>}
                  {(memory as any).linkDescription && <p className="text-xs text-muted-foreground leading-relaxed">{(memory as any).linkDescription}</p>}
                </div>
              </div>
              <a href={(memory as any).linkUrl || memory.content} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                Открыть <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            {(memory as any).extractedContent && (
              <div className="bg-muted/30 border border-border/20 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider flex items-center gap-1">
                  <FileCheck className="w-3 h-3 text-emerald-500" />Текст страницы
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">{(memory as any).extractedContent}</p>
              </div>
            )}
          </div>
        ) : memory.type === "file" ? (
          <div className="space-y-3">
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start gap-2">
              <FileIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                {(memory as any).fileMimeType && <p className="text-[11px] text-muted-foreground">{(memory as any).fileMimeType}</p>}
                <p className="text-xs text-foreground/80 mt-1">{memory.content}</p>
              </div>
            </div>
            {(memory as any).extractedContent && (
              <div className="bg-muted/30 border border-border/20 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider flex items-center gap-1">
                  <FileCheck className="w-3 h-3 text-emerald-500" />Извлечённый текст
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-6">{(memory as any).extractedContent}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-muted/30 border border-border/30 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Содержимое</p>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap line-clamp-10">{memory.content}</p>
          </div>
        )}

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
          <div className="flex items-center justify-between p-3 bg-muted/40 hover:bg-primary/5 hover:border-primary/20 border border-border/30 rounded-xl transition-all group cursor-pointer">
            <span className="text-sm font-medium group-hover:text-primary transition-colors">Открыть полную карточку</span>
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
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col md:flex-row gap-3 items-start md:items-center shrink-0">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
            <SearchIcon className={`w-4 h-4 transition-colors duration-200 ${query ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Опишите, что вы ищете..."
            className={`pl-11 pr-24 h-12 text-sm rounded-xl shadow-sm transition-all duration-200 ${
              query
                ? "bg-card border-primary/30 focus-visible:ring-primary/25 shadow-md shadow-primary/5"
                : "bg-card border-border/50 focus-visible:ring-primary/25"
            }`}
            data-testid="input-search"
          />
          <div className="absolute inset-y-0 right-3 flex items-center gap-2 pointer-events-none">
            {isFetching ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-muted/70 border border-border/40 rounded text-[10px] text-muted-foreground font-mono">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            )}
          </div>
        </div>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={v => v && setMode(v as "semantic" | "keyword")}
          className="bg-muted/40 p-1 rounded-xl shrink-0 border border-border/30"
        >
          <ToggleGroupItem
            value="semantic"
            className="rounded-lg px-3 gap-1.5 data-[state=on]:bg-card data-[state=on]:shadow-sm data-[state=on]:text-primary text-xs font-medium"
            data-testid="button-mode-semantic"
          >
            <Brain className="w-3.5 h-3.5" />По смыслу
          </ToggleGroupItem>
          <ToggleGroupItem
            value="keyword"
            className="rounded-lg px-3 gap-1.5 data-[state=on]:bg-card data-[state=on]:shadow-sm data-[state=on]:text-foreground text-xs font-medium"
            data-testid="button-mode-keyword"
          >
            <TextSearch className="w-3.5 h-3.5" />По словам
          </ToggleGroupItem>
        </ToggleGroup>
      </motion.div>

      {debouncedQuery && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 shrink-0"
        >
          <div className={`w-1.5 h-1.5 rounded-full ${results.length > 0 ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
          <p className="text-xs text-muted-foreground" data-testid="text-results-count">
            {results.length > 0
              ? `Найдено ${results.length} результат(ов) для «${debouncedQuery}»`
              : `Ничего не найдено для «${debouncedQuery}»`}
          </p>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-md ml-auto">
            {mode === "semantic" ? "Семантический" : "По ключевым словам"}
          </Badge>
        </motion.div>
      )}

      <div className="flex-1 min-h-0 flex gap-4">
        <div className={`w-full md:w-[42%] flex flex-col min-h-0 transition-all duration-300 ${debouncedQuery && results.length > 0 ? "opacity-100" : "opacity-100"}`}>
          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {!debouncedQuery ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="h-full flex flex-col justify-center gap-3 py-6"
              >
                {FEATURE_CARDS.map((card, i) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.1 }}
                    className="flex items-start gap-4 p-4 bg-card border border-border/30 rounded-xl"
                  >
                    <div className={`${card.bg} p-2.5 rounded-xl shrink-0`}>
                      <card.icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-0.5">{card.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-border/30 bg-card animate-pulse h-24" />
              ))
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="bg-muted/60 p-4 rounded-2xl mb-4">
                  <SearchIcon className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <p className="font-medium mb-1 text-sm">Ничего не найдено</p>
                <p className="text-xs text-muted-foreground">Попробуйте другой запрос или переключите режим поиска</p>
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
                    <ResultItem result={result} selected={selected?.id === result.id} onClick={() => setSelected(result)} />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        <div className="hidden md:flex flex-1 min-h-0 bg-card border border-border/50 rounded-xl overflow-hidden flex-col shadow-sm shadow-black/[0.04] dark:shadow-black/[0.15]">
          {selected ? (
            <PreviewPanel memory={selected} />
          ) : debouncedQuery ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
              <div className="bg-muted/60 p-4 rounded-2xl mb-4">
                <SearchIcon className="w-8 h-8 text-muted-foreground/30" />
              </div>
              <p className="text-muted-foreground text-sm">Выберите результат слева для предпросмотра</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
              <div className="bg-primary/5 p-5 rounded-3xl mb-5">
                <Brain className="w-10 h-10 text-primary/20" />
              </div>
              <h3 className="text-base font-semibold mb-2">Панель предпросмотра</h3>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                Введите запрос — результаты появятся слева, а содержимое выбранной записи откроется здесь
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

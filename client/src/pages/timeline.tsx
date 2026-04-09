import { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useMemories } from "@/hooks/use-memories";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isThisWeek } from "date-fns";
import { ru } from "date-fns/locale";
import { FileText, Link as LinkIcon, Clock, FileArchive } from "lucide-react";

export default function Timeline() {
  const { data: memories, isLoading } = useMemories();
  const [filterType, setFilterType] = useState<string | null>(null);

  const groupedMemories = useMemo(() => {
    let filtered = memories || [];
    if (filterType) {
      filtered = filtered.filter(m => m.type === filterType);
    }

    const groups: Record<string, typeof filtered> = {
      "Сегодня": [],
      "На этой неделе": [],
      "Ранее": []
    };

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    filtered.forEach(memory => {
      const date = new Date(memory.createdAt);
      if (isToday(date)) {
        groups["Сегодня"].push(memory);
      } else if (isThisWeek(date)) {
        groups["На этой неделе"].push(memory);
      } else {
        groups["Ранее"].push(memory);
      }
    });

    return groups;
  }, [memories, filterType]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'link':
        return <LinkIcon className="w-3.5 h-3.5" />;
      case 'file':
        return <FileArchive className="w-3.5 h-3.5" />;
      default:
        return <FileText className="w-3.5 h-3.5" />;
    }
  };

  const getIconStyle = (type: string) => {
    switch (type) {
      case 'link': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'file': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const filterButtons = [
    { value: null, label: "Все" },
    { value: 'text', label: "Текст" },
    { value: 'link', label: "Ссылки" },
    { value: 'file', label: "Файлы" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-5 md:p-10">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Clock className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-timeline-title">Временная шкала</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-9">Ваши воспоминания упорядочены по датам</p>
        </div>

        <div className="flex gap-1.5 mb-8 bg-muted/40 p-1 rounded-xl w-fit border border-border/30">
          {filterButtons.map(btn => (
            <button
              key={btn.label}
              onClick={() => setFilterType(btn.value)}
              className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                filterType === btn.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`button-filter-${btn.label}`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-card border border-border/30 rounded-xl animate-pulse" />)}
        </div>
      ) : Object.entries(groupedMemories).some(([_, items]) => items.length > 0) ? (
        <div className="space-y-8">
          {Object.entries(groupedMemories).map(([period, items]) => 
            items.length > 0 ? (
              <motion.div key={period} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-sm font-semibold text-primary uppercase tracking-wider" data-testid={`text-period-${period}`}>{period}</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent" />
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-md font-medium">{items.length}</Badge>
                </div>
                <div className="space-y-2 relative ml-3">
                  <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary/30 via-primary/15 to-transparent rounded-full" />
                  <AnimatePresence>
                    {items.map((memory, idx) => (
                      <motion.div
                        key={memory.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: idx * 0.05 }}
                      >
                        <Link href={`/memory/${memory.id}`} className="block" data-testid={`link-timeline-${memory.id}`}>
                          <div className="p-4 border border-border/30 bg-card hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all cursor-pointer ml-5 rounded-xl group relative">
                            <div className="absolute -left-[25px] top-5 w-2.5 h-2.5 rounded-full bg-card border-2 border-primary/40 group-hover:border-primary group-hover:scale-110 transition-all z-10" />
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg shrink-0 border ${getIconStyle(memory.type)}`}>
                                {getIcon(memory.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate" data-testid={`text-timeline-title-${memory.id}`}>{memory.title}</h3>
                                  <span className="text-[10px] text-muted-foreground shrink-0 bg-muted/60 px-1.5 py-0.5 rounded font-mono">
                                    {format(new Date(memory.createdAt), 'HH:mm', { locale: ru })}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">{memory.summary || memory.content.slice(0, 100)}</p>
                                {memory.tags.length > 0 && (
                                  <div className="flex gap-1 mt-2 flex-wrap">
                                    {memory.tags.slice(0, 3).map(tag => (
                                      <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 rounded">#{tag}</Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : null
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-card/50 border border-border/30 rounded-2xl border-dashed">
          <Clock className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Нет воспоминаний в этом периоде</p>
        </div>
      )}
    </div>
  );
}

import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useMemories } from "@/hooks/use-memories";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isToday, isThisWeek, differenceInDays } from "date-fns";
import { ru } from "date-fns/locale";
import { FileText, Link as LinkIcon } from "lucide-react";

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
        return <LinkIcon className="w-4 h-4" />;
      case 'file':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Временная шкала</h1>
        <p className="text-muted-foreground">Ваши воспоминания упорядочены по датам</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setFilterType(null)}
          className={`px-4 py-2 rounded-lg transition-all ${!filterType ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
        >
          Все
        </button>
        <button
          onClick={() => setFilterType('text')}
          className={`px-4 py-2 rounded-lg transition-all ${filterType === 'text' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
        >
          Текст
        </button>
        <button
          onClick={() => setFilterType('link')}
          className={`px-4 py-2 rounded-lg transition-all ${filterType === 'link' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
        >
          Ссылки
        </button>
        <button
          onClick={() => setFilterType('file')}
          className={`px-4 py-2 rounded-lg transition-all ${filterType === 'file' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
        >
          Файлы
        </button>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-6">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-card border border-border/50 rounded-lg animate-pulse" />)}
        </div>
      ) : Object.entries(groupedMemories).some(([_, items]) => items.length > 0) ? (
        <div className="space-y-8">
          {Object.entries(groupedMemories).map(([period, items]) => 
            items.length > 0 ? (
              <div key={period}>
                <h2 className="text-lg font-semibold text-primary mb-4">{period}</h2>
                <div className="space-y-3 relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/50 to-primary/10 rounded-full" />
                  {items.map((memory) => (
                    <Link key={memory.id} href={`/memory/${memory.id}`} className="block">
                      <Card className="p-4 border-border/50 hover:border-primary/50 hover:bg-card/80 transition-all cursor-pointer ml-4 group">
                        <div className="flex items-start gap-4">
                          <div className="absolute -left-3 mt-1.5 w-5 h-5 rounded-full bg-primary/20 border-2 border-primary" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getIcon(memory.type)}
                              <h3 className="font-semibold group-hover:text-primary transition-colors">{memory.title}</h3>
                              <Badge variant="outline" className="ml-auto text-xs">
                                {format(new Date(memory.createdAt), 'HH:mm', { locale: ru })}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{memory.summary || memory.content.slice(0, 100)}...</p>
                            {memory.tags.length > 0 && (
                              <div className="flex gap-2 mt-3 flex-wrap">
                                {memory.tags.slice(0, 3).map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Нет воспоминаний в этом периоде</p>
        </div>
      )}
    </div>
  );
}

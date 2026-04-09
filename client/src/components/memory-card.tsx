import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { FileText, Link as LinkIcon, Image as ImageIcon, Hash, Calendar, User } from "lucide-react";
import { type MemoryResponse } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

const TYPE_STYLES = {
  text: { bg: "bg-blue-500/10 dark:bg-blue-500/15", text: "text-blue-600 dark:text-blue-400", label: "Заметка" },
  link: { bg: "bg-emerald-500/10 dark:bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400", label: "Ссылка" },
  file: { bg: "bg-amber-500/10 dark:bg-amber-500/15", text: "text-amber-600 dark:text-amber-400", label: "Файл" },
};

export function MemoryCard({ memory, highlightReason }: { memory: MemoryResponse & { relevanceScore?: number, matchReason?: string }, highlightReason?: boolean }) {
  const Icon = memory.type === "link" ? LinkIcon : memory.type === "file" ? ImageIcon : FileText;
  const style = TYPE_STYLES[memory.type as keyof typeof TYPE_STYLES] || TYPE_STYLES.text;

  return (
    <Link href={`/memory/${memory.id}`} className="block group" data-testid={`card-memory-${memory.id}`}>
      <div className="bg-card rounded-2xl p-5 border border-border/40 hover:border-primary/30 transition-all duration-300 h-full flex flex-col relative overflow-hidden group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-primary/5">
        
        <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.08), transparent)' }} />

        <div className="flex items-start justify-between mb-3.5 relative z-10">
          <div className={`${style.bg} ${style.text} p-2.5 rounded-xl`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="text-[11px] text-muted-foreground font-medium bg-muted/60 px-2.5 py-1 rounded-lg">
            {formatDistanceToNow(new Date(memory.createdAt), { addSuffix: true, locale: ru })}
          </div>
        </div>

        <h3 className="font-semibold text-[15px] text-foreground mb-1.5 line-clamp-2 leading-snug group-hover:text-primary transition-colors relative z-10" data-testid={`text-title-${memory.id}`}>
          {memory.title}
        </h3>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1 relative z-10 leading-relaxed">
          {memory.summary || memory.content}
        </p>

        {highlightReason && memory.matchReason && (
          <div className="mb-3 bg-primary/5 p-2.5 rounded-lg border border-primary/15 text-xs text-primary relative z-10">
            <span className="font-semibold mr-1">Совпадение:</span> 
            {memory.matchReason}
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-border/30 flex flex-wrap gap-1.5 relative z-10">
          {memory.tags.slice(0, 3).map((tag, i) => (
            <Badge key={i} variant="secondary" className="bg-secondary/70 hover:bg-secondary text-[11px] text-secondary-foreground flex gap-1 items-center font-normal px-2 py-0.5 rounded-md">
              <Hash className="w-2.5 h-2.5 opacity-50" />
              {tag}
            </Badge>
          ))}
          {memory.tags.length > 3 && (
            <Badge variant="outline" className="text-[11px] text-muted-foreground font-normal px-2 py-0.5 rounded-md">
              +{memory.tags.length - 3}
            </Badge>
          )}
          
          {!memory.tags.length && memory.entities && (
            <>
              {memory.entities.people?.slice(0, 1).map((p, i) => (
                <Badge key={i} variant="outline" className="text-[10px] text-muted-foreground border-dashed flex items-center gap-1 rounded-md">
                  <User className="w-2.5 h-2.5" /> {p}
                </Badge>
              ))}
              {memory.entities.dates?.slice(0, 1).map((d, i) => (
                <Badge key={i} variant="outline" className="text-[10px] text-muted-foreground border-dashed flex items-center gap-1 rounded-md">
                  <Calendar className="w-2.5 h-2.5" /> {d}
                </Badge>
              ))}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

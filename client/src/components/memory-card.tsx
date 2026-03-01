import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { FileText, Link as LinkIcon, Image as ImageIcon, Hash, Calendar, User } from "lucide-react";
import { type MemoryResponse } from "@shared/routes";
import { Badge } from "@/components/ui/badge";

export function MemoryCard({ memory, highlightReason }: { memory: MemoryResponse & { relevanceScore?: number, matchReason?: string }, highlightReason?: boolean }) {
  const Icon = memory.type === "link" ? LinkIcon : memory.type === "file" ? ImageIcon : FileText;

  return (
    <Link href={`/memory/${memory.id}`} className="block group">
      <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 h-full flex flex-col relative overflow-hidden group-hover:-translate-y-1">
        
        {/* Decorative gradient blob */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />

        <div className="flex items-start justify-between mb-3 relative z-10">
          <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
            <Icon className="w-5 h-5" />
          </div>
          <div className="text-xs text-muted-foreground font-medium bg-muted px-2.5 py-1 rounded-full">
            {formatDistanceToNow(new Date(memory.createdAt), { addSuffix: true, locale: ru })}
          </div>
        </div>

        <h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors relative z-10">
          {memory.title}
        </h3>
        
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1 relative z-10">
          {memory.summary || memory.content}
        </p>

        {highlightReason && memory.matchReason && (
          <div className="mb-4 bg-accent/50 p-2.5 rounded-lg border border-accent text-xs text-accent-foreground relative z-10">
            <span className="font-semibold mr-1">Совпадение:</span> 
            {memory.matchReason}
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-border/40 flex flex-wrap gap-1.5 relative z-10">
          {memory.tags.slice(0, 3).map((tag, i) => (
            <Badge key={i} variant="secondary" className="bg-secondary hover:bg-secondary/80 text-xs text-secondary-foreground flex gap-1 items-center font-normal px-2">
              <Hash className="w-3 h-3 opacity-50" />
              {tag}
            </Badge>
          ))}
          {memory.tags.length > 3 && (
            <Badge variant="outline" className="text-xs text-muted-foreground font-normal px-2">
              +{memory.tags.length - 3}
            </Badge>
          )}
          
          {/* Subtle entity indicators if any exist */}
          {!memory.tags.length && memory.entities && (
            <>
              {memory.entities.people?.slice(0, 1).map((p, i) => (
                <Badge key={i} variant="outline" className="text-[10px] text-muted-foreground border-dashed flex items-center gap-1">
                  <User className="w-3 h-3" /> {p}
                </Badge>
              ))}
              {memory.entities.dates?.slice(0, 1).map((d, i) => (
                <Badge key={i} variant="outline" className="text-[10px] text-muted-foreground border-dashed flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {d}
                </Badge>
              ))}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

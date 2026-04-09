import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { FileText, Link as LinkIcon, File, Hash, Calendar, User, Globe, FileCheck, FileImage, FileArchive, Download } from "lucide-react";
import { type MemoryResponse } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

const TYPE_STYLES = {
  text: { bg: "bg-blue-500/10 dark:bg-blue-500/15", text: "text-blue-600 dark:text-blue-400", label: "Заметка" },
  link: { bg: "bg-emerald-500/10 dark:bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400", label: "Ссылка" },
  file: { bg: "bg-amber-500/10 dark:bg-amber-500/15", text: "text-amber-600 dark:text-amber-400", label: "Файл" },
};

function getFileCardMeta(mimeType: string): { icon: typeof File; label: string; bg: string; text: string } {
  if (mimeType?.startsWith("image/"))
    return { icon: FileImage, label: "Изображение", bg: "bg-violet-500/10 dark:bg-violet-500/15", text: "text-violet-600 dark:text-violet-400" };
  if (mimeType?.includes("pdf"))
    return { icon: File, label: "PDF", bg: "bg-red-500/10 dark:bg-red-500/15", text: "text-red-600 dark:text-red-400" };
  if (mimeType?.includes("word") || mimeType?.includes("document"))
    return { icon: FileText, label: "Word", bg: "bg-blue-500/10 dark:bg-blue-500/15", text: "text-blue-600 dark:text-blue-400" };
  if (mimeType?.includes("zip") || mimeType?.includes("rar"))
    return { icon: FileArchive, label: "Архив", bg: "bg-amber-500/10 dark:bg-amber-500/15", text: "text-amber-600 dark:text-amber-400" };
  if (mimeType?.startsWith("text/"))
    return { icon: FileText, label: "Текст", bg: "bg-amber-500/10 dark:bg-amber-500/15", text: "text-amber-600 dark:text-amber-400" };
  return { icon: File, label: "Файл", bg: "bg-amber-500/10 dark:bg-amber-500/15", text: "text-amber-600 dark:text-amber-400" };
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export function MemoryCard({ memory, highlightReason }: { memory: MemoryResponse & { relevanceScore?: number, matchReason?: string }, highlightReason?: boolean }) {
  const isFile = memory.type === "file";
  const isLink = memory.type === "link";

  // For file cards, use MIME-specific icon/color
  const fileMeta = isFile ? getFileCardMeta(memory.fileMimeType || "") : null;
  const Icon = isLink ? LinkIcon : isFile ? (fileMeta!.icon) : FileText;
  const style = isFile
    ? fileMeta!
    : TYPE_STYLES[memory.type as keyof typeof TYPE_STYLES] || TYPE_STYLES.text;

  // Best description snippet
  const description = (() => {
    if (isLink) return memory.linkDescription || memory.summary || memory.content;
    if (isFile) {
      if (memory.extractedContent) return memory.extractedContent.replace(/\n+/g, " ").slice(0, 160);
      return memory.content && memory.content !== `Файл: ${memory.title}` ? memory.content : "";
    }
    return memory.summary || memory.content;
  })();

  return (
    <Link href={`/memory/${memory.id}`} className="block group" data-testid={`card-memory-${memory.id}`}>
      <div className="bg-card rounded-2xl p-5 border border-border/40 hover:border-primary/30 transition-all duration-300 h-full flex flex-col relative overflow-hidden group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-primary/5 shadow-sm shadow-black/[0.03] dark:shadow-black/[0.12]">

        <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.08), transparent)" }} />

        <div className="flex items-start justify-between mb-3.5 relative z-10">
          <div className={`${style.bg} ${style.text} p-2.5 rounded-xl`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {/* Link: show domain */}
            {isLink && memory.linkDomain && (
              <span className="text-[10px] text-muted-foreground/70 bg-muted/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Globe className="w-2.5 h-2.5" />{memory.linkDomain}
              </span>
            )}
            {/* File: show type label + size */}
            {isFile && fileMeta && (
              <span className={`text-[10px] ${fileMeta.text} ${fileMeta.bg} px-2 py-0.5 rounded-md font-medium`}>
                {fileMeta.label}
              </span>
            )}
            {isFile && memory.fileSize ? (
              <span className="text-[10px] text-muted-foreground/70 bg-muted/40 px-2 py-0.5 rounded-md">
                {formatBytes(memory.fileSize)}
              </span>
            ) : null}
            {isFile && memory.extractedContent && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/8 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-500/15">
                <FileCheck className="w-2.5 h-2.5" />
                {memory.extractedContent.split(/\s+/).filter(Boolean).length} сл.
              </span>
            )}
            <div className="text-[11px] text-muted-foreground font-medium bg-muted/60 px-2.5 py-1 rounded-lg whitespace-nowrap">
              {formatDistanceToNow(new Date(memory.createdAt), { addSuffix: true, locale: ru })}
            </div>
          </div>
        </div>

        <h3 className="font-semibold text-[15px] text-foreground mb-1.5 line-clamp-2 leading-snug group-hover:text-primary transition-colors relative z-10" data-testid={`text-title-${memory.id}`}>
          {isLink && memory.linkTitle ? memory.linkTitle : memory.title}
        </h3>

        {description ? (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1 relative z-10 leading-relaxed">
            {description}
          </p>
        ) : (
          <div className="flex-1 mb-4" />
        )}

        {highlightReason && memory.matchReason && (
          <div className="mb-3 bg-primary/5 p-2.5 rounded-lg border border-primary/15 text-xs text-primary relative z-10">
            <span className="font-semibold mr-1">Совпадение:</span>
            {memory.matchReason}
            {memory.relevanceScore && (
              <span className="ml-2 opacity-60">{Math.round(memory.relevanceScore * 100)}%</span>
            )}
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

          {/* For files with no tags: show download indicator */}
          {isFile && !memory.tags.length && !memory.entities?.people?.length && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 opacity-50">
              <Download className="w-2.5 h-2.5" /> Скачать →
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

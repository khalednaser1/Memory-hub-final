import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  ArrowLeft, Calendar, FileText, Link as LinkIcon, Image as ImageIcon,
  Hash, User, Network, Trash2, Edit, ExternalLink, BrainCircuit,
  Save, X, Tag, Clock, Sparkles, Globe, FileCheck,
  File as FileIcon, FileImage, FileArchive, Download, Eye
} from "lucide-react";
import { useMemory, useDeleteMemory, useUpdateMemory, useMemories } from "@/hooks/use-memories";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { MemoryCard } from "@/components/memory-card";
import { motion } from "framer-motion";

function getFileBasename(filePath: string): string {
  if (!filePath) return "";
  return filePath.split("/").pop() || filePath.split("\\").pop() || filePath;
}

function getFileDownloadUrl(filePath: string): string {
  const name = getFileBasename(filePath);
  return name ? `/api/files/${encodeURIComponent(name)}` : "";
}

function getFileViewUrl(filePath: string): string {
  const name = getFileBasename(filePath);
  return name ? `/api/files/${encodeURIComponent(name)}/view` : "";
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function getFileMeta(mimeType: string): { icon: typeof FileIcon; label: string; color: string; bg: string } {
  if (mimeType?.startsWith("image/"))
    return { icon: FileImage, label: "Изображение", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10" };
  if (mimeType?.includes("pdf"))
    return { icon: FileIcon, label: "PDF", color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" };
  if (mimeType?.includes("word") || mimeType?.includes("document"))
    return { icon: FileText, label: "Word", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" };
  if (mimeType?.includes("zip") || mimeType?.includes("rar"))
    return { icon: FileArchive, label: "Архив", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" };
  if (mimeType?.startsWith("text/"))
    return { icon: FileText, label: "Текст", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" };
  return { icon: FileIcon, label: "Файл", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" };
}

const TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  text: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", label: "Заметка" },
  link: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", label: "Ссылка" },
  file: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", label: "Файл" },
};

export default function MemoryDetail() {
  const [, params] = useRoute("/memory/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: memory, isLoading } = useMemory(id);
  const { data: allMemories = [] } = useMemories();
  const deleteMutation = useDeleteMemory();
  const updateMutation = useUpdateMemory();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTagsStr, setEditTagsStr] = useState("");

  const startEdit = () => {
    if (!memory) return;
    setEditTitle(memory.title);
    setEditContent(memory.content);
    setEditTagsStr(memory.tags.join(", "));
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const saveEdit = async () => {
    if (!memory) return;
    const tags = editTagsStr.split(",").map(t => t.trim()).filter(Boolean);
    try {
      await updateMutation.mutateAsync({ id, title: editTitle, content: editContent, tags });
      setIsEditing(false);
      toast({ title: "Сохранено", description: "Воспоминание обновлено." });
    } catch (e) {
      toast({ variant: "destructive", title: "Ошибка", description: "Не удалось сохранить." });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Удалено", description: "Воспоминание удалено безвозвратно." });
      setLocation("/library");
    } catch (e) {
      toast({ variant: "destructive", title: "Ошибка", description: "Не удалось удалить." });
    }
  };

  const relatedMemories = allMemories
    .filter(m => m.id !== id && memory?.tags.some(t => m.tags.includes(t)))
    .slice(0, 4);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-5 md:p-10">
        <Skeleton className="h-8 w-24 mb-8 rounded-lg" />
        <Skeleton className="h-10 w-3/4 mb-6 rounded-lg" />
        <div className="flex gap-3 mb-8">
          <Skeleton className="h-6 w-20 rounded-lg" />
          <Skeleton className="h-6 w-20 rounded-lg" />
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="max-w-4xl mx-auto p-10 text-center">
        <h2 className="text-2xl font-bold mb-4">Воспоминание не найдено</h2>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/library">Вернуться в библиотеку</Link>
        </Button>
      </div>
    );
  }

  const Icon = memory.type === "link" ? LinkIcon : memory.type === "file" ? ImageIcon : FileText;
  const typeStyle = TYPE_STYLES[memory.type] || TYPE_STYLES.text;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto p-5 md:p-10 pb-20">
      <Link href="/library" className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors bg-muted/40 hover:bg-muted/60 px-3 py-1.5 rounded-lg border border-border/30" data-testid="link-back">
        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
        Назад
      </Link>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-2.5 mb-3">
            <Badge variant="secondary" className={`flex items-center gap-1.5 ${typeStyle.bg} ${typeStyle.text} py-1 px-3 rounded-lg text-xs font-medium border-0`}>
              <Icon className="w-3.5 h-3.5" />
              {typeStyle.label}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(memory.createdAt), "d MMMM yyyy, HH:mm", { locale: ru })}
            </span>
          </div>

          {isEditing ? (
            <Input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="text-2xl font-bold h-12 border-border/30 bg-muted/40 rounded-xl"
              data-testid="input-edit-title"
            />
          ) : (
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-tight" data-testid="text-memory-title">
              {memory.title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={cancelEdit} className="rounded-xl gap-1.5 h-9 text-xs border-border/30" data-testid="button-cancel-edit">
                <X className="w-3.5 h-3.5" />Отмена
              </Button>
              <Button size="sm" onClick={saveEdit} disabled={updateMutation.isPending} className="rounded-xl gap-1.5 h-9 text-xs" data-testid="button-save-edit">
                <Save className="w-3.5 h-3.5" />{updateMutation.isPending ? "..." : "Сохранить"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="icon" className="rounded-xl border-border/30 hover:bg-muted/60 h-9 w-9" onClick={startEdit} aria-label="Редактировать" data-testid="button-edit">
                <Edit className="w-4 h-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-xl border-border/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 h-9 w-9" aria-label="Удалить" data-testid="button-delete">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Удалить воспоминание?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Это действие нельзя отменить. Воспоминание будет удалено из базы знаний.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Отмена</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground" data-testid="button-confirm-delete">
                      Да, удалить
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="mb-6 bg-muted/40 p-1 rounded-xl h-auto gap-0.5 border border-border/30">
          <TabsTrigger value="content" className="rounded-lg px-3.5 py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm gap-1.5 text-xs font-medium" data-testid="tab-content">
            <FileText className="w-3.5 h-3.5" />Содержание
          </TabsTrigger>
          <TabsTrigger value="summary" className="rounded-lg px-3.5 py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm gap-1.5 text-xs font-medium" data-testid="tab-summary">
            <Sparkles className="w-3.5 h-3.5" />AI Выжимка
          </TabsTrigger>
          <TabsTrigger value="entities" className="rounded-lg px-3.5 py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm gap-1.5 text-xs font-medium" data-testid="tab-entities">
            <Network className="w-3.5 h-3.5" />Сущности
          </TabsTrigger>
          <TabsTrigger value="related" className="rounded-lg px-3.5 py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm gap-1.5 text-xs font-medium" data-testid="tab-related">
            <Hash className="w-3.5 h-3.5" />Похожие
            {relatedMemories.length > 0 && (
              <span className="ml-1 bg-primary/15 text-primary text-[10px] px-1.5 py-0.5 rounded-md font-semibold">
                {relatedMemories.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-5">
          <div className="bg-card border border-border/30 rounded-2xl p-6 md:p-8">
            {isEditing ? (
              <Textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="min-h-48 bg-muted/40 border-border/30 resize-none text-sm leading-relaxed rounded-xl"
                placeholder="Содержимое воспоминания..."
                data-testid="input-edit-content"
              />
            ) : memory.type === "link" ? (
              <div className="space-y-4">
                {/* Link card */}
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="bg-emerald-500/10 p-2.5 rounded-xl shrink-0 mt-0.5">
                      <Globe className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base text-foreground leading-snug mb-1">
                        {memory.linkTitle || memory.title}
                      </p>
                      {memory.linkDomain && (
                        <p className="text-xs text-muted-foreground mb-2">{memory.linkDomain}</p>
                      )}
                      {memory.linkDescription && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{memory.linkDescription}</p>
                      )}
                    </div>
                  </div>
                  <a
                    href={memory.linkUrl || memory.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 rounded-xl transition-all border border-emerald-500/20"
                    data-testid="link-open-external"
                  >
                    Открыть страницу <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                {/* Personal note */}
                {memory.content && memory.content !== (memory.linkUrl || "") && memory.content !== (memory.linkDescription || "") && (
                  <div className="bg-card border border-border/30 rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ваша заметка</p>
                    <p className="text-sm text-foreground/90 leading-relaxed">{memory.content}</p>
                  </div>
                )}
                {/* Extracted page text */}
                {memory.extractedContent && (
                  <div className="bg-muted/30 border border-border/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Извлечённый текст страницы</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-6">{memory.extractedContent}</p>
                  </div>
                )}
              </div>
            ) : memory.type === "file" ? (() => {
              const fileMeta = getFileMeta(memory.fileMimeType || "");
              const FileTypeIcon = fileMeta.icon;
              const downloadUrl = getFileDownloadUrl(memory.filePath || "");
              const viewUrl = getFileViewUrl(memory.filePath || "");
              const isImage = memory.fileMimeType?.startsWith("image/");
              const isPdf = memory.fileMimeType?.includes("pdf");
              const wordCount = memory.extractedContent
                ? memory.extractedContent.split(/\s+/).filter(Boolean).length
                : 0;

              return (
                <div className="space-y-4">
                  {/* Document identity card */}
                  <div className={`border rounded-2xl p-5 ${fileMeta.bg} border-current/10`} style={{ borderColor: "hsl(var(--border))" }}>
                    <div className="flex items-start gap-4">
                      <div className={`p-3.5 rounded-2xl shrink-0 ${fileMeta.bg} border border-white/10`}>
                        <FileTypeIcon className={`w-7 h-7 ${fileMeta.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-foreground leading-snug mb-1.5 break-all" data-testid="text-file-title">
                          {memory.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] font-medium border-0 ${fileMeta.bg} ${fileMeta.color} px-2 py-0.5`}>
                            {fileMeta.label}
                          </Badge>
                          {memory.fileSize ? (
                            <span className="text-[11px] text-muted-foreground">{formatBytes(memory.fileSize)}</span>
                          ) : null}
                          {wordCount > 0 && (
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <FileCheck className="w-3 h-3" />
                              {wordCount} слов
                            </span>
                          )}
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(memory.createdAt), "d MMM yyyy", { locale: ru })}
                          </span>
                        </div>
                        {memory.content && memory.content !== `Файл: ${memory.title}` && (
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{memory.content}</p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    {downloadUrl && (
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/30">
                        <a
                          href={downloadUrl}
                          download
                          className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 border border-border/40 hover:border-border/70 transition-all"
                          data-testid="link-download-file"
                        >
                          <Download className="w-4 h-4" />
                          Скачать файл
                        </a>
                        {(isImage || isPdf) && (
                          <a
                            href={viewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl bg-primary/8 hover:bg-primary/15 border border-primary/20 text-primary transition-all"
                            data-testid="link-view-file"
                          >
                            <Eye className="w-4 h-4" />
                            Открыть
                          </a>
                        )}
                        {!isImage && !isPdf && viewUrl && (
                          <a
                            href={viewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 border border-border/40 transition-all"
                            data-testid="link-open-file"
                          >
                            <Eye className="w-4 h-4" />
                            Открыть
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Image preview */}
                  {isImage && viewUrl && (
                    <div className="bg-muted/30 border border-border/30 rounded-2xl p-4 flex flex-col items-center">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 self-start">Предпросмотр</p>
                      <img
                        src={viewUrl}
                        alt={memory.title}
                        className="max-h-80 max-w-full rounded-xl object-contain shadow-sm"
                        data-testid="img-file-preview"
                      />
                    </div>
                  )}

                  {/* PDF preview */}
                  {isPdf && viewUrl && (
                    <div className="bg-muted/30 border border-border/30 rounded-2xl p-4">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Предпросмотр PDF</p>
                      <iframe
                        src={viewUrl}
                        className="w-full h-96 rounded-xl border border-border/20"
                        title={memory.title}
                        data-testid="iframe-pdf-preview"
                      />
                    </div>
                  )}

                  {/* Extracted text */}
                  {memory.extractedContent ? (
                    <div className="bg-card border border-border/30 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Извлечённый текст</p>
                        <span className="ml-auto text-[10px] text-muted-foreground/60">{wordCount} слов</span>
                      </div>
                      <div className="prose dark:prose-invert max-w-none text-foreground text-sm leading-relaxed">
                        {memory.extractedContent.slice(0, 3000).split("\n").map((para, i) =>
                          para.trim() ? <p key={i}>{para}</p> : <br key={i} />
                        )}
                        {memory.extractedContent.length > 3000 && (
                          <p className="text-muted-foreground italic mt-3 text-xs">
                            ... ещё {(memory.extractedContent.length - 3000).toLocaleString()} символов — скачайте файл для полного содержания
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (() => {
                    const status = memory.processingStatus;
                    const isScanned = status === "ocr_needed" || (isPdf && !memory.extractedContent);
                    const isProtected = status === "protected";
                    const statusColor = isProtected
                      ? "border-amber-500/30 bg-amber-500/5"
                      : isScanned
                        ? "border-blue-500/30 bg-blue-500/5"
                        : "border-border/30 bg-muted/20";
                    const statusTitle = isProtected
                      ? "PDF защищён паролем"
                      : isScanned
                        ? "Сканированный PDF — требуется OCR"
                        : isImage
                          ? "Изображение загружено"
                          : "Текст не извлечён";
                    const statusDesc = isProtected
                      ? "Этот PDF защищён паролем или DRM. Содержимое доступно только после его открытия с паролем. Файл сохранён и доступен для скачивания."
                      : isScanned
                        ? "Текст в этом PDF хранится как изображения (скан). Автоматическое извлечение текста (OCR) в данной версии не поддерживается. Файл сохранён и доступен для просмотра и скачивания."
                        : isImage
                          ? "Это изображение — текстовое содержание недоступно. Вы можете открыть или скачать файл выше."
                          : "Этот тип файла не поддерживает автоматическое извлечение текста. Файл сохранён и доступен для скачивания.";
                    return (
                      <div className={`border rounded-xl p-5 flex items-start gap-3 ${statusColor}`}>
                        <FileTypeIcon className={`w-5 h-5 shrink-0 mt-0.5 ${fileMeta.color}`} />
                        <div>
                          <p className="text-sm font-medium mb-1">{statusTitle}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{statusDesc}</p>
                          {isScanned && (
                            <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-2 font-medium">
                              Совет: для извлечения текста используйте Adobe Acrobat или другой OCR-инструмент, затем добавьте текст в заметке к файлу.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })() : (
              <div className="prose dark:prose-invert max-w-none text-foreground leading-relaxed text-sm">
                {memory.content.split("\n").map((paragraph, i) =>
                  paragraph ? <p key={i}>{paragraph}</p> : <br key={i} />
                )}
              </div>
            )}
          </div>

          <div className="bg-card border border-border/30 rounded-xl p-5">
            <h3 className="text-[10px] font-semibold mb-3 flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
              <Tag className="w-3.5 h-3.5" />Теги
            </h3>
            {isEditing ? (
              <Input
                value={editTagsStr}
                onChange={e => setEditTagsStr(e.target.value)}
                placeholder="тег1, тег2, тег3"
                className="bg-muted/40 border-border/30 rounded-xl"
                data-testid="input-edit-tags"
              />
            ) : memory.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {memory.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="bg-secondary/60 hover:bg-secondary px-3 py-1 rounded-lg text-xs font-normal" data-testid={`badge-detail-tag-${tag}`}>
                    #{tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">Нет тегов</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="summary">
          {memory.summary ? (
            <div className="space-y-5">
              <div className="bg-primary/5 border border-primary/15 rounded-2xl p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-x-1/4 -translate-y-1/4 pointer-events-none" />
                <div className="flex items-center gap-2 mb-3 text-primary text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Автоматическая выжимка</span>
                </div>
                <p className="text-foreground/90 leading-relaxed text-base relative z-10" data-testid="text-summary">{memory.summary}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-card border border-border/30 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-primary mb-0.5 tabular-nums">
                    {memory.content.split(/\s+/).filter(Boolean).length}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">слов</p>
                </div>
                <div className="bg-card border border-border/30 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-primary mb-0.5 tabular-nums">
                    {memory.content.split(/[.!?]+/).filter(s => s.trim()).length}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">предложений</p>
                </div>
                <div className="bg-card border border-border/30 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-primary mb-0.5 tabular-nums">{memory.tags.length}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">тегов</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-card border border-border/30 rounded-2xl">
              <BrainCircuit className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Выжимка не сгенерирована</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="entities">
          <div className="space-y-4">
            {(memory.entities?.people?.length > 0 || memory.entities?.topics?.length > 0 || memory.entities?.dates?.length > 0) ? (
              <>
                {memory.entities.people?.length > 0 && (
                  <div className="bg-card border border-border/30 rounded-xl p-5">
                    <h3 className="text-xs font-semibold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                      <div className="p-1 rounded bg-blue-500/10"><User className="w-3.5 h-3.5 text-blue-500" /></div>
                      Упомянутые люди
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {memory.entities.people.map((p: string) => (
                        <Badge key={p} variant="outline" className="px-3 py-1 rounded-lg text-xs border-blue-500/20 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50">
                          <User className="w-3 h-3 mr-1.5" />{p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {memory.entities.dates?.length > 0 && (
                  <div className="bg-card border border-border/30 rounded-xl p-5">
                    <h3 className="text-xs font-semibold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                      <div className="p-1 rounded bg-emerald-500/10"><Clock className="w-3.5 h-3.5 text-emerald-500" /></div>
                      Даты
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {memory.entities.dates.map((d: string) => (
                        <Badge key={d} variant="outline" className="px-3 py-1 rounded-lg text-xs border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50">
                          <Calendar className="w-3 h-3 mr-1.5" />{d}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {memory.entities.topics?.length > 0 && (
                  <div className="bg-card border border-border/30 rounded-xl p-5">
                    <h3 className="text-xs font-semibold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                      <div className="p-1 rounded bg-purple-500/10"><Hash className="w-3.5 h-3.5 text-purple-500" /></div>
                      Ключевые темы
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {memory.entities.topics.map((t: string) => (
                        <Badge key={t} variant="outline" className="px-3 py-1 rounded-lg text-xs border-purple-500/20 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-card border border-border/30 rounded-2xl">
                <Network className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm mb-1">Сущности не извлечены</p>
                <p className="text-xs text-muted-foreground/60">Добавьте больше текста для автоматического извлечения</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="related">
          {relatedMemories.length > 0 ? (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Воспоминания, связанные общими тегами: {memory.tags.map(t => `#${t}`).join(", ")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedMemories.map(related => (
                  <MemoryCard key={related.id} memory={related} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-card border border-border/30 rounded-2xl">
              <Hash className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm mb-1">Похожих воспоминаний нет</p>
              <p className="text-xs text-muted-foreground/60">
                Добавьте теги к воспоминаниям, чтобы видеть связанные материалы
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

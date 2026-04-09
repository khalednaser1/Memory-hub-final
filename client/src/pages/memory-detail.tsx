import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  ArrowLeft, Calendar, FileText, Link as LinkIcon, Image as ImageIcon,
  Hash, User, Network, Trash2, Edit, ExternalLink, BrainCircuit,
  Save, X, Tag, Clock, AtSign, Sparkles, Globe, FileCheck, File as FileIcon
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
            ) : memory.type === "file" ? (
              <div className="space-y-4">
                {/* File info card */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-amber-500/10 p-2.5 rounded-xl shrink-0">
                      <FileIcon className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{memory.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {memory.fileMimeType && (
                          <Badge variant="outline" className="text-[10px] border-amber-500/20 text-amber-600 dark:text-amber-400 bg-amber-500/5">
                            {memory.fileMimeType.split("/").pop()?.toUpperCase()}
                          </Badge>
                        )}
                        {memory.fileSize && memory.fileSize > 0 && (
                          <span className="text-[11px] text-muted-foreground">
                            {memory.fileSize < 1024 * 1024
                              ? `${(memory.fileSize / 1024).toFixed(1)} КБ`
                              : `${(memory.fileSize / (1024 * 1024)).toFixed(1)} МБ`}
                          </span>
                        )}
                        {memory.extractedContent && (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <FileCheck className="w-3 h-3" />
                            {memory.extractedContent.split(/\s+/).filter(Boolean).length} слов извлечено
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {memory.content && (
                    <p className="text-sm text-muted-foreground">{memory.content}</p>
                  )}
                </div>
                {/* Extracted text */}
                {memory.extractedContent ? (
                  <div className="bg-card border border-border/30 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Извлечённый текст</p>
                    </div>
                    <div className="prose dark:prose-invert max-w-none text-foreground text-sm leading-relaxed">
                      {memory.extractedContent.slice(0, 2000).split("\n").map((para, i) =>
                        para ? <p key={i}>{para}</p> : <br key={i} />
                      )}
                      {memory.extractedContent.length > 2000 && (
                        <p className="text-muted-foreground italic mt-2">...и ещё {memory.extractedContent.length - 2000} символов</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 flex items-center gap-2">
                    <FileIcon className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">Текст не извлечён (изображение или неподдерживаемый формат)</p>
                  </div>
                )}
              </div>
            ) : (
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

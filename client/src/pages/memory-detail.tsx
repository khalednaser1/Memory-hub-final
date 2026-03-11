import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  ArrowLeft, Calendar, FileText, Link as LinkIcon, Image as ImageIcon,
  Hash, User, Network, Trash2, Edit, ExternalLink, BrainCircuit,
  Save, X, Tag, Clock, AtSign
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

  // Related memories: share at least one tag
  const relatedMemories = allMemories
    .filter(m => m.id !== id && memory?.tags.some(t => m.tags.includes(t)))
    .slice(0, 4);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <Skeleton className="h-10 w-32 mb-8" />
        <Skeleton className="h-12 w-3/4 mb-6" />
        <div className="flex gap-4 mb-8">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="max-w-4xl mx-auto p-10 text-center">
        <h2 className="text-2xl font-bold mb-4">Воспоминание не найдено</h2>
        <Button asChild variant="outline">
          <Link href="/library">Вернуться в библиотеку</Link>
        </Button>
      </div>
    );
  }

  const Icon = memory.type === "link" ? LinkIcon : memory.type === "file" ? ImageIcon : FileText;

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 pb-20">
      <Link href="/library" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-lg">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Назад
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="secondary" className="flex items-center gap-1.5 bg-primary/10 text-primary py-1 px-3 rounded-lg text-sm">
              <Icon className="w-4 h-4" />
              {memory.type === "text" ? "Заметка" : memory.type === "link" ? "Ссылка" : "Файл"}
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {format(new Date(memory.createdAt), "d MMMM yyyy, HH:mm", { locale: ru })}
            </span>
          </div>

          {isEditing ? (
            <Input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="text-2xl font-bold h-12 text-lg border-border/60 bg-background"
            />
          ) : (
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
              {memory.title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={cancelEdit} className="rounded-xl gap-1.5">
                <X className="w-4 h-4" />Отмена
              </Button>
              <Button size="sm" onClick={saveEdit} disabled={updateMutation.isPending} className="rounded-xl gap-1.5">
                <Save className="w-4 h-4" />{updateMutation.isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="icon" className="rounded-xl border-border/60 hover:bg-muted" onClick={startEdit} title="Редактировать">
                <Edit className="w-4 h-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-xl border-border/60 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Удалить воспоминание?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Это действие нельзя отменить. Воспоминание будет удалено из базы знаний.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Отмена</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                      Да, удалить
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="mb-6 bg-muted/50 p-1 rounded-xl h-auto gap-1">
          <TabsTrigger value="content" className="rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
            <FileText className="w-4 h-4" />Содержание
          </TabsTrigger>
          <TabsTrigger value="summary" className="rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
            <BrainCircuit className="w-4 h-4" />AI Выжимка
          </TabsTrigger>
          <TabsTrigger value="entities" className="rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
            <Network className="w-4 h-4" />Сущности
          </TabsTrigger>
          <TabsTrigger value="related" className="rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
            <Hash className="w-4 h-4" />Похожие
            {relatedMemories.length > 0 && (
              <span className="ml-1 bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                {relatedMemories.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ─── CONTENT TAB ─── */}
        <TabsContent value="content" className="space-y-6">
          <div className="bg-card border border-border/60 rounded-3xl p-6 md:p-8 shadow-sm">
            {isEditing ? (
              <Textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="min-h-48 bg-background border-border/50 resize-none text-sm leading-relaxed"
                placeholder="Содержимое воспоминания..."
              />
            ) : memory.type === "link" ? (
              <div className="flex flex-col items-center text-center py-10 bg-muted/20 rounded-2xl">
                <LinkIcon className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <a href={memory.content} target="_blank" rel="noopener noreferrer" className="text-xl font-medium text-primary hover:underline flex items-center gap-2 mb-2 break-all px-4">
                  Открыть ссылку <ExternalLink className="w-5 h-5" />
                </a>
                <p className="text-muted-foreground">{memory.content}</p>
              </div>
            ) : (
              <div className="prose dark:prose-invert max-w-none text-foreground leading-loose">
                {memory.content.split("\n").map((paragraph, i) =>
                  paragraph ? <p key={i}>{paragraph}</p> : <br key={i} />
                )}
              </div>
            )}
          </div>

          {/* Tags (editable) */}
          <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
              <Tag className="w-4 h-4" />Теги
            </h3>
            {isEditing ? (
              <Input
                value={editTagsStr}
                onChange={e => setEditTagsStr(e.target.value)}
                placeholder="тег1, тег2, тег3"
                className="bg-background border-border/50"
              />
            ) : memory.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {memory.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="bg-secondary/60 hover:bg-secondary px-3 py-1.5 rounded-lg text-sm font-normal">
                    #{tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Нет тегов</p>
            )}
          </div>
        </TabsContent>

        {/* ─── SUMMARY TAB ─── */}
        <TabsContent value="summary">
          {memory.summary ? (
            <div className="space-y-6">
              <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="flex items-center gap-2 mb-4 text-primary font-semibold">
                  <BrainCircuit className="w-5 h-5" />
                  <span>Автоматическая выжимка</span>
                </div>
                <p className="text-foreground/90 leading-relaxed text-lg relative z-10">{memory.summary}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border/50 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-bold text-primary mb-1">
                    {memory.content.split(/\s+/).filter(Boolean).length}
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">слов</p>
                </div>
                <div className="bg-card border border-border/50 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-bold text-primary mb-1">
                    {memory.content.split(/[.!?]+/).filter(s => s.trim()).length}
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">предложений</p>
                </div>
                <div className="bg-card border border-border/50 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-bold text-primary mb-1">{memory.tags.length}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">тегов</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-card border border-border/50 rounded-3xl">
              <BrainCircuit className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Выжимка не сгенерирована</p>
            </div>
          )}
        </TabsContent>

        {/* ─── ENTITIES TAB ─── */}
        <TabsContent value="entities">
          <div className="space-y-6">
            {(memory.entities?.people?.length > 0 || memory.entities?.topics?.length > 0 || memory.entities?.dates?.length > 0) ? (
              <>
                {memory.entities.people?.length > 0 && (
                  <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-500" />Упомянутые люди
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {memory.entities.people.map((p: string) => (
                        <Badge key={p} variant="outline" className="px-3 py-1.5 rounded-xl text-sm border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950">
                          <User className="w-3 h-3 mr-1.5" />{p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {memory.entities.dates?.length > 0 && (
                  <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-green-500" />Даты
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {memory.entities.dates.map((d: string) => (
                        <Badge key={d} variant="outline" className="px-3 py-1.5 rounded-xl text-sm border-green-500/30 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950">
                          <Calendar className="w-3 h-3 mr-1.5" />{d}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {memory.entities.topics?.length > 0 && (
                  <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Hash className="w-5 h-5 text-purple-500" />Ключевые темы
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {memory.entities.topics.map((t: string) => (
                        <Badge key={t} variant="outline" className="px-3 py-1.5 rounded-xl text-sm border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-card border border-border/50 rounded-3xl">
                <Network className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">Сущности не извлечены</p>
                <p className="text-sm text-muted-foreground/70">Добавьте больше текста для автоматического извлечения</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── RELATED TAB ─── */}
        <TabsContent value="related">
          {relatedMemories.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Воспоминания, связанные общими тегами: {memory.tags.map(t => `#${t}`).join(", ")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedMemories.map(related => (
                  <MemoryCard key={related.id} memory={related} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-card border border-border/50 rounded-3xl">
              <Hash className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">Похожих воспоминаний нет</p>
              <p className="text-sm text-muted-foreground/70">
                Добавьте теги к воспоминаниям, чтобы видеть связанные материалы
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

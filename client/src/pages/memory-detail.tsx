import { useRoute, Link, useLocation } from "wouter";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { 
  ArrowLeft, Calendar, FileText, Link as LinkIcon, Image as ImageIcon, 
  Hash, User, Network, Trash2, Edit, ExternalLink, BrainCircuit
} from "lucide-react";
import { useMemory, useDeleteMemory } from "@/hooks/use-memories";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function MemoryDetail() {
  const [, params] = useRoute("/memory/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: memory, isLoading } = useMemory(id);
  const deleteMutation = useDeleteMemory();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <Skeleton className="h-10 w-32 mb-8" />
        <Skeleton className="h-12 w-3/4 mb-6" />
        <div className="flex gap-4 mb-8">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl mb-8" />
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

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Удалено", description: "Воспоминание удалено безвозвратно." });
      setLocation("/library");
    } catch (e) {
      toast({ variant: "destructive", title: "Ошибка", description: "Не удалось удалить." });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 pb-20">
      <Link href="/library" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-lg">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Назад
      </Link>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="secondary" className="flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 py-1 px-3 rounded-lg text-sm">
              <Icon className="w-4 h-4" />
              {memory.type === 'text' ? 'Заметка' : memory.type === 'link' ? 'Ссылка' : 'Файл'}
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {format(new Date(memory.createdAt), "d MMMM yyyy, HH:mm", { locale: ru })}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight text-balance">
            {memory.title}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="icon" className="rounded-xl border-border/60 hover:bg-muted" disabled>
            <Edit className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-xl border-border/60 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors">
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          
          {memory.summary && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3 text-primary font-medium">
                <BrainCircuit className="w-5 h-5" />
                <span>AI Выжимка</span>
              </div>
              <p className="text-foreground/90 leading-relaxed relative z-10">
                {memory.summary}
              </p>
            </div>
          )}

          <div className="bg-card border border-border/60 rounded-3xl p-6 md:p-8 shadow-sm">
            {memory.type === 'link' ? (
              <div className="flex flex-col items-center text-center py-10 bg-muted/20 rounded-2xl">
                <LinkIcon className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <a href={memory.content} target="_blank" rel="noopener noreferrer" className="text-xl font-medium text-primary hover:underline flex items-center gap-2 mb-2 break-all px-4">
                  Открыть ссылку <ExternalLink className="w-5 h-5" />
                </a>
                <p className="text-muted-foreground">{memory.content}</p>
              </div>
            ) : (
              <div className="prose dark:prose-invert max-w-none text-foreground leading-loose">
                {memory.content.split('\n').map((paragraph, i) => (
                  paragraph ? <p key={i}>{paragraph}</p> : <br key={i} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Metadata */}
        <div className="space-y-6">
          <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Hash className="w-5 h-5 text-muted-foreground" />
              Теги
            </h3>
            {memory.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {memory.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="bg-secondary/60 hover:bg-secondary px-3 py-1.5 rounded-lg text-sm font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Нет тегов</p>
            )}
          </div>

          {(memory.entities?.people?.length > 0 || memory.entities?.topics?.length > 0) && (
            <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Network className="w-5 h-5 text-muted-foreground" />
                Извлеченные сущности
              </h3>
              
              <div className="space-y-4">
                {memory.entities.people?.length > 0 && (
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
                      <User className="w-3 h-3" /> Люди
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {memory.entities.people.map((p: string) => (
                        <Badge key={p} variant="outline" className="rounded-md border-border/80 text-foreground">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {memory.entities.topics?.length > 0 && (
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
                      <Hash className="w-3 h-3" /> Темы
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {memory.entities.topics.map((t: string) => (
                        <Badge key={t} variant="outline" className="rounded-md border-border/80 text-foreground">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

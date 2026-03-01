import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Save, Link as LinkIcon, Type, File, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCreateMemory } from "@/hooks/use-memories";
import { Badge } from "@/components/ui/badge";

type MemoryType = 'text' | 'link' | 'file';

export default function Capture() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createMemory = useCreateMemory();

  const [type, setType] = useState<MemoryType>('text');
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const handleAddTag = (e: React.KeyboardEvent | React.FocusEvent) => {
    if ((e.type === 'keydown' && (e as React.KeyboardEvent).key === 'Enter') || e.type === 'blur') {
      e.preventDefault();
      if (tagInput.trim() && !tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
        setTagInput("");
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      // Simulate optimistic UI with a toast showing background processing
      toast({
        title: "Сохранение...",
        description: "Анализируем содержимое и извлекаем сущности.",
      });

      await createMemory.mutateAsync({
        title,
        content: type === 'link' ? link : content,
        type,
        tags,
        link: type === 'link' ? link : undefined,
      });

      toast({
        title: "Сохранено успешно",
        description: "Воспоминание добавлено в вашу библиотеку.",
        variant: "default",
      });

      setLocation("/library");
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить воспоминание.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Новое воспоминание</h1>
          <p className="text-muted-foreground mt-2">Сохраните идею, статью или документ.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Type Selector */}
          <div className="flex bg-muted/50 p-1.5 rounded-2xl w-full sm:w-fit">
            {[
              { id: 'text', icon: Type, label: 'Текст' },
              { id: 'link', icon: LinkIcon, label: 'Ссылка' },
              { id: 'file', icon: File, label: 'Файл' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id as MemoryType)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  type === t.id 
                    ? "bg-background shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>

          <div className="bg-card border border-border/60 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-medium">Заголовок *</Label>
              <Input 
                id="title" 
                placeholder="О чем это воспоминание?" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-14 text-lg rounded-xl bg-background border-border/50 focus:bg-background"
                required
              />
            </div>

            {type === 'text' && (
              <div className="space-y-2">
                <Label htmlFor="content" className="text-base font-medium">Содержимое</Label>
                <Textarea 
                  id="content" 
                  placeholder="Запишите свои мысли..." 
                  className="min-h-[200px] resize-y rounded-xl text-base p-4 border-border/50"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>
            )}

            {type === 'link' && (
              <div className="space-y-2">
                <Label htmlFor="link" className="text-base font-medium">URL ссылка *</Label>
                <Input 
                  id="link" 
                  type="url"
                  placeholder="https://..." 
                  className="h-12 rounded-xl"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  required
                />
              </div>
            )}

            {type === 'file' && (
              <div className="space-y-2">
                <Label className="text-base font-medium">Загрузка файла</Label>
                <div className="border-2 border-dashed border-border/60 rounded-2xl p-10 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group">
                  <div className="bg-background p-4 rounded-full shadow-sm border border-border/50 mb-4 group-hover:scale-110 transition-transform">
                    <File className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">Нажмите для выбора файла</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, изображения или документы (демо-режим)</p>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-4 border-t border-border/40">
              <Label htmlFor="tags" className="text-base font-medium">Теги (необязательно)</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map(tag => (
                  <Badge key={tag} className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5 rounded-lg flex items-center gap-1 font-normal text-sm">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-muted-foreground hover:text-foreground">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="relative">
                <Input 
                  id="tags" 
                  placeholder="Добавьте тег и нажмите Enter..." 
                  className="h-12 rounded-xl pl-10"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  onBlur={handleAddTag}
                />
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              size="lg" 
              className="h-14 px-8 rounded-2xl text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
              disabled={createMemory.isPending || !title.trim()}
            >
              {createMemory.isPending ? (
                "Сохранение..."
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Сохранить воспоминание
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

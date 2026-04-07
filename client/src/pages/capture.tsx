import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Save, Link as LinkIcon, Type, File, X, Hash,
  Upload, CheckCircle2, AlertCircle, FileImage, FileText, FileArchive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCreateMemory } from "@/hooks/use-memories";
import { Badge } from "@/components/ui/badge";

type MemoryType = "text" | "link" | "file";

interface SelectedFile {
  name: string;
  size: number;
  mimeType: string;
  lastModified: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar")) return FileArchive;
  return FileText;
}

function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "Изображение";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("word") || mimeType.includes("document")) return "Документ";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "Таблица";
  if (mimeType.includes("zip") || mimeType.includes("rar")) return "Архив";
  if (mimeType.startsWith("text/")) return "Текстовый файл";
  return "Файл";
}

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.gif,.webp,.zip,.csv,.xlsx";

export default function Capture() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createMemory = useCreateMemory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<MemoryType>("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleAddTag = (e: React.KeyboardEvent | React.FocusEvent) => {
    if ((e.type === "keydown" && (e as React.KeyboardEvent).key !== "Enter") ) return;
    if (e.type === "keydown") e.preventDefault();
    const val = tagInput.trim();
    if (val && !tags.includes(val)) {
      setTags([...tags, val]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => setTags(tags.filter(t => t !== tagToRemove));

  const processFile = (file: File) => {
    const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
    if (file.size > MAX_SIZE) {
      toast({ title: "Файл слишком большой", description: "Максимальный размер — 50 МБ", variant: "destructive" });
      return;
    }
    setSelectedFile({ name: file.name, size: file.size, mimeType: file.type || "application/octet-stream", lastModified: file.lastModified });
    // Pre-fill title from filename if empty
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^.]+$/, ""));
    }
    toast({ title: "Файл выбран", description: file.name });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Validation per type
    if (type === "link" && !link.trim()) {
      toast({ title: "Укажите URL", variant: "destructive" });
      return;
    }
    if (type === "file" && !selectedFile) {
      toast({ title: "Выберите файл", variant: "destructive" });
      return;
    }

    let memoryContent = content;
    if (type === "link") memoryContent = link;
    if (type === "file" && selectedFile) {
      // Store file metadata as structured content (MVP: no binary upload)
      memoryContent = [
        `[Файл: ${selectedFile.name}]`,
        `Тип: ${getFileCategory(selectedFile.mimeType)}`,
        `Размер: ${formatBytes(selectedFile.size)}`,
        `MIME: ${selectedFile.mimeType}`,
        content ? `\nОписание: ${content}` : "",
      ].filter(Boolean).join("\n");
    }

    toast({ title: "Сохранение...", description: "Анализируем содержимое." });

    try {
      await createMemory.mutateAsync({
        title: title.trim(),
        content: memoryContent,
        type,
        tags,
        link: type === "link" ? link : undefined,
      });

      toast({
        title: "Сохранено!",
        description: "Воспоминание добавлено в вашу библиотеку.",
      });
      setLocation("/library");
    } catch {
      toast({ title: "Ошибка", description: "Не удалось сохранить.", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Новое воспоминание</h1>
          <p className="text-muted-foreground mt-2">Сохраните идею, статью, ссылку или файл.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Type Selector */}
          <div className="flex bg-muted/50 p-1.5 rounded-2xl w-full sm:w-fit">
            {[
              { id: "text", icon: Type, label: "Текст" },
              { id: "link", icon: LinkIcon, label: "Ссылка" },
              { id: "file", icon: File, label: "Файл" },
            ].map(t => (
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
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-medium">Заголовок *</Label>
              <Input
                id="title"
                placeholder="О чем это воспоминание?"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="h-14 text-lg rounded-xl bg-background border-border/50"
                required
              />
            </div>

            {/* Text content */}
            {type === "text" && (
              <div className="space-y-2">
                <Label htmlFor="content" className="text-base font-medium">Содержимое *</Label>
                <Textarea
                  id="content"
                  placeholder="Запишите свои мысли..."
                  className="min-h-[200px] resize-y rounded-xl text-base p-4 border-border/50"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Link */}
            {type === "link" && (
              <div className="space-y-2">
                <Label htmlFor="link" className="text-base font-medium">URL *</Label>
                <Input
                  id="link"
                  type="url"
                  placeholder="https://..."
                  className="h-12 rounded-xl"
                  value={link}
                  onChange={e => setLink(e.target.value)}
                  required
                />
                <div className="space-y-2">
                  <Label htmlFor="link-notes" className="text-sm text-muted-foreground">Заметка (необязательно)</Label>
                  <Textarea
                    id="link-notes"
                    placeholder="Почему эта ссылка важна..."
                    className="min-h-[80px] resize-y rounded-xl text-sm p-3 border-border/50"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* File upload */}
            {type === "file" && (
              <div className="space-y-3">
                <Label className="text-base font-medium">Файл *</Label>

                {/* Hidden native input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  className="hidden"
                  onChange={handleFileInput}
                />

                {!selectedFile ? (
                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
                      isDragOver
                        ? "border-primary bg-primary/5 scale-[1.01]"
                        : "border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-primary/40"
                    }`}
                  >
                    <div className={`p-4 rounded-full shadow-sm border border-border/50 mb-4 transition-transform ${isDragOver ? "scale-110 bg-primary/10 text-primary border-primary/30" : "bg-background"}`}>
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">Нажмите или перетащите файл</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, Word, изображения, текстовые файлы · до 50 МБ</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-3 italic">
                      MVP: файл сохраняется локально как метаданные
                    </p>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="border border-border/60 rounded-2xl p-4 bg-card flex items-center gap-4"
                  >
                    <div className="bg-primary/10 text-primary p-3 rounded-xl shrink-0">
                      {(() => {
                        const Icon = getFileIcon(selectedFile.mimeType);
                        return <Icon className="w-6 h-6" />;
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{selectedFile.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{getFileCategory(selectedFile.mimeType)}</Badge>
                        <span className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <button
                        type="button"
                        onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {selectedFile && (
                  <div className="space-y-2">
                    <Label htmlFor="file-desc" className="text-sm text-muted-foreground">Описание файла (необязательно)</Label>
                    <Textarea
                      id="file-desc"
                      placeholder="О чем этот файл?"
                      className="min-h-[80px] resize-y rounded-xl text-sm p-3 border-border/50"
                      value={content}
                      onChange={e => setContent(e.target.value)}
                    />
                  </div>
                )}

                {!selectedFile && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      В MVP-режиме загружается только метаданные файла. Бинарное хранение требует серверного хранилища.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            <div className="space-y-3 pt-4 border-t border-border/40">
              <Label htmlFor="tags" className="text-base font-medium">Теги</Label>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <Badge key={tag} className="bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg flex items-center gap-1 font-normal text-sm">
                      #{tag}
                      <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-muted-foreground hover:text-foreground">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="relative">
                <Input
                  id="tags"
                  placeholder="Добавьте тег и нажмите Enter..."
                  className="h-12 rounded-xl pl-10"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  onBlur={e => {
                    const val = tagInput.trim();
                    if (val && !tags.includes(val)) {
                      setTags([...tags, val]);
                      setTagInput("");
                    }
                  }}
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

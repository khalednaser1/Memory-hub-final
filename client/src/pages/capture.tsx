import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Save, Link as LinkIcon, Type, File, X, Hash,
  Upload, CheckCircle2, FileImage, FileText, FileArchive, Sparkles,
  Loader2, Globe, FileCheck, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { fetchLinkMeta, useCreateMemory, uploadFile } from "@/hooks/use-memories";
import { Badge } from "@/components/ui/badge";

type MemoryType = "text" | "link" | "file";

interface UploadedFile {
  name: string;
  size: number;
  mimeType: string;
  filePath: string;
  extractedContent: string;
  wordCount: number;
  supported: boolean;
  message: string;
  pdfStatus?: string | null;
  pdfPageCount?: number | null;
  source: "server" | "local";
}

interface LinkMeta {
  title: string;
  domain: string;
  description: string;
  bodyText: string;
  success: boolean;
  tags: string[];
  extractionStatus: string;
  error?: string;
}

const GOOGLE_DRIVE_TAGS = ["google-drive", "drive", "ВКР", "материалы"];
const YOUTUBE_TAGS = ["youtube", "видео"];
const DEFAULT_LINK_TAGS = ["link", "source", "web"];

function parseUrl(value: string): URL | null {
  const raw = value.trim();
  if (!raw) return null;

  const candidate = /^[a-z][a-z\d+\-.]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(candidate);
  } catch {
    return null;
  }
}

function cleanDomain(hostname: string): string {
  return hostname.replace(/^www\./i, "");
}

function createLocalLinkMeta(value: string): LinkMeta | null {
  const parsed = parseUrl(value);
  if (!parsed) return null;

  const domain = cleanDomain(parsed.hostname);
  const host = domain.toLowerCase();

  if (host === "drive.google.com" || host === "docs.google.com" || host.endsWith(".drive.google.com") || host.endsWith(".docs.google.com")) {
    return {
      title: "Google Drive: материалы",
      domain,
      description: "Материалы Google Drive для ВКР",
      bodyText: "",
      success: true,
      tags: GOOGLE_DRIVE_TAGS,
      extractionStatus: "Резервный предпросмотр без извлечения текста",
    };
  }

  if (host === "youtube.com" || host === "youtu.be" || host.endsWith(".youtube.com")) {
    return {
      title: "YouTube: видео",
      domain,
      description: "Видео на YouTube",
      bodyText: "",
      success: true,
      tags: YOUTUBE_TAGS,
      extractionStatus: "Резервный предпросмотр без извлечения текста",
    };
  }

  return {
    title: domain || "Ссылка",
    domain,
    description: domain ? `Веб-ссылка: ${domain}` : "Веб-ссылка",
    bodyText: "",
    success: true,
    tags: DEFAULT_LINK_TAGS,
    extractionStatus: "Резервный предпросмотр без извлечения текста",
  };
}

function mergeTags(current: string[], suggested: string[]): string[] {
  const seen = new Set(current.map(tag => tag.toLowerCase()));
  const next = [...current];

  suggested.forEach(tag => {
    const normalized = tag.toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      next.push(tag);
    }
  });

  return next;
}

function replaceGeneratedTags(current: string[], suggested: string[], previousGenerated: string[]): string[] {
  const previous = new Set(previousGenerated.map(tag => tag.toLowerCase()));
  const nextSuggested = new Set(suggested.map(tag => tag.toLowerCase()));
  const preserved = current.filter(tag => {
    const normalized = tag.toLowerCase();
    return !previous.has(normalized) || nextSuggested.has(normalized);
  });

  return mergeTags(preserved, suggested);
}

type BackendLinkMeta = Awaited<ReturnType<typeof fetchLinkMeta>>;

function createBackendLinkMeta(meta: BackendLinkMeta, fallback: LinkMeta): LinkMeta {
  const bodyText = meta.bodyText.trim();
  const success = meta.success !== false;

  return {
    title: meta.title || fallback.title,
    domain: meta.domain || fallback.domain,
    description: meta.description || fallback.description,
    bodyText,
    success,
    tags: meta.tags?.length ? meta.tags : fallback.tags,
    extractionStatus: bodyText
      ? "Текст страницы извлечён для поиска"
      : success
        ? "Предпросмотр получен, текст страницы не найден"
        : "Текст страницы не извлечён",
    error: meta.error,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.includes("zip") || mimeType.includes("rar")) return FileArchive;
  return FileText;
}

function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "Изображение";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("word") || mimeType.includes("document")) return "Документ";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "Таблица";
  if (mimeType.includes("zip") || mimeType.includes("rar")) return "Архив";
  if (mimeType.startsWith("text/")) return "Текст";
  return "Файл";
}

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.gif,.webp,.zip,.csv";

const TYPE_OPTIONS = [
  { id: "text", icon: Type, label: "Текст", desc: "Заметка или мысль" },
  { id: "link", icon: LinkIcon, label: "Ссылка", desc: "Веб-страница" },
  { id: "file", icon: File, label: "Файл", desc: "Документ или изображение" },
];

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
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [linkMeta, setLinkMeta] = useState<LinkMeta | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFetchingLink, setIsFetchingLink] = useState(false);
  const generatedTitleRef = useRef("");
  const generatedTagsRef = useRef<string[]>([]);
  const linkFetchTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const linkRequestIdRef = useRef(0);

  const handleAddTag = (e: React.KeyboardEvent | React.FocusEvent) => {
    if (e.type === "keydown" && (e as React.KeyboardEvent).key !== "Enter") return;
    if (e.type === "keydown") e.preventDefault();
    const val = tagInput.trim();
    if (val && !tags.includes(val)) {
      setTags([...tags, val]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => setTags(tags.filter(t => t !== tagToRemove));

  useEffect(() => {
    return () => {
      if (linkFetchTimeoutRef.current) {
        window.clearTimeout(linkFetchTimeoutRef.current);
      }
      linkRequestIdRef.current += 1;
    };
  }, []);

  const applyGeneratedLinkMeta = useCallback((meta: LinkMeta) => {
    if (meta.title) {
      setTitle(currentTitle => {
        if (!currentTitle.trim() || currentTitle === generatedTitleRef.current) {
          generatedTitleRef.current = meta.title;
          return meta.title;
        }
        return currentTitle;
      });
    }

    if (meta.tags.length > 0) {
      setTags(currentTags => {
        const nextTags = replaceGeneratedTags(currentTags, meta.tags, generatedTagsRef.current);
        generatedTagsRef.current = meta.tags;
        return nextTags;
      });
    }
  }, []);

  const loadLinkMeta = useCallback(async (nextLink: string, fallbackMeta: LinkMeta, requestId: number) => {
    const parsed = parseUrl(nextLink);
    if (!parsed) return;

    try {
      const backendMeta = createBackendLinkMeta(await fetchLinkMeta(parsed.href), fallbackMeta);
      if (requestId !== linkRequestIdRef.current) return;

      setLinkMeta(backendMeta);
      applyGeneratedLinkMeta(backendMeta);
    } catch {
      if (requestId !== linkRequestIdRef.current) return;

      setLinkMeta(fallbackMeta);
      applyGeneratedLinkMeta(fallbackMeta);
    } finally {
      if (requestId === linkRequestIdRef.current) {
        setIsFetchingLink(false);
      }
    }
  }, [applyGeneratedLinkMeta]);

  const processFile = useCallback(async (file: File) => {
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast({ title: "Файл слишком большой", description: "Максимум 50 МБ", variant: "destructive" });
      return;
    }
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^.]+$/, ""));
    }
    setIsUploading(true);
    toast({ title: "Загрузка файла...", description: "Извлекаем содержимое." });
    try {
      const result = await uploadFile(file);
      setUploadedFile({
        name: result.fileName || file.name,
        size: result.fileSize || file.size,
        mimeType: result.fileMimeType || file.type || "application/octet-stream",
        filePath: result.filePath,
        extractedContent: result.extractedContent,
        wordCount: result.wordCount,
        supported: result.supported,
        message: result.message,
        pdfStatus: result.pdfStatus ?? null,
        pdfPageCount: result.pdfPageCount ?? null,
        source: result.source,
      });
      toast({
        title: result.source === "server"
          ? (result.supported ? "Текст успешно извлечён" : "Файл обработан через сервер")
          : (result.supported ? "Файл обработан локально" : "Файл сохранится локально"),
        description: result.message,
      });
    } catch (err) {
      toast({ title: "Ошибка загрузки", description: String(err), variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  }, [title, toast]);

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

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextLink = e.target.value;
    const fallbackMeta = createLocalLinkMeta(nextLink);

    setLink(nextLink);

    if (linkFetchTimeoutRef.current) {
      window.clearTimeout(linkFetchTimeoutRef.current);
    }

    if (!fallbackMeta) {
      linkRequestIdRef.current += 1;
      setLinkMeta(null);
      setIsFetchingLink(false);
      return;
    }

    const requestId = linkRequestIdRef.current + 1;
    linkRequestIdRef.current = requestId;
    setLinkMeta(null);
    setIsFetchingLink(true);
    linkFetchTimeoutRef.current = window.setTimeout(() => {
      void loadLinkMeta(nextLink, fallbackMeta, requestId);
    }, 500);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextTitle = e.target.value;
    if (nextTitle !== generatedTitleRef.current) {
      generatedTitleRef.current = "";
    }
    setTitle(nextTitle);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (type === "link" && !link.trim()) {
      toast({ title: "Укажите URL", variant: "destructive" });
      return;
    }
    if (type === "file" && !uploadedFile) {
      toast({ title: "Выберите файл", variant: "destructive" });
      return;
    }

    toast({ title: "Сохранение...", description: "Анализируем содержимое." });

    try {
      if (type === "link") {
        const fallbackMeta = linkMeta ?? createLocalLinkMeta(link);
        const finalTitle = title.trim() || fallbackMeta?.title || link.trim();

        await createMemory.mutateAsync({
          title: finalTitle,
          content: content || (fallbackMeta?.description ?? link),
          type: "link",
          tags,
          link,
          linkUrl: link,
          linkTitle: finalTitle,
          linkDomain: fallbackMeta?.domain || "",
          linkDescription: fallbackMeta?.description || "",
          extractedContent: fallbackMeta?.bodyText || "",
        });
      } else if (type === "file" && uploadedFile) {
        const fileProcessingStatus = uploadedFile.supported
          ? "done"
          : uploadedFile.pdfStatus === "scanned"
            ? "ocr_needed"
            : uploadedFile.pdfStatus === "protected"
              ? "protected"
              : "done";
        await createMemory.mutateAsync({
          title: title.trim(),
          content: content || `Файл: ${uploadedFile.name}`,
          type: "file",
          tags,
          filePath: uploadedFile.filePath,
          fileMimeType: uploadedFile.mimeType,
          fileSize: uploadedFile.size,
          extractedContent: uploadedFile.extractedContent,
          processingStatus: fileProcessingStatus,
        });
      } else {
        await createMemory.mutateAsync({
          title: title.trim(),
          content,
          type: "text",
          tags,
        });
      }

      toast({
        title: "Сохранено!",
        description: "Воспоминание сохранено в браузере и останется после перезагрузки.",
      });
      setLocation("/library");
    } catch {
      toast({ title: "Ошибка", description: "Не удалось сохранить воспоминание в браузере.", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-5 md:p-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-capture-title">Новое воспоминание</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-7">Сохраните идею, статью, ссылку или файл.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-2">
            {TYPE_OPTIONS.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id as MemoryType)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  type === t.id
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border/30 text-muted-foreground hover:border-border hover:text-foreground bg-card"
                }`}
                data-testid={`button-type-${t.id}`}
              >
                <div className={`p-2 rounded-lg ${type === t.id ? "bg-primary/10" : "bg-muted/60"}`}>
                  <t.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold">{t.label}</span>
                <span className="text-[10px] opacity-60">{t.desc}</span>
              </button>
            ))}
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 space-y-5 shadow-sm">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-medium text-muted-foreground">Заголовок *</Label>
              <Input
                id="title"
                placeholder="О чём это воспоминание?"
                value={title}
                onChange={handleTitleChange}
                className="h-12 text-base rounded-xl bg-muted/40 border-border/30"
                required
                data-testid="input-capture-title"
              />
            </div>

            {/* TEXT */}
            {type === "text" && (
              <div className="space-y-1.5">
                <Label htmlFor="content" className="text-xs font-medium text-muted-foreground">Содержимое *</Label>
                <Textarea
                  id="content"
                  placeholder="Запишите свои мысли..."
                  className="min-h-[180px] resize-y rounded-xl text-sm p-4 border-border/30 bg-muted/40"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  required
                  data-testid="input-capture-content"
                />
              </div>
            )}

            {/* LINK */}
            {type === "link" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="link" className="text-xs font-medium text-muted-foreground">URL *</Label>
                  <div className="relative">
                    <Input
                      id="link"
                      type="url"
                      placeholder="https://..."
                      className={`h-11 rounded-xl bg-muted/40 border-border/30 pr-10 ${isFetchingLink ? "opacity-70" : ""}`}
                      value={link}
                      onChange={handleLinkChange}
                      required
                      data-testid="input-capture-link"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isFetchingLink ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      ) : linkMeta?.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Globe className="w-4 h-4 text-muted-foreground/40" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Link preview card */}
                {linkMeta && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl border text-sm space-y-1 ${
                      linkMeta.success
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : "bg-amber-500/5 border-amber-500/20"
                    }`}
                  >
                    {linkMeta.success ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-medium text-foreground truncate">{linkMeta.title}</span>
                        </div>
                        {linkMeta.domain && <p className="text-[11px] text-muted-foreground">{linkMeta.domain}</p>}
                        {linkMeta.description && <p className="text-xs text-muted-foreground line-clamp-2">{linkMeta.description}</p>}
                        <p className={`text-[10px] ${linkMeta.bodyText ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                          {linkMeta.extractionStatus}
                        </p>
                      </>
                    ) : (
                      <div className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-xs font-medium truncate">{linkMeta.title || "Метаданные недоступны"}</p>
                          {linkMeta.domain && <p className="text-[11px] text-muted-foreground">{linkMeta.domain}</p>}
                          <p className="text-xs">{linkMeta.error || linkMeta.extractionStatus}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="link-notes" className="text-xs text-muted-foreground">Заметка (необязательно)</Label>
                  <Textarea
                    id="link-notes"
                    placeholder="Почему эта ссылка важна..."
                    className="min-h-[72px] resize-y rounded-xl text-sm p-3 border-border/30 bg-muted/40"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    data-testid="input-capture-notes"
                  />
                </div>
              </div>
            )}

            {/* FILE */}
            {type === "file" && (
              <div className="space-y-3">
                <Label className="text-xs font-medium text-muted-foreground">Файл *</Label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  className="hidden"
                  onChange={handleFileInput}
                />

                {!uploadedFile && !isUploading && (
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Выберите файл для загрузки"
                    onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                      isDragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border/40 bg-muted/20 hover:bg-muted/40 hover:border-primary/30"
                    }`}
                    data-testid="dropzone-file"
                  >
                    <div className={`p-3.5 rounded-2xl shadow-sm border border-border/30 mb-3 transition-transform ${isDragOver ? "scale-110 bg-primary/10 text-primary border-primary/20" : "bg-card"}`}>
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">Нажмите или перетащите файл</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, Word (.docx), .txt — извлечение текста · до 50 МБ</p>
                  </div>
                )}

                {isUploading && (
                  <div className="border border-border/30 rounded-xl p-6 bg-card flex flex-col items-center gap-3">
                    <Loader2 className="w-7 h-7 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Загрузка и извлечение текста...</p>
                  </div>
                )}

                {uploadedFile && !isUploading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="border border-border/30 rounded-xl p-4 bg-card space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary p-2.5 rounded-xl shrink-0">
                        {(() => {
                          const Icon = getFileIcon(uploadedFile.mimeType);
                          return <Icon className="w-5 h-5" />;
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" data-testid="text-file-name">{uploadedFile.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded">{getFileCategory(uploadedFile.mimeType)}</Badge>
                          <span className="text-xs text-muted-foreground">{formatBytes(uploadedFile.size)}</span>
                          {uploadedFile.wordCount > 0 && (
                            <span className="text-xs text-muted-foreground">{uploadedFile.wordCount} слов</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {uploadedFile.supported ? (
                          <FileCheck className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                          data-testid="button-remove-file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Extraction status */}
                    <div className={`flex items-start gap-2 p-2.5 rounded-lg text-xs ${
                      uploadedFile.supported
                        ? "bg-emerald-500/8 border border-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : uploadedFile.pdfStatus === "scanned"
                          ? "bg-blue-500/8 border border-blue-500/15 text-blue-700 dark:text-blue-400"
                          : uploadedFile.pdfStatus === "protected"
                            ? "bg-amber-500/8 border border-amber-500/15 text-amber-700 dark:text-amber-400"
                            : "bg-muted/60 border border-border/30 text-muted-foreground"
                    }`}>
                      {uploadedFile.supported
                        ? <FileCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        : <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                      <span>{uploadedFile.message}</span>
                    </div>

                    {/* Preview of extracted text */}
                    {uploadedFile.extractedContent && (
                      <div className="bg-muted/40 rounded-lg p-3 border border-border/30">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Предпросмотр текста</p>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                          {uploadedFile.extractedContent.slice(0, 300)}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {uploadedFile && (
                  <div className="space-y-1.5">
                    <Label htmlFor="file-desc" className="text-xs text-muted-foreground">Описание файла (необязательно)</Label>
                    <Textarea
                      id="file-desc"
                      placeholder="О чём этот файл?"
                      className="min-h-[72px] resize-y rounded-xl text-sm p-3 border-border/30 bg-muted/40"
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      data-testid="input-capture-file-desc"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3 pt-4 border-t border-border/20">
              <Label htmlFor="tags" className="text-xs font-medium text-muted-foreground">Теги</Label>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => (
                    <Badge key={tag} className="bg-secondary/70 text-secondary-foreground px-2.5 py-1 rounded-lg flex items-center gap-1 font-normal text-xs" data-testid={`badge-capture-tag-${tag}`}>
                      #{tag}
                      <button type="button" onClick={() => removeTag(tag)} className="ml-0.5 text-muted-foreground hover:text-foreground">
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
                  className="h-10 rounded-xl pl-9 bg-muted/40 border-border/30 text-sm"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  onBlur={() => {
                    const val = tagInput.trim();
                    if (val && !tags.includes(val)) {
                      setTags([...tags, val]);
                      setTagInput("");
                    }
                  }}
                  data-testid="input-capture-tags"
                />
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              className="h-12 px-8 rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
              disabled={createMemory.isPending || !title.trim() || isUploading}
              data-testid="button-save-memory"
            >
              {createMemory.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Сохранение...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" />Сохранить воспоминание</>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

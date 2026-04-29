import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type MemoryResponse, type SearchResponse, type CreateMemoryRequest, type UpdateMemoryRequest, type ChatRequest, type ChatResponse } from "@shared/schema";
import { withApiBase } from "@/lib/api-base";

const LOCAL_MEMORIES_KEY = "memoryhub_memories";

type MemoryWithLocalFlag = MemoryResponse & { __savedLocally?: boolean };
type SearchMemory = MemoryResponse & { relevanceScore: number; matchReason: string };

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(withApiBase(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });

  if (!res.ok) {
    let message = "Произошла ошибка";
    try {
      const data = await res.json();
      message = data.message || message;
    } catch {}
    throw new Error(message);
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

function readLocalMemories(): MemoryResponse[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_MEMORIES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalMemories(memories: MemoryResponse[]) {
  window.localStorage.setItem(LOCAL_MEMORIES_KEY, JSON.stringify(memories));
}

function mergeMemories(apiMemories: MemoryResponse[], localMemories: MemoryResponse[]) {
  const byId = new Map<number, MemoryResponse>();
  apiMemories.forEach(memory => byId.set(memory.id, memory));
  localMemories.forEach(memory => byId.set(memory.id, memory));
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || [];
}

function createSummary(content: string, extractedContent = "") {
  const text = (content || extractedContent || "").trim();
  if (!text) return "";
  const firstSentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean).slice(0, 2).join(". ");
  return (firstSentences || text).slice(0, 180);
}

function extractLocalTags(input: CreateMemoryRequest | UpdateMemoryRequest, fallbackText: string) {
  const explicitTags = (input.tags || []).map(tag => tag.trim()).filter(Boolean);
  if (explicitTags.length > 0) return Array.from(new Set(explicitTags));

  const stopWords = new Set([
    "это", "как", "для", "что", "или", "при", "над", "под", "the", "and", "with", "from", "this", "that",
  ]);
  const candidates = tokenize(fallbackText)
    .filter(token => token.length > 3 && !stopWords.has(token))
    .slice(0, 8);
  return Array.from(new Set(candidates)).slice(0, 5);
}

function extractLocalEntities(text: string) {
  const people = Array.from(new Set(text.match(/\b[А-ЯЁA-Z][а-яёa-z]+(?:\s+[А-ЯЁA-Z][а-яёa-z]+)?/g) || [])).slice(0, 5);
  const dates = Array.from(new Set(text.match(/\b(\d{1,2}\.\d{1,2}\.\d{2,4}|\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})\b/g) || []));
  const topics = extractLocalTags({}, text);
  return { people, dates, topics };
}

function recomputeLocalRelations(memories: MemoryResponse[]) {
  return memories.map(memory => {
    const relatedIds = memories
      .filter(other => other.id !== memory.id)
      .filter(other =>
        memory.tags.some(tag => other.tags.includes(tag)) ||
        (memory.entities?.topics || []).some(topic => (other.entities?.topics || []).includes(topic))
      )
      .map(other => other.id);
    return { ...memory, relatedIds };
  });
}

function createLocalMemory(input: CreateMemoryRequest): MemoryWithLocalFlag {
  const localMemories = readLocalMemories();
  const now = new Date().toISOString();
  const textForAnalysis = [
    input.title,
    input.content,
    input.extractedContent,
    input.linkDescription,
    input.linkTitle,
  ].filter(Boolean).join(" ");
  const tags = extractLocalTags(input, textForAnalysis);
  const memory: MemoryWithLocalFlag = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    title: input.title,
    content: input.content,
    type: input.type || (input.link ? "link" : "text"),
    createdAt: now as unknown as Date,
    tags,
    entities: extractLocalEntities(textForAnalysis),
    summary: createSummary(input.content, input.extractedContent),
    semanticSignature: tokenize(textForAnalysis).slice(0, 20).join(" "),
    relatedIds: [],
    extractedContent: input.extractedContent || "",
    filePath: input.filePath || "",
    fileMimeType: input.fileMimeType || "",
    fileSize: input.fileSize || 0,
    linkUrl: input.linkUrl || input.link || "",
    linkTitle: input.linkTitle || "",
    linkDomain: input.linkDomain || "",
    linkDescription: input.linkDescription || "",
    processingStatus: input.processingStatus || "done",
    __savedLocally: true,
  };

  const nextMemories = recomputeLocalRelations([memory, ...localMemories]);
  writeLocalMemories(nextMemories);
  return memory;
}

function updateLocalMemory(id: number, updates: UpdateMemoryRequest): MemoryResponse {
  const localMemories = readLocalMemories();
  const existing = localMemories.find(memory => memory.id === id);
  if (!existing) throw new Error("Local memory not found");

  const nextMemory = {
    ...existing,
    ...updates,
    tags: updates.tags ?? existing.tags,
    summary: updates.content || updates.extractedContent
      ? createSummary(updates.content ?? existing.content, updates.extractedContent ?? existing.extractedContent ?? "")
      : existing.summary,
  } as MemoryResponse;

  const nextMemories = recomputeLocalRelations(localMemories.map(memory => memory.id === id ? nextMemory : memory));
  writeLocalMemories(nextMemories);
  return nextMemory;
}

function deleteLocalMemory(id: number) {
  writeLocalMemories(recomputeLocalRelations(readLocalMemories().filter(memory => memory.id !== id)));
}

function localSearch(query: string, mode: "semantic" | "keyword"): SearchMemory[] {
  const queryText = query.trim().toLowerCase();
  const queryTokens = tokenize(queryText);
  if (queryTokens.length === 0) return [];

  return readLocalMemories()
    .map(memory => {
      const searchableText = [
        memory.title,
        memory.content,
        memory.summary,
        memory.extractedContent,
        memory.linkTitle,
        memory.linkDescription,
        memory.linkDomain,
        memory.tags.join(" "),
        memory.entities?.people?.join(" "),
        memory.entities?.topics?.join(" "),
      ].filter(Boolean).join(" ").toLowerCase();

      let score = 0;
      const reasons: string[] = [];
      if (searchableText.includes(queryText)) {
        score += mode === "keyword" ? 1 : 0.7;
        reasons.push("Точное совпадение");
      }

      const textTokens = new Set(tokenize(searchableText));
      const overlap = queryTokens.filter(token =>
        textTokens.has(token) || Array.from(textTokens).some(textToken => textToken.startsWith(token) || token.startsWith(textToken))
      ).length / queryTokens.length;
      if (overlap > 0) {
        score += overlap * (mode === "keyword" ? 0.55 : 0.8);
        reasons.push(mode === "keyword" ? "Ключевые слова" : "Локальная логика");
      }

      const tagMatch = memory.tags.some(tag => queryTokens.some(token => tag.toLowerCase().includes(token)));
      if (tagMatch) {
        score += 0.25;
        reasons.push("Теги");
      }

      return {
        ...memory,
        relevanceScore: Math.min(1, score),
        matchReason: reasons.slice(0, 3).join(" + ") || "Локальное совпадение",
      };
    })
    .filter(result => result.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

function mergeSearchResults(apiResults: SearchMemory[], localResults: SearchMemory[]) {
  const byId = new Map<number, SearchMemory>();
  apiResults.forEach(result => byId.set(result.id, result));
  localResults.forEach(result => byId.set(result.id, result));
  return Array.from(byId.values()).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

export function useMemories() {
  return useQuery({
    queryKey: [api.memories.list.path],
    queryFn: async () => {
      const localMemories = readLocalMemories();
      try {
        const apiMemories = await fetchApi<MemoryResponse[]>(api.memories.list.path);
        return mergeMemories(apiMemories, localMemories);
      } catch {
        return localMemories;
      }
    },
  });
}

export function useMemory(id: number) {
  return useQuery({
    queryKey: [api.memories.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.memories.get.path, { id });
      try {
        return await fetchApi<MemoryResponse>(url);
      } catch (err) {
        const localMemory = readLocalMemories().find(memory => memory.id === id);
        if (localMemory) return localMemory;
        throw err;
      }
    },
    enabled: !!id && !isNaN(id),
  });
}

export function useSearchMemories(query: string, mode: 'semantic' | 'keyword') {
  return useQuery({
    queryKey: [api.memories.search.path, query, mode],
    queryFn: async () => {
      const localResults = localSearch(query, mode);
      try {
        const apiResults = await fetchApi<SearchResponse>(api.memories.search.path, {
          method: api.memories.search.method,
          body: JSON.stringify({ query, mode }),
        });
        return { results: mergeSearchResults(apiResults.results, localResults) };
      } catch {
        return { results: localResults };
      }
    },
    enabled: query.length > 2,
  });
}

export function useCreateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMemoryRequest): Promise<MemoryWithLocalFlag> => {
      try {
        return await fetchApi<MemoryResponse>(api.memories.create.path, {
          method: api.memories.create.method,
          body: JSON.stringify(data),
        });
      } catch {
        return createLocalMemory(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.memories.list.path] });
    },
  });
}

export function useUpdateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & UpdateMemoryRequest) => {
      const url = buildUrl(api.memories.update.path, { id });
      try {
        return await fetchApi<MemoryResponse>(url, {
          method: api.memories.update.method,
          body: JSON.stringify(data),
        });
      } catch {
        return updateLocalMemory(id, data);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.memories.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.memories.get.path, variables.id] });
    },
  });
}

export function useDeleteMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.memories.delete.path, { id });
      try {
        return await fetchApi<void>(url, { method: api.memories.delete.method });
      } catch {
        deleteLocalMemory(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.memories.list.path] });
    },
  });
}

export function useChatMessage() {
  return useMutation({
    mutationFn: async (data: ChatRequest): Promise<ChatResponse> => {
      try {
        return await fetchApi<ChatResponse>(api.chat.path, {
          method: api.chat.method,
          body: JSON.stringify(data),
        });
      } catch {
        const results = localSearch(data.message, "semantic").slice(0, 3);
        if (results.length === 0) {
          return {
            content: "В локальной демонстрации я не нашёл подходящих воспоминаний. Добавьте запись в Capture или уточните вопрос.",
            sources: [],
          };
        }
        return {
          content: `Локальная демонстрация нашла ${results.length} подходящую запись:\n\n${results.map(result => `• **${result.title}** — ${result.summary || result.content.slice(0, 140)}`).join("\n")}`,
          sources: results.map(result => ({ id: result.id, title: result.title, type: result.type })),
        };
      }
    },
  });
}

export async function uploadFile(file: File): Promise<{
  filePath: string;
  fileName: string;
  fileMimeType: string;
  fileSize: number;
  extractedContent: string;
  wordCount: number;
  characterCount: number;
  supported: boolean;
  message: string;
}> {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const res = await fetch(withApiBase(api.upload.path), {
      method: api.upload.method,
      body: formData,
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Ошибка загрузки" }));
      throw new Error(err.message);
    }
    return res.json();
  } catch {
    const canReadText = file.type.startsWith("text/") || /\.(txt|md|csv)$/i.test(file.name);
    const extractedContent = canReadText ? await file.text() : "";
    const wordCount = extractedContent.split(/\s+/).filter(Boolean).length;
    return {
      filePath: `local:${file.name}`,
      fileName: file.name,
      fileMimeType: file.type || "application/octet-stream",
      fileSize: file.size,
      extractedContent,
      wordCount,
      characterCount: extractedContent.length,
      supported: canReadText,
      message: canReadText
        ? "Файл обработан локально для демонстрации. Он сохранится как запись в браузере."
        : "API недоступен: файл будет сохранён как локальная запись без загрузки содержимого.",
    };
  }
}

export async function fetchLinkMeta(url: string): Promise<{
  url: string;
  domain: string;
  title: string;
  description: string;
  bodyText: string;
  success: boolean;
  error?: string;
}> {
  const res = await fetch(withApiBase(api.fetchLink.path), {
    method: api.fetchLink.method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error("Не удалось загрузить метаданные ссылки");
  return res.json();
}

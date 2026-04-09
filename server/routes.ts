import type { Express } from "express";
import type { Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { extractTextFromFile } from "./file-processor";
import { fetchLinkMetadata } from "./link-processor";
import { answerQuery } from "./chat-engine";

// ─── File Upload Setup ────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const multerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "text/plain", "text/markdown", "text/csv",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "image/png", "image/jpeg", "image/gif", "image/webp",
      "application/zip",
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [".txt", ".md", ".csv", ".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".zip"];
    if (allowed.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(null, true); // Accept all; we'll handle unsupported gracefully
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ─── Memories CRUD ─────────────────────────────────────────────────────────

  app.get(api.memories.list.path, async (_req, res) => {
    const memories = await storage.getMemories();
    res.json(memories);
  });

  app.get(api.memories.get.path, async (req, res) => {
    const memory = await storage.getMemory(Number(req.params.id));
    if (!memory) return res.status(404).json({ message: "Memory not found" });
    res.json(memory);
  });

  app.post(api.memories.create.path, async (req, res) => {
    try {
      const input = api.memories.create.input.parse(req.body);
      const memory = await storage.createMemory(input);
      res.status(201).json(memory);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      }
      throw err;
    }
  });

  app.put(api.memories.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.memories.update.input.parse(req.body);
      const memory = await storage.updateMemory(id, input);
      res.json(memory);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      }
      return res.status(404).json({ message: "Memory not found" });
    }
  });

  app.delete(api.memories.delete.path, async (req, res) => {
    try {
      await storage.deleteMemory(Number(req.params.id));
      res.status(204).end();
    } catch {
      res.status(404).json({ message: "Memory not found" });
    }
  });

  app.post(api.memories.search.path, async (req, res) => {
    try {
      const input = api.memories.search.input.parse(req.body);
      const results = await storage.searchMemories(input.query, input.mode);
      res.json({ results });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // ─── File Upload ───────────────────────────────────────────────────────────
  app.post(api.upload.path, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Файл не загружен" });
      }

      const { path: filePath, originalname, mimetype, size } = req.file;

      const extraction = await extractTextFromFile(filePath, mimetype, originalname);

      res.json({
        filePath,
        fileName: originalname,
        fileMimeType: mimetype,
        fileSize: size,
        extractedContent: extraction.extractedText,
        wordCount: extraction.wordCount,
        characterCount: extraction.characterCount,
        supported: extraction.supported,
        message: extraction.message,
      });
    } catch (err) {
      console.error("File upload error:", err);
      res.status(500).json({ message: "Ошибка при обработке файла" });
    }
  });

  // ─── Link Metadata Fetch ────────────────────────────────────────────────────
  app.post(api.fetchLink.path, async (req, res) => {
    try {
      const { url } = api.fetchLink.input.parse(req.body);
      const metadata = await fetchLinkMetadata(url);
      res.json(metadata);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid URL" });
      }
      res.status(500).json({ message: "Ошибка при получении метаданных ссылки" });
    }
  });

  // ─── AI Chat ───────────────────────────────────────────────────────────────
  app.post(api.chat.path, async (req, res) => {
    try {
      const { message, history = [] } = api.chat.input.parse(req.body);
      const allMemories = await storage.getMemories();
      const result = await answerQuery(message, allMemories, history);
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("Chat error:", err);
      res.status(500).json({ message: "Ошибка AI-ассистента" });
    }
  });

  // ─── Seed Data ─────────────────────────────────────────────────────────────
  async function seedDatabase() {
    const existing = await storage.getMemories();
    if (existing.length === 0) {
      await storage.createMemory({
        title: "Отчёт по практике",
        type: "text",
        content: "Подробный отчёт о работе, проделанной за время летней практики на стартапе. Задачи: разработка API, интеграция БД, участие в код-ревью.",
        tags: ["работа", "отчёт", "практика"],
      });
      await storage.createMemory({
        title: "React Hooks — полный гайд",
        type: "text",
        content: "Полезные паттерны использования useEffect и useState для оптимизации ре-рендеров. Советы по мемоизации с useMemo и useCallback. React — библиотека для создания пользовательских интерфейсов.",
        tags: ["фронтенд", "react", "программирование"],
      });
      await storage.createMemory({
        title: "Идеи проектов 2024",
        type: "text",
        content: "Брейнсторм по пет-проектам. Возможно, сделать интеллектуальное приложение личной памяти? Или планировщик с ИИ-помощником? Идеи по стартапам в области образования.",
        tags: ["идеи", "2024", "проекты"],
      });
      await storage.createMemory({
        title: "Архитектура Memory Hub",
        type: "text",
        content: "Дипломный проект: система управления личными воспоминаниями. Стек: React + Vite + TypeScript + Express. Ключевые фичи: семантический поиск, граф связей, ИИ-ассистент. Backend на Node.js с Express.",
        tags: ["диплом", "проекты", "архитектура"],
      });
      await storage.createMemory({
        title: "Дизайн-ресурсы",
        type: "link",
        content: "Лучший источник вдохновения для UI-дизайна. Много паттернов SaaS дашбордов.",
        tags: ["дизайн", "ресурсы", "ui"],
        linkUrl: "https://dribbble.com",
        linkTitle: "Dribbble - Discover the World's Top Designers & Creative Professionals",
        linkDomain: "dribbble.com",
        linkDescription: "Dribbble is the leading destination to find & showcase creative work and home to the world's best design professionals.",
        extractedContent: "Dribbble — платформа для дизайнеров. Здесь можно найти вдохновение для UI/UX дизайна, изучить паттерны современных SaaS-продуктов.",
      });
      await storage.createMemory({
        title: "Алгоритм семантического поиска",
        type: "text",
        content: "Реализация семантического поиска: токенизация, TF-IDF векторы, косинусное сходство, синонимы, бонус за свежесть. Позволяет ранжировать результаты по релевантности без внешних LLM.",
        tags: ["алгоритм", "поиск", "ml", "программирование"],
      });
    }
  }

  await seedDatabase();
  return httpServer;
}

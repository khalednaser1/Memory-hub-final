import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get(api.memories.list.path, async (req, res) => {
    const memories = await storage.getMemories();
    res.json(memories);
  });

  app.get(api.memories.get.path, async (req, res) => {
    const memory = await storage.getMemory(Number(req.params.id));
    if (!memory) {
      return res.status(404).json({ message: 'Memory not found' });
    }
    res.json(memory);
  });

  app.post(api.memories.create.path, async (req, res) => {
    try {
      const input = api.memories.create.input.parse(req.body);
      // Simulate "Processing..." delay for AI mock
      await new Promise(resolve => setTimeout(resolve, 1500));
      const memory = await storage.createMemory(input);
      res.status(201).json(memory);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
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
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      return res.status(404).json({ message: 'Memory not found' });
    }
  });

  app.delete(api.memories.delete.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      await storage.deleteMemory(id);
      res.status(204).end();
    } catch (err) {
      res.status(404).json({ message: 'Memory not found' });
    }
  });

  app.post(api.memories.search.path, async (req, res) => {
    try {
      const input = api.memories.search.input.parse(req.body);
      const results = await storage.searchMemories(input.query, input.mode);
      res.json({ results });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Seed data for MVP testing
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
        content: "Полезные паттерны использования useEffect и useState для оптимизации ре-рендеров. Советы по мемоизации с useMemo и useCallback.",
        tags: ["фронтенд", "react", "программирование"],
      });
      await storage.createMemory({
        title: "Идеи проектов 2024",
        type: "text",
        content: "Брейнсторм по пет-проектам. Возможно, сделать интеллектуальное приложение личной памяти? Или планировщик с ИИ-помощником?",
        tags: ["идеи", "2024", "проекты"],
      });
      await storage.createMemory({
        title: "Архитектура Memory Hub",
        type: "text",
        content: "Дипломный проект: система управления личными воспоминаниями. Стек: React + Vite + TypeScript + Express. Ключевые фичи: семантический поиск, граф связей, ИИ-ассистент.",
        tags: ["диплом", "проекты", "архитектура"],
      });
      await storage.createMemory({
        title: "Дизайн-ресурсы",
        type: "link",
        content: "https://dribbble.com — лучший источник вдохновения для UI-дизайна. Много паттернов SaaS дашбордов.",
        tags: ["дизайн", "ресурсы", "ui"],
      });
      await storage.createMemory({
        title: "Алгоритм семантического поиска",
        type: "text",
        content: "Mock-реализация семантического поиска без внешних LLM: токенизация, пересечение слов, синонимы, бонус за свежесть. Позволяет ранжировать результаты по релевантности.",
        tags: ["алгоритм", "поиск", "ml", "программирование"],
      });
    }
  }

  await seedDatabase();

  return httpServer;
}

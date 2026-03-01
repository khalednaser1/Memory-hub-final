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
        title: "Practice document",
        content: "Detailed practice document outlining the work done during the summer internship at the startup.",
        tags: ["work", "report", "internship"],
      });
      await storage.createMemory({
        title: "React Hooks Guide",
        content: "Useful links and patterns for React useEffect and useState to prevent unnecessary re-renders.",
        tags: ["frontend", "react"],
      });
      await storage.createMemory({
        title: "Project Ideas 2024",
        content: "Brainstorming for side projects. Maybe an intelligent personal memory app?",
        tags: ["ideas", "2024"],
      });
    }
  }

  await seedDatabase();

  return httpServer;
}

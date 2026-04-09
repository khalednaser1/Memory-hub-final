import { type Memory, type InsertMemory, type UpdateMemoryRequest } from "@shared/schema";
import { searchMemories } from "./search-engine";
import { enrichMemory } from "./enrichment";

export interface IStorage {
  getMemories(): Promise<Memory[]>;
  getMemory(id: number): Promise<Memory | undefined>;
  createMemory(memory: InsertMemory): Promise<Memory>;
  updateMemory(id: number, updates: UpdateMemoryRequest): Promise<Memory>;
  deleteMemory(id: number): Promise<void>;
  searchMemories(query: string, mode: 'semantic' | 'keyword'): Promise<(Memory & { relevanceScore: number, matchReason: string })[]>;
}

export class MemStorage implements IStorage {
  private memories: Map<number, Memory>;
  private currentId: number;

  constructor() {
    this.memories = new Map();
    this.currentId = 1;
  }

  async getMemories(): Promise<Memory[]> {
    return Array.from(this.memories.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getMemory(id: number): Promise<Memory | undefined> {
    return this.memories.get(id);
  }

  async createMemory(insertMemory: InsertMemory): Promise<Memory> {
    const id = this.currentId++;
    const allTexts = Array.from(this.memories.values()).map(m =>
      [m.title, m.content, m.extractedContent || ""].join(" ")
    );

    const enriched = enrichMemory(
      insertMemory.title,
      insertMemory.content,
      insertMemory.extractedContent || "",
      insertMemory.tags || [],
      allTexts,
    );

    const memory: Memory = {
      id,
      title: insertMemory.title,
      content: insertMemory.content,
      type: insertMemory.type || (insertMemory.link ? "link" : "text"),
      createdAt: new Date(),
      tags: enriched.tags,
      entities: enriched.entities,
      summary: enriched.summary,
      semanticSignature: enriched.semanticSignature,
      relatedIds: [],
      // Extended fields
      extractedContent: insertMemory.extractedContent || "",
      filePath: insertMemory.filePath || "",
      fileMimeType: insertMemory.fileMimeType || "",
      fileSize: insertMemory.fileSize || 0,
      linkUrl: insertMemory.linkUrl || insertMemory.link || "",
      linkTitle: insertMemory.linkTitle || "",
      linkDomain: insertMemory.linkDomain || "",
      linkDescription: insertMemory.linkDescription || "",
      processingStatus: insertMemory.processingStatus || "done",
    };

    this.memories.set(id, memory);
    this.recomputeRelations();
    return memory;
  }

  async updateMemory(id: number, updates: UpdateMemoryRequest): Promise<Memory> {
    const existing = this.memories.get(id);
    if (!existing) throw new Error("Not found");

    // If significant content changed, re-enrich
    if (updates.content !== undefined || updates.title !== undefined || updates.extractedContent !== undefined) {
      const allTexts = Array.from(this.memories.values())
        .filter(m => m.id !== id)
        .map(m => [m.title, m.content, m.extractedContent || ""].join(" "));

      const newTitle = updates.title ?? existing.title;
      const newContent = updates.content ?? existing.content;
      const newExtracted = updates.extractedContent ?? existing.extractedContent ?? "";

      const enriched = enrichMemory(newTitle, newContent, newExtracted, existing.tags, allTexts);
      updates = {
        ...updates,
        tags: updates.tags ?? enriched.tags,
        entities: updates.entities ?? enriched.entities,
        summary: updates.summary ?? enriched.summary,
        semanticSignature: updates.semanticSignature ?? enriched.semanticSignature,
      };
    }

    const updated = { ...existing, ...updates };
    this.memories.set(id, updated);
    this.recomputeRelations();
    return updated;
  }

  async deleteMemory(id: number): Promise<void> {
    this.memories.delete(id);
    this.recomputeRelations();
  }

  async searchMemories(query: string, mode: 'semantic' | 'keyword'): Promise<(Memory & { relevanceScore: number, matchReason: string })[]> {
    const all = Array.from(this.memories.values());
    return searchMemories(all, query, mode);
  }

  private recomputeRelations() {
    const all = Array.from(this.memories.values());
    for (const m1 of all) {
      const related = new Set<number>();
      for (const m2 of all) {
        if (m1.id === m2.id) continue;
        let shared = 0;
        m1.tags.forEach(t => { if (m2.tags.includes(t)) shared++; });
        (m1.entities?.people || []).forEach(p => { if ((m2.entities?.people || []).includes(p)) shared++; });
        (m1.entities?.topics || []).forEach(t => { if ((m2.entities?.topics || []).includes(t)) shared++; });
        if (shared > 0) related.add(m2.id);
      }
      m1.relatedIds = Array.from(related);
      this.memories.set(m1.id, m1);
    }
  }
}

export const storage = new MemStorage();

import { pgTable, text, serial, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const memories = pgTable("memories", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // text, link, file
  createdAt: timestamp("created_at").defaultNow().notNull(),
  tags: text("tags").array().notNull().default([]),
  entities: jsonb("entities").notNull().$type<{ people: string[]; dates: string[]; topics: string[] }>().default({ people: [], dates: [], topics: [] }),
  summary: text("summary").notNull().default(""),
  semanticSignature: text("semantic_signature").notNull().default(""),
  relatedIds: integer("related_ids").array().notNull().default([]),
});

export const insertMemorySchema = createInsertSchema(memories).omit({
  id: true,
  createdAt: true,
  tags: true,
  entities: true,
  summary: true,
  semanticSignature: true,
  relatedIds: true
}).extend({
  tags: z.array(z.string()).optional(),
  link: z.string().optional(),
});

export type Memory = typeof memories.$inferSelect;
export type InsertMemory = z.infer<typeof insertMemorySchema>;

// Request Types
export type CreateMemoryRequest = InsertMemory;
export type UpdateMemoryRequest = Partial<InsertMemory>;

// Response Types
export type MemoryResponse = Memory;
export type MemoriesListResponse = Memory[];
export type SearchResult = Memory & { relevanceScore: number; matchReason: string };
export type SearchResponse = {
  results: SearchResult[];
};

export type SearchRequest = {
  query: string;
  mode: 'semantic' | 'keyword';
};

import { z } from 'zod';
import { insertMemorySchema, memories } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  memories: {
    list: {
      method: 'GET' as const,
      path: '/api/memories' as const,
      responses: {
        200: z.array(z.custom<typeof memories.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/memories/:id' as const,
      responses: {
        200: z.custom<typeof memories.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/memories' as const,
      input: insertMemorySchema,
      responses: {
        201: z.custom<typeof memories.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/memories/:id' as const,
      input: insertMemorySchema.partial(),
      responses: {
        200: z.custom<typeof memories.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/memories/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    search: {
      method: 'POST' as const,
      path: '/api/search' as const,
      input: z.object({
        query: z.string(),
        mode: z.enum(['semantic', 'keyword']),
      }),
      responses: {
        200: z.object({
          results: z.array(
            z.custom<typeof memories.$inferSelect>().and(
              z.object({
                relevanceScore: z.number(),
                matchReason: z.string(),
              })
            )
          ),
        }),
      },
    },
  },
  upload: {
    method: 'POST' as const,
    path: '/api/upload' as const,
  },
  fileDownload: {
    method: 'GET' as const,
    path: '/api/files/:filename' as const,
  },
  fileView: {
    method: 'GET' as const,
    path: '/api/files/:filename/view' as const,
  },
  fetchLink: {
    method: 'POST' as const,
    path: '/api/fetch-link' as const,
    input: z.object({ url: z.string() }),
  },
  chat: {
    method: 'POST' as const,
    path: '/api/chat' as const,
    input: z.object({
      message: z.string(),
      history: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })).optional(),
    }),
  },
  status: {
    method: 'GET' as const,
    path: '/api/status' as const,
    responses: {
      200: z.object({
        aiAvailable: z.boolean(),
        modelName: z.string(),
      }),
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

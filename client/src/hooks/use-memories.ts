import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type MemoryResponse, type SearchResponse, type CreateMemoryRequest, type UpdateMemoryRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
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
    } catch (e) {
      // Ignore
    }
    throw new Error(message);
  }
  
  if (res.status === 204) return {} as T;
  return res.json();
}

export function useMemories() {
  return useQuery({
    queryKey: [api.memories.list.path],
    queryFn: () => fetchApi<MemoryResponse[]>(api.memories.list.path),
  });
}

export function useMemory(id: number) {
  return useQuery({
    queryKey: [api.memories.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.memories.get.path, { id });
      return fetchApi<MemoryResponse>(url);
    },
    enabled: !!id && !isNaN(id),
  });
}

export function useSearchMemories(query: string, mode: 'semantic' | 'keyword') {
  return useQuery({
    queryKey: [api.memories.search.path, query, mode],
    queryFn: () => fetchApi<SearchResponse>(api.memories.search.path, {
      method: api.memories.search.method,
      body: JSON.stringify({ query, mode }),
    }),
    enabled: query.length > 2,
  });
}

export function useCreateMemory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateMemoryRequest) => 
      fetchApi<MemoryResponse>(api.memories.create.path, {
        method: api.memories.create.method,
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.memories.list.path] });
    },
  });
}

export function useUpdateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & UpdateMemoryRequest) => {
      const url = buildUrl(api.memories.update.path, { id });
      return fetchApi<MemoryResponse>(url, {
        method: api.memories.update.method,
        body: JSON.stringify(data),
      });
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
    mutationFn: (id: number) => {
      const url = buildUrl(api.memories.delete.path, { id });
      return fetchApi<void>(url, { method: api.memories.delete.method });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.memories.list.path] });
    },
  });
}

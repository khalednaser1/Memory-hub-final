export const API_BASE = "https://memory-hub-backend.onrender.com";

export function withApiBase(path: string) {
  if (!path) return API_BASE;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

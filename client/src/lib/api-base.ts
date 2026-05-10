export const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export function withApiBase(path: string) {
  if (!path) return API_BASE;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (!API_BASE) return path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const clientRoot = path.resolve(import.meta.dirname);
const clientNodeModules = path.resolve(clientRoot, "node_modules");
const repoRoot = path.resolve(clientRoot, "..");

function dependencyPath(packageName: string) {
  const clientPackagePath = path.resolve(clientNodeModules, packageName);
  if (fs.existsSync(clientPackagePath)) return clientPackagePath;
  return path.resolve(repoRoot, "node_modules", packageName);
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === "development" ? [runtimeErrorOverlay()] : []),
  ],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(clientRoot, "src") },
      { find: "@shared", replacement: path.resolve(clientRoot, "../shared") },
      { find: "@assets", replacement: path.resolve(clientRoot, "../attached_assets") },
      { find: "zod", replacement: dependencyPath("zod") },
      { find: "drizzle-zod", replacement: dependencyPath("drizzle-zod") },
      { find: "drizzle-orm", replacement: dependencyPath("drizzle-orm") },
    ],
    dedupe: ["zod", "drizzle-zod", "drizzle-orm"],
  },
  root: clientRoot,
  build: {
    outDir: path.resolve(clientRoot, "dist"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
}));

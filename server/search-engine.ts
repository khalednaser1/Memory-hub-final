import { type Memory } from "@shared/schema";

// ─── Russian synonym map ───────────────────────────────────────────────────────
const SYNONYMS: Record<string, string[]> = {
  учёба: ["образование", "обучение", "учить", "изучать", "университет", "курс"],
  работа: ["практика", "проект", "задача", "стажировка", "офис", "компания"],
  проект: ["разработка", "приложение", "система", "продукт", "стартап"],
  идея: ["концепция", "мысль", "вдохновение", "план", "предложение"],
  дизайн: ["ui", "ux", "интерфейс", "макет", "верстка", "стиль"],
  программ: ["код", "разработка", "frontend", "backend", "алгоритм"],
  поиск: ["найти", "искать", "запрос", "фильтр", "результат"],
  диплом: ["дипломная", "дипломный", "курсовая", "защита"],
  статья: ["материал", "текст", "документ", "заметка", "публикация"],
  react: ["реакт", "jsx", "component", "hook", "usestate", "useeffect", "vite"],
  алгоритм: ["метод", "подход", "реализация", "логика", "функция"],
  семантика: ["смысл", "значение", "контекст", "nlp", "embedding"],
  фронтенд: ["frontend", "react", "css", "html", "javascript", "typescript"],
  бэкенд: ["backend", "server", "api", "express", "node"],
  база: ["db", "database", "хранилище", "данные", "postgres", "sql"],
  learn: ["study", "education", "training", "course", "tutorial"],
  work: ["job", "task", "project", "internship", "career"],
  bug: ["error", "issue", "problem", "fix", "debug"],
  api: ["endpoint", "request", "response", "rest", "http"],
  frontend: ["client", "web", "react", "vue", "angular"],
  backend: ["server", "api", "logic", "node", "express"],
  ml: ["machine", "learning", "ai", "neural", "model", "gpt", "llm"],
  файл: ["документ", "pdf", "docx", "загрузить", "вложение"],
  ссылка: ["link", "url", "сайт", "страница", "web"],
};

// ─── Tokenizer ────────────────────────────────────────────────────────────────
function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/\b[a-zа-яёa-z0-9]{2,}\b/gi) || []);
}

// ─── TF-IDF vector from signature ─────────────────────────────────────────────
function signatureTokens(sig: string): Set<string> {
  return new Set(sig.toLowerCase().split(/\s+/).filter(Boolean));
}

// ─── Search signal computation ────────────────────────────────────────────────
function computeTokenOverlap(queryTokens: string[], text: string): number {
  const querySet = new Set(queryTokens);
  const textTokens = tokenize(text);
  let matches = 0;
  for (const token of textTokens) {
    if (querySet.has(token)) matches++;
    if (token.length >= 4) {
      for (const qt of queryTokens) {
        if (qt.length >= 4 && (token.startsWith(qt.slice(0, 4)) || qt.startsWith(token.slice(0, 4)))) {
          matches += 0.4;
        }
      }
    }
  }
  return queryTokens.length > 0 ? Math.min(1, matches / queryTokens.length) : 0;
}

function findSynonymScore(queryTokens: string[], text: string): number {
  const textSet = new Set(tokenize(text));
  let score = 0;
  for (const qt of queryTokens) {
    const syns = SYNONYMS[qt] || [];
    for (const syn of syns) {
      if (textSet.has(syn)) score += 0.6;
    }
    for (const [key, syns2] of Object.entries(SYNONYMS)) {
      if (syns2.includes(qt) && textSet.has(key)) score += 0.4;
    }
  }
  return score;
}

function semanticSignatureScore(queryTokens: string[], memory: Memory): number {
  if (!memory.semanticSignature) return 0;
  const sigSet = signatureTokens(memory.semanticSignature);
  let matches = 0;
  for (const qt of queryTokens) {
    if (sigSet.has(qt)) matches++;
    // Stem matching (4-char prefix)
    if (qt.length >= 4) {
      for (const st of sigSet) {
        if (st.length >= 4 && st.startsWith(qt.slice(0, 4))) { matches += 0.5; break; }
      }
    }
  }
  return queryTokens.length > 0 ? Math.min(1, matches / queryTokens.length) : 0;
}

function tagScore(queryTokens: string[], memory: Memory): number {
  const tags = memory.tags.map(t => t.toLowerCase());
  let score = 0;
  for (const tag of tags) {
    for (const qt of queryTokens) {
      if (tag === qt) score += 2.0;
      else if (tag.includes(qt) || qt.includes(tag)) score += 0.8;
    }
  }
  return score;
}

function recencyBonus(memory: Memory): number {
  const daysSince = (Date.now() - new Date(memory.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, 0.5 - daysSince / 120);
}

export function searchMemories(
  memories: Memory[],
  query: string,
  mode: "semantic" | "keyword"
): (Memory & { relevanceScore: number; matchReason: string })[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const queryTokens = tokenize(q);
  const results: (Memory & { relevanceScore: number; matchReason: string })[] = [];

  for (const m of memories) {
    // Build the full searchable text including extracted content
    const fullText = [
      m.title,
      m.content,
      m.extractedContent || "",
      m.summary,
      m.tags.join(" "),
      m.linkTitle || "",
      m.linkDescription || "",
      m.linkDomain || "",
      (m.entities?.topics || []).join(" "),
      (m.entities?.people || []).join(" "),
    ].join(" ").toLowerCase();

    let score = 0;
    const reasons: string[] = [];

    if (mode === "keyword") {
      if (fullText.includes(q)) {
        score = 1.0;
        reasons.push("Точное совпадение");
      } else {
        const overlap = computeTokenOverlap(queryTokens, fullText);
        if (overlap > 0) {
          score += overlap * 0.8;
          reasons.push(`Совпадение ${Math.round(overlap * 100)}%`);
        }
      }
      const ts = tagScore(queryTokens, m);
      if (ts > 0) { score += Math.min(0.2, ts * 0.1); reasons.push("Теги"); }
    } else {
      // Semantic mode

      // 1. Exact phrase
      if (fullText.includes(q)) {
        score += 0.7;
        reasons.push("Точная фраза");
      }

      // 2. Title overlap (highest weight)
      const titleOverlap = computeTokenOverlap(queryTokens, m.title);
      if (titleOverlap > 0) {
        score += titleOverlap * 0.55;
        reasons.push("Заголовок");
      }

      // 3. Content + extracted content overlap
      const contentOverlap = computeTokenOverlap(queryTokens, `${m.content} ${m.extractedContent || ""} ${m.summary}`);
      if (contentOverlap > 0) {
        score += contentOverlap * 0.35;
        if (!reasons.includes("Заголовок")) reasons.push(`Контент (${Math.round(contentOverlap * 100)}%)`);
      }

      // 4. Semantic signature (TF-IDF match)
      const sigScore = semanticSignatureScore(queryTokens, m);
      if (sigScore > 0.1) {
        score += sigScore * 0.3;
        if (reasons.length < 3) reasons.push("Семантика");
      }

      // 5. Synonym expansion
      const synScore = findSynonymScore(queryTokens, fullText);
      if (synScore > 0) {
        score += Math.min(0.3, synScore * 0.1);
        if (reasons.length < 3) reasons.push("Синонимы");
      }

      // 6. Tag boost
      const ts = tagScore(queryTokens, m);
      if (ts > 0) {
        score += Math.min(0.3, ts * 0.12);
        if (reasons.length < 3) reasons.push("Теги");
      }

      // 7. Entity topics
      const entityText = (m.entities?.topics || []).join(" ").toLowerCase();
      const entityOverlap = computeTokenOverlap(queryTokens, entityText);
      if (entityOverlap > 0) { score += entityOverlap * 0.2; }

      // 8. Link-specific fields bonus
      if (m.type === "link" && (m.linkTitle || m.linkDescription)) {
        const linkOverlap = computeTokenOverlap(queryTokens, `${m.linkTitle} ${m.linkDescription}`);
        if (linkOverlap > 0) { score += linkOverlap * 0.2; if (reasons.length < 3) reasons.push("Ссылка"); }
      }

      // 9. Recency
      score += recencyBonus(m) * 0.05;
    }

    if (score > 0.05) {
      results.push({
        ...m,
        relevanceScore: Math.min(1, score),
        matchReason: reasons.slice(0, 3).join(" + ") || "Релевантно",
      });
    }
  }

  return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

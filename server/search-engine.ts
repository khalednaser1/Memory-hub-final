import { type Memory } from "@shared/schema";

// ─── Russian / multilingual synonym map (stem-keyed) ─────────────────────────
// Keys are canonical stems (4–6 chars). Values are conceptually related terms.
const SYNONYMS: Record<string, string[]> = {
  // ─── PKM / Knowledge management ──────────────────────────────────────────
  знани:      ["информация", "заметки", "записи", "база", "память", "воспоминания", "knowledge", "note", "документ", "контент"],
  памят:      ["воспоминания", "записи", "заметки", "хранение", "memory", "знания", "mind"],
  воспомина:  ["память", "знания", "заметки", "записи", "memory", "archive"],
  заметк:     ["записи", "notes", "текст", "документ", "note", "память", "знания", "информация"],
  запис:      ["заметки", "notes", "документ", "текст", "память", "знания", "информация"],
  хранени:    ["база", "storage", "archive", "библиотека", "коллекция", "управление", "система"],
  управлени:  ["менеджмент", "организация", "хранение", "ведение", "management", "system", "систем"],
  библиотек:  ["коллекция", "хранилище", "база", "архив", "library", "catalog"],
  коллекци:   ["библиотека", "хранилище", "база", "архив", "собрание"],
  архив:      ["библиотека", "хранилище", "база", "коллекция", "archive"],
  // ─── Systems / tools ─────────────────────────────────────────────────────
  систем:     ["приложение", "инструмент", "платформа", "программа", "сервис", "tool", "system", "app", "solution", "продукт"],
  приложени:  ["программа", "система", "сервис", "инструмент", "app", "tool", "платформа"],
  инструмент: ["tool", "программа", "приложение", "система", "сервис", "утилита"],
  платформ:   ["система", "сервис", "инструмент", "приложение", "solution"],
  продукт:    ["система", "приложение", "проект", "решение", "сервис"],
  решени:     ["продукт", "система", "подход", "метод", "solution"],
  // ─── PKM-specific tools ───────────────────────────────────────────────────
  notion:     ["заметки", "pkm", "документы", "записи", "база", "воспоминания", "workspace"],
  obsidian:   ["заметки", "pkm", "граф", "знания", "база", "vault", "links"],
  roam:       ["заметки", "pkm", "граф", "знания", "notion", "obsidian"],
  logseq:     ["заметки", "pkm", "граф", "знания", "bullets"],
  pkm:        ["notion", "obsidian", "roam", "logseq", "заметки", "знания", "knowledge", "memory", "воспоминания"],
  memory:     ["воспоминания", "память", "заметки", "pkm", "knowledge", "знания"],
  hub:        ["center", "platform", "система", "база", "узел", "портал"],
  // ─── People / personal ────────────────────────────────────────────────────
  личн:       ["персональный", "личный", "собственный", "приватный", "personal", "индивидуальный", "private", "my"],
  персональн: ["личный", "собственный", "приватный", "individual", "personal", "частный"],
  // ─── Intelligence / AI ───────────────────────────────────────────────────
  умн:        ["интеллектуальный", "ai", "ml", "smart", "intelligent", "clever"],
  интеллект:  ["умный", "ai", "ml", "smart", "intelligent", "нейронный", "gpt"],
  граф:       ["связи", "сеть", "connections", "network", "узлы", "визуализация", "граф"],
  // ─── Academic / project ──────────────────────────────────────────────────
  учёба:      ["образование", "обучение", "учить", "изучать", "университет", "курс"],
  образован:  ["учёба", "обучение", "университет", "академия", "учить"],
  обучен:     ["учёба", "образование", "training", "курс", "learn"],
  работа:     ["практика", "проект", "задача", "стажировка", "офис", "компания"],
  проект:     ["разработка", "приложение", "система", "продукт", "стартап", "work", "task"],
  диплом:     ["дипломная", "дипломный", "курсовая", "защита", "вкр", "тезис", "degree"],
  стартап:    ["проект", "компания", "бизнес", "продукт", "startup"],
  идея:       ["концепция", "мысль", "вдохновение", "план", "предложение", "concept"],
  концепц:    ["идея", "мысль", "план", "подход", "concept", "vision"],
  // ─── Design ──────────────────────────────────────────────────────────────
  дизайн:     ["ui", "ux", "интерфейс", "макет", "верстка", "стиль", "design"],
  интерфейс:  ["ui", "дизайн", "frontend", "экран", "форма"],
  // ─── Programming ─────────────────────────────────────────────────────────
  программ:   ["код", "разработка", "frontend", "backend", "алгоритм", "code"],
  разработк:  ["программирование", "код", "проект", "инженерия", "dev"],
  поиск:      ["найти", "искать", "запрос", "фильтр", "результат", "search"],
  алгоритм:   ["метод", "подход", "реализация", "логика", "функция", "logic"],
  семантик:   ["смысл", "значение", "контекст", "nlp", "embedding", "поиск"],
  статья:     ["материал", "текст", "документ", "заметка", "публикация", "article"],
  фронтенд:   ["frontend", "react", "css", "html", "javascript", "typescript", "ui"],
  бэкенд:     ["backend", "server", "api", "express", "node"],
  база:       ["db", "database", "хранилище", "данные", "postgres", "sql", "библиотека"],
  данные:     ["база", "db", "storage", "информация", "records"],
  // ─── English tech stems ───────────────────────────────────────────────────
  learn:      ["study", "education", "training", "course", "tutorial", "обучение"],
  work:       ["job", "task", "project", "internship", "career", "работа"],
  bug:        ["error", "issue", "problem", "fix", "debug"],
  api:        ["endpoint", "request", "response", "rest", "http", "backend"],
  frontend:   ["client", "web", "react", "vue", "angular", "ui"],
  backend:    ["server", "api", "logic", "node", "express", "бэкенд"],
  ml:         ["machine", "learning", "ai", "neural", "model", "gpt", "llm", "нейронный"],
  react:      ["реакт", "jsx", "component", "hook", "usestate", "useeffect", "vite", "фронтенд"],
  // ─── Files / media ────────────────────────────────────────────────────────
  файл:       ["документ", "pdf", "docx", "загрузить", "вложение", "file"],
  документ:   ["файл", "текст", "статья", "заметка", "doc", "file"],
  ссылка:     ["link", "url", "сайт", "страница", "web", "website"],
  сайт:       ["ссылка", "url", "страница", "web", "link"],
};

// ─── Concept clusters: multi-word phrase → concept injection ────────────────
// When ALL triggers (4-char stems) appear in the query, inject extra tokens
// that conceptually expand the search to cover paraphrased memories.
const CONCEPT_CLUSTERS: Array<{
  triggers: string[];
  inject: string[];
  label: string;
}> = [
  // "личных знаний" / "личная память" → PKM
  {
    triggers: ["знан", "личн"],
    inject: ["pkm", "воспоминания", "заметки", "записи", "память", "memory", "hub", "notion", "obsidian"],
    label: "PKM",
  },
  // "управление знаниями" → PKM
  {
    triggers: ["знан", "управ"],
    inject: ["pkm", "воспоминания", "заметки", "notion", "obsidian", "память", "memory"],
    label: "PKM",
  },
  // "система знаний" / "системы для знаний" → PKM
  {
    triggers: ["сист", "знан"],
    inject: ["pkm", "воспоминания", "заметки", "записи", "memory", "hub"],
    label: "PKM",
  },
  // "хранение знаний" / "хранилище знаний" → PKM
  {
    triggers: ["хран", "знан"],
    inject: ["база", "воспоминания", "заметки", "библиотека", "memory"],
    label: "PKM",
  },
  // "личная память" → PKM
  {
    triggers: ["личн", "памят"],
    inject: ["воспоминания", "заметки", "memory", "записи", "pkm", "знания", "hub"],
    label: "Личная память",
  },
  // "база данных" / "хранение данных" → DB
  {
    triggers: ["база", "данн"],
    inject: ["database", "db", "postgres", "sql", "хранилище", "storage"],
    label: "БД",
  },
  // "машинное обучение" / "machine learning" → ML/AI
  {
    triggers: ["машин", "обуч"],
    inject: ["ml", "ai", "нейронный", "модель", "gpt", "алгоритм", "learning"],
    label: "ML",
  },
  // "семантический поиск" → NLP
  {
    triggers: ["сема", "поис"],
    inject: ["nlp", "embedding", "tfidf", "алгоритм", "relevant", "similarity"],
    label: "Семпоиск",
  },
  // "ИИ ассистент" / "AI помощник" → AI
  {
    triggers: ["ассис", "ии"],
    inject: ["ai", "gpt", "chatbot", "assistant", "nlp", "llm"],
    label: "ИИ",
  },
  // "граф связей" → graph
  {
    triggers: ["граф", "связ"],
    inject: ["network", "connections", "nodes", "edges", "визуализация"],
    label: "Граф",
  },
];

// ─── Tokenizer (Unicode-aware — works for Cyrillic and Latin) ─────────────────
function tokenize(text: string): string[] {
  // \p{L} = any Unicode letter, \p{N} = any Unicode number; 'u' flag enables Unicode mode
  return (text.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || []);
}

// ─── Get injected concept tokens for the query ────────────────────────────────
function getConceptInjectedTokens(queryTokens: string[]): { tokens: string[]; labels: string[] } {
  const extra = new Set<string>();
  const labels: string[] = [];
  const queryStems = queryTokens.map(t => t.slice(0, Math.min(4, t.length)));

  for (const cluster of CONCEPT_CLUSTERS) {
    const matched = cluster.triggers.every(trigger =>
      queryStems.some(qs => qs === trigger || qs.startsWith(trigger.slice(0, 3)) || trigger.startsWith(qs.slice(0, 3)))
    );
    if (matched) {
      cluster.inject.forEach(t => extra.add(t));
      if (!labels.includes(cluster.label)) labels.push(cluster.label);
    }
  }
  return { tokens: Array.from(extra), labels };
}

// ─── Token overlap (each query token counted at most once) ────────────────────
function computeTokenOverlap(queryTokens: string[], text: string): number {
  if (queryTokens.length === 0) return 0;
  const textSet = new Set(tokenize(text));
  let matches = 0;
  for (const qt of queryTokens) {
    if (textSet.has(qt)) {
      matches += 1;
    } else if (qt.length >= 4) {
      for (const tt of textSet) {
        if (tt.length >= 4 && (tt.startsWith(qt.slice(0, 4)) || qt.startsWith(tt.slice(0, 4)))) {
          matches += 0.6;
          break; // count each query token at most once
        }
      }
    }
  }
  return Math.min(1, matches / queryTokens.length);
}

// ─── Synonym score with stem-aware key lookup ─────────────────────────────────
function findSynonymScore(queryTokens: string[], text: string): number {
  const textTokens = tokenize(text);

  // Helper: does candidateToken appear (exactly or by prefix) in textTokens?
  function tokenInText(candidate: string): boolean {
    const cs = candidate.slice(0, Math.min(4, candidate.length));
    for (const tt of textTokens) {
      if (tt === candidate) return true;
      if (candidate.length >= 4 && tt.length >= 4 &&
          (tt.startsWith(cs) || candidate.startsWith(tt.slice(0, 4)))) return true;
    }
    return false;
  }

  let score = 0;
  for (const qt of queryTokens) {
    const qtStem = qt.slice(0, Math.min(4, qt.length));

    // 1. Collect synonyms for this query token (exact key match or stem match)
    const candidates = new Set<string>();
    for (const [key, syns] of Object.entries(SYNONYMS)) {
      const keyStem = key.slice(0, Math.min(4, key.length));
      const keyMatchesQt = key === qt ||
        (qt.length >= 4 && key.length >= 4 && (qt.startsWith(keyStem) || key.startsWith(qtStem)));
      if (keyMatchesQt) {
        syns.forEach(s => candidates.add(s));
      }
    }

    // 2. Check candidates against text (with prefix)
    for (const cand of candidates) {
      if (tokenInText(cand)) { score += 0.55; break; }
    }

    // 3. Reverse: if qt itself (or stem) appears in any synonyms list, check if that key is in text
    for (const [key, syns] of Object.entries(SYNONYMS)) {
      const synMatchesQt = syns.some(s =>
        s === qt || (s.length >= 4 && qt.length >= 4 &&
          (qt.startsWith(s.slice(0, 4)) || s.startsWith(qtStem)))
      );
      if (synMatchesQt && tokenInText(key)) {
        score += 0.35;
      }
    }
  }
  return score;
}

// ─── Concept cluster bonus score ──────────────────────────────────────────────
// Measures how much the injected concept tokens appear in the memory text.
function conceptClusterBonus(injectedTokens: string[], text: string): number {
  if (injectedTokens.length === 0) return 0;
  const textTokens = tokenize(text);
  let hits = 0;
  for (const inj of injectedTokens) {
    const cs = inj.slice(0, Math.min(4, inj.length));
    for (const tt of textTokens) {
      if (tt === inj || (inj.length >= 4 && tt.length >= 4 &&
          (tt.startsWith(cs) || inj.startsWith(tt.slice(0, 4))))) {
        hits++;
        break;
      }
    }
  }
  return Math.min(1, hits / injectedTokens.length);
}

// ─── TF-IDF signature score ───────────────────────────────────────────────────
function signatureTokens(sig: string): Set<string> {
  return new Set(sig.toLowerCase().split(/\s+/).filter(Boolean));
}

function semanticSignatureScore(queryTokens: string[], memory: Memory): number {
  if (!memory.semanticSignature) return 0;
  const sigSet = signatureTokens(memory.semanticSignature);
  let matches = 0;
  for (const qt of queryTokens) {
    if (sigSet.has(qt)) matches++;
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

  // Concept expansion for semantic mode
  const { tokens: injectedTokens, labels: conceptLabels } = mode === "semantic"
    ? getConceptInjectedTokens(queryTokens)
    : { tokens: [], labels: [] };

  const results: (Memory & { relevanceScore: number; matchReason: string })[] = [];

  for (const m of memories) {
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
      // ── Semantic mode ─────────────────────────────────────────────────────

      // 1. Exact phrase
      if (fullText.includes(q)) {
        score += 0.7;
        reasons.push("Точная фраза");
      }

      // 2. Title overlap
      const titleOverlap = computeTokenOverlap(queryTokens, m.title);
      if (titleOverlap > 0) {
        score += titleOverlap * 0.55;
        reasons.push("Заголовок");
      }

      // 3. Content + extracted + summary overlap
      const contentOverlap = computeTokenOverlap(
        queryTokens,
        `${m.content} ${m.extractedContent || ""} ${m.summary}`
      );
      if (contentOverlap > 0) {
        score += contentOverlap * 0.35;
        if (!reasons.includes("Заголовок")) reasons.push(`Контент (${Math.round(contentOverlap * 100)}%)`);
      }

      // 4. Semantic signature (TF-IDF)
      const sigScore = semanticSignatureScore(queryTokens, m);
      if (sigScore > 0.1) {
        score += sigScore * 0.3;
        if (reasons.length < 3) reasons.push("Семантика");
      }

      // 5. Synonym expansion (now stem-aware)
      const synScore = findSynonymScore(queryTokens, fullText);
      if (synScore > 0) {
        score += Math.min(0.45, synScore * 0.2);
        if (reasons.length < 3) reasons.push("Синонимы");
      }

      // 6. Concept cluster injection bonus
      if (injectedTokens.length > 0) {
        const cb = conceptClusterBonus(injectedTokens, fullText);
        if (cb > 0) {
          score += cb * 0.55;
          if (reasons.length < 3) reasons.push(conceptLabels[0] || "Концепт");
        }
      }

      // 7. Injected tokens also scored against title (extra boost)
      if (injectedTokens.length > 0) {
        const titleConceptOverlap = computeTokenOverlap(injectedTokens, m.title);
        if (titleConceptOverlap > 0) {
          score += titleConceptOverlap * 0.3;
        }
      }

      // 8. Tag boost
      const ts = tagScore(queryTokens, m);
      if (ts > 0) {
        score += Math.min(0.3, ts * 0.12);
        if (reasons.length < 3) reasons.push("Теги");
      }

      // 9. Entity topics
      const entityText = (m.entities?.topics || []).join(" ").toLowerCase();
      const entityOverlap = computeTokenOverlap(queryTokens, entityText);
      if (entityOverlap > 0) { score += entityOverlap * 0.2; }

      // 10. Link-specific fields bonus
      if (m.type === "link" && (m.linkTitle || m.linkDescription)) {
        const linkOverlap = computeTokenOverlap(
          queryTokens,
          `${m.linkTitle} ${m.linkDescription}`
        );
        if (linkOverlap > 0) {
          score += linkOverlap * 0.2;
          if (reasons.length < 3) reasons.push("Ссылка");
        }
      }

      // 11. Recency bonus
      score += recencyBonus(m) * 0.05;
    }

    // Lower threshold for semantic (0.03) vs keyword (0.05)
    const threshold = mode === "semantic" ? 0.03 : 0.05;
    if (score > threshold) {
      results.push({
        ...m,
        relevanceScore: Math.min(1, score),
        matchReason: reasons.slice(0, 3).join(" + ") || "Релевантно",
      });
    }
  }

  return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

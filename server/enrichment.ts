import { type Memory } from "@shared/schema";

// ─── Stopwords ───────────────────────────────────────────────────────────────
const STOPWORDS_RU = new Set([
  "и","в","на","с","по","для","от","из","к","за","при","как","что","это",
  "я","ты","он","она","мы","вы","они","не","да","нет","а","но","или","тоже",
  "же","ли","бы","уже","ещё","также","который","которая","которое","которые",
  "если","то","так","был","была","было","были","быть","быть","есть","иметь",
]);

const STOPWORDS_EN = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with",
  "by","from","as","is","are","was","were","be","been","have","has","had",
  "do","does","did","this","that","these","those","not","no","it","its","i",
  "we","you","he","she","they","my","your","his","her","our","their","also",
]);

function isStopword(word: string): boolean {
  return STOPWORDS_RU.has(word) || STOPWORDS_EN.has(word);
}

// ─── Tokenizer ────────────────────────────────────────────────────────────────
function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/\b[a-zа-яёa-z0-9]{3,}\b/gi) || [])
    .filter(w => !isStopword(w));
}

// ─── TF-IDF Vocabulary ────────────────────────────────────────────────────────
export function computeTfIdfSignature(text: string, allTexts: string[]): string {
  const tokens = tokenize(text);
  const tf: Record<string, number> = {};
  tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
  const total = tokens.length || 1;

  const scores: [string, number][] = Object.entries(tf).map(([term, count]) => {
    const termFreq = count / total;
    const docsWithTerm = allTexts.filter(d => d.toLowerCase().includes(term)).length;
    const idf = Math.log((allTexts.length + 1) / (docsWithTerm + 1)) + 1;
    return [term, termFreq * idf];
  });

  scores.sort((a, b) => b[1] - a[1]);
  return scores.slice(0, 30).map(([t]) => t).join(" ");
}

// ─── Keyword extraction ───────────────────────────────────────────────────────
export function extractKeywords(text: string, topN = 10): string[] {
  const tokens = tokenize(text);
  const freq: Record<string, number> = {};
  tokens.forEach(t => { freq[t] = (freq[t] || 0) + 1; });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([w]) => w);
}

// ─── Entity Extraction ────────────────────────────────────────────────────────
const TECH_TOPICS: Record<string, string> = {
  react: "Frontend", reactjs: "Frontend", vue: "Frontend", angular: "Frontend",
  javascript: "Frontend", typescript: "Frontend", css: "Frontend", html: "Frontend",
  frontend: "Frontend", jsx: "Frontend", tsx: "Frontend",
  nodejs: "Backend", express: "Backend", fastapi: "Backend", django: "Backend",
  python: "Backend", backend: "Backend", server: "Backend", api: "API",
  rest: "API", graphql: "API", endpoint: "API",
  sql: "Database", postgres: "Database", mongodb: "Database", redis: "Database",
  database: "Database", sqlite: "Database",
  docker: "DevOps", kubernetes: "DevOps", git: "DevOps", linux: "DevOps", ci: "DevOps",
  machine: "AI/ML", learning: "AI/ML", neural: "AI/ML", ai: "AI/ML", ml: "AI/ML",
  gpt: "AI/ML", llm: "AI/ML", embedding: "AI/ML", nlp: "AI/ML",
  design: "Design", ui: "Design", ux: "Design", figma: "Design", tailwind: "Design",
  project: "Project", diploma: "Project", диплом: "Диплом", дипломный: "Диплом",
  практика: "Практика", стажировка: "Стажировка", интернатура: "Стажировка",
  алгоритм: "Алгоритм", структура: "Алгоритм",
  идея: "Идея", концепция: "Идея", план: "Планирование",
};

export function extractEntitiesFromText(text: string): { people: string[]; dates: string[]; topics: string[] } {
  const combined = text.toLowerCase();

  // Topics from keyword map
  const topicsSet = new Set<string>();
  for (const [keyword, topic] of Object.entries(TECH_TOPICS)) {
    const rx = new RegExp(`\\b${keyword}\\b`, "i");
    if (rx.test(combined)) topicsSet.add(topic);
  }
  if (topicsSet.size === 0) topicsSet.add("Общее");
  const topics = Array.from(topicsSet).slice(0, 5);

  // Dates: YYYY, DD.MM.YYYY, DD/MM/YYYY, month names
  const dateMatches = text.match(/\b(20\d{2}|\d{1,2}[./]\d{1,2}[./]\d{2,4}|январ[еья]|феврал[еья]|март[ae]?|апрел[еья]|май|мая|июн[еья]|июл[еья]|август[ae]?|сентябр[еья]|октябр[еья]|ноябр[еья]|декабр[еья])\b/gi) || [];
  const dates = Array.from(new Set(dateMatches)).slice(0, 5);

  // People: consecutive capitalized words (Russian and English names)
  const nameMatches = text.match(/\b[А-ЯЁA-Z][а-яёa-z]+(?:\s+[А-ЯЁA-Z][а-яёa-z]+)+\b/g) || [];
  const people = Array.from(new Set(nameMatches)).slice(0, 5);

  return { people, dates, topics };
}

// ─── Summary Generation ───────────────────────────────────────────────────────
export function generateSummary(title: string, content: string): string {
  const text = content.trim();
  if (!text) return title;

  // First sentence of content
  const sentences = text.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 15);
  if (sentences.length === 0) return text.slice(0, 120);

  const first = sentences[0];
  const second = sentences[1] || "";
  const combined = second ? `${first}. ${second}` : first;
  return combined.length > 200 ? combined.slice(0, 200) + "..." : combined;
}

// ─── Tag Generation ───────────────────────────────────────────────────────────
const TAG_MAP: Record<string, string> = {
  react: "react", reactjs: "react", jsx: "react",
  typescript: "typescript", javascript: "javascript",
  python: "python", nodejs: "nodejs",
  css: "css", tailwind: "css",
  api: "api", rest: "api", graphql: "api",
  docker: "devops", kubernetes: "devops", git: "git",
  sql: "database", postgres: "database", mongodb: "database",
  frontend: "фронтенд", backend: "бэкенд",
  design: "дизайн", ui: "дизайн", ux: "дизайн", figma: "дизайн",
  диплом: "диплом", дипломный: "диплом",
  практика: "практика", стажировка: "стажировка",
  алгоритм: "алгоритм", идея: "идеи", проект: "проекты",
  обучение: "обучение", курс: "обучение", учёба: "обучение",
  статья: "статья", ссылка: "ссылки",
  ml: "ml", "machine learning": "ml", ai: "ии", gpt: "llm", llm: "llm",
  заметка: "заметки", мысль: "мысли",
};

export function generateTags(title: string, content: string, existingTags: string[] = []): string[] {
  if (existingTags.length >= 3) return existingTags;
  const combined = `${title} ${content}`.toLowerCase();
  const detected = new Set<string>(existingTags);
  for (const [keyword, tag] of Object.entries(TAG_MAP)) {
    const rx = new RegExp(`\\b${keyword}\\b`, "i");
    if (rx.test(combined)) detected.add(tag);
  }
  return Array.from(detected).slice(0, 8);
}

// ─── Full enrichment pipeline ─────────────────────────────────────────────────
export function enrichMemory(
  title: string,
  content: string,
  extractedContent: string = "",
  existingTags: string[] = [],
  allDocTexts: string[] = []
) {
  const fullText = [title, content, extractedContent].filter(Boolean).join(" ");

  const entities = extractEntitiesFromText(fullText);
  const summary = generateSummary(title, extractedContent || content);
  const tags = generateTags(title, fullText, existingTags);
  const semanticSignature = computeTfIdfSignature(fullText, [...allDocTexts, fullText]);

  return { entities, summary, tags, semanticSignature };
}

import { type Memory } from "@shared/schema";
import { searchMemories } from "./search-engine";

export interface ChatSource {
  id: number;
  title: string;
  type: string;
}

export interface ChatEngineResult {
  content: string;
  sources: ChatSource[];
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} ${many}`;
  if (mod10 === 1) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} ${few}`;
  return `${n} ${many}`;
}

function excerpt(text: string, maxLen = 200): string {
  const t = text.trim();
  return t.length > maxLen ? t.slice(0, maxLen) + "..." : t;
}

function getMemoryContext(m: Memory): string {
  const parts = [m.title];
  if (m.extractedContent && m.extractedContent.length > 20) {
    parts.push(excerpt(m.extractedContent, 300));
  } else {
    parts.push(excerpt(m.content, 300));
  }
  if (m.linkTitle) parts.push(`Заголовок страницы: ${m.linkTitle}`);
  if (m.linkDescription) parts.push(`Описание: ${m.linkDescription}`);
  if (m.tags.length) parts.push(`Теги: ${m.tags.join(", ")}`);
  return parts.join("\n");
}

// ─── Intent Detection ──────────────────────────────────────────────────────────
function detectIntent(q: string): string {
  if (/сколько|количество|всего|итого/.test(q)) return "stats";
  if (/тег|метк|категор/.test(q)) return "tags";
  if (/недел|недавн|сегодня|вчера|последн/.test(q)) return "recent";
  if (/статистик|аналитик|обзор|сводк/.test(q)) return "stats";
  if (/тип|виды|категории|файл|ссылк|текст/.test(q)) return "types";
  if (/связ|отношени|граф|похожи/.test(q)) return "relations";
  if (/загруз|файл|документ|pdf|docx/.test(q)) return "files";
  return "search";
}

// ─── Intent handlers ──────────────────────────────────────────────────────────
function handleStats(memories: Memory[]): ChatEngineResult {
  const textCount = memories.filter(m => m.type === "text").length;
  const linkCount = memories.filter(m => m.type === "link").length;
  const fileCount = memories.filter(m => m.type === "file").length;
  const allTags = new Set(memories.flatMap(m => m.tags));
  const withExtracted = memories.filter(m => m.extractedContent && m.extractedContent.length > 10).length;

  const content =
    `В вашей базе знаний хранится **${plural(memories.length, "воспоминание", "воспоминания", "воспоминаний")}**.\n\n` +
    `**По типу:**\n` +
    `• 📝 Текстовых заметок: ${textCount}\n` +
    `• 🔗 Ссылок: ${linkCount}\n` +
    `• 📎 Файлов: ${fileCount}\n\n` +
    `**Уникальных тегов:** ${allTags.size}\n` +
    `**Записей с извлечённым контентом:** ${withExtracted}`;

  return { content, sources: [] };
}

function handleTags(memories: Memory[]): ChatEngineResult {
  const tagCounts: Record<string, number> = {};
  memories.forEach(m => m.tags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
  const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  if (sorted.length === 0) {
    return { content: "В вашей базе пока нет тегов. Добавьте их при создании воспоминаний.", sources: [] };
  }

  const content =
    `**Топ тегов** (всего уникальных: ${Object.keys(tagCounts).length}):\n\n` +
    sorted.map(([tag, count]) => `• **#${tag}** — ${plural(count, "запись", "записи", "записей")}`).join("\n");

  return { content, sources: [] };
}

function handleRecent(memories: Memory[]): ChatEngineResult {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = memories
    .filter(m => new Date(m.createdAt).getTime() > weekAgo)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (recent.length === 0) {
    return { content: "За последнюю неделю новых воспоминаний не добавлялось.", sources: [] };
  }

  const content =
    `За последние 7 дней добавлено **${plural(recent.length, "воспоминание", "воспоминания", "воспоминаний")}**:\n\n` +
    recent.slice(0, 5).map(m => {
      const desc = m.extractedContent
        ? excerpt(m.extractedContent, 80)
        : excerpt(m.linkDescription || m.summary || m.content, 80);
      return `• **${m.title}** — ${desc}`;
    }).join("\n");

  const sources = recent.slice(0, 5).map(m => ({ id: m.id, title: m.title, type: m.type }));
  return { content, sources };
}

function handleTypes(memories: Memory[]): ChatEngineResult {
  const files = memories.filter(m => m.type === "file");
  const links = memories.filter(m => m.type === "link");
  const texts = memories.filter(m => m.type === "text");

  const parts: string[] = [];

  if (files.length > 0) {
    parts.push(`**📎 Файлы (${files.length}):**\n` + files.slice(0, 3).map(m => {
      const info = m.fileMimeType ? ` [${m.fileMimeType.split("/").pop()}]` : "";
      const extracted = m.extractedContent ? ` — ${excerpt(m.extractedContent, 60)}` : "";
      return `• **${m.title}**${info}${extracted}`;
    }).join("\n"));
  }
  if (links.length > 0) {
    parts.push(`**🔗 Ссылки (${links.length}):**\n` + links.slice(0, 3).map(m => {
      const domain = m.linkDomain ? ` [${m.linkDomain}]` : "";
      const desc = m.linkDescription ? ` — ${excerpt(m.linkDescription, 60)}` : "";
      return `• **${m.title}**${domain}${desc}`;
    }).join("\n"));
  }
  if (texts.length > 0) {
    parts.push(`**📝 Заметки (${texts.length}):**\n` + texts.slice(0, 3).map(m => `• **${m.title}** — ${excerpt(m.summary || m.content, 60)}`).join("\n"));
  }

  return {
    content: parts.join("\n\n"),
    sources: [...files, ...links, ...texts].slice(0, 5).map(m => ({ id: m.id, title: m.title, type: m.type })),
  };
}

function handleFiles(memories: Memory[]): ChatEngineResult {
  const files = memories.filter(m => m.type === "file");
  if (files.length === 0) {
    return { content: "В базе ещё нет загруженных файлов.", sources: [] };
  }

  const content =
    `**Файлы в вашей базе (${files.length}):**\n\n` +
    files.map(m => {
      const sizeInfo = m.fileSize ? ` (${(m.fileSize / 1024).toFixed(1)} КБ)` : "";
      const mimeInfo = m.fileMimeType ? ` [${m.fileMimeType.split("/").pop()}]` : "";
      const extractedInfo = m.extractedContent
        ? `\n  Извлечено: ${excerpt(m.extractedContent, 100)}`
        : "";
      return `• **${m.title}**${mimeInfo}${sizeInfo}${extractedInfo}`;
    }).join("\n\n");

  return {
    content,
    sources: files.map(m => ({ id: m.id, title: m.title, type: m.type })),
  };
}

function handleRelations(query: string, memories: Memory[]): ChatEngineResult {
  const results = searchMemories(memories, query, "semantic").slice(0, 5);
  if (results.length === 0) {
    return { content: "Не найдено связанных записей по данному запросу.", sources: [] };
  }

  const main = results[0];
  const related = memories.filter(m => (main.relatedIds || []).includes(m.id)).slice(0, 4);

  let content = `**${main.title}** имеет следующие связи:\n\n`;

  if (related.length > 0) {
    content += `**Связанные записи:**\n` + related.map(r => `• **${r.title}** (теги: ${r.tags.join(", ") || "нет"})`).join("\n");
  } else {
    content += "У этой записи пока нет явных связей с другими воспоминаниями.";
  }

  const sources = [main, ...related].slice(0, 5).map(m => ({ id: m.id, title: m.title, type: m.type }));
  return { content, sources };
}

// ─── Main search-based answer ─────────────────────────────────────────────────
function handleSearch(query: string, memories: Memory[]): ChatEngineResult {
  const results = searchMemories(memories, query, "semantic").slice(0, 5);

  if (results.length === 0) {
    return {
      content:
        `По запросу «${query}» записей не найдено.\n\n` +
        `**Попробуйте:**\n` +
        `• Использовать более общие слова\n` +
        `• Перейти в раздел Поиск для точного поиска\n` +
        `• Добавить записи по этой теме`,
      sources: [],
    };
  }

  const sources: ChatSource[] = results.map(r => ({ id: r.id, title: r.title, type: r.type }));
  const main = results[0];

  // Build rich context from extracted content
  const contextLines = results.slice(0, 3).map(r => {
    const body = r.extractedContent
      ? excerpt(r.extractedContent, 150)
      : excerpt(r.linkDescription || r.summary || r.content, 150);
    return `**${r.title}** (релевантность: ${Math.round(r.relevanceScore * 100)}%)\n${body}`;
  });

  let content: string;

  if (results.length === 1) {
    const body = main.extractedContent
      ? excerpt(main.extractedContent, 250)
      : excerpt(main.linkDescription || main.summary || main.content, 250);
    content =
      `Нашёл одну подходящую запись:\n\n` +
      `**${main.title}**\n${body}\n\n` +
      (main.tags.length ? `Теги: ${main.tags.map(t => `#${t}`).join(" ")}` : "");
  } else {
    content =
      `Нашёл **${plural(results.length, "запись", "записи", "записей")}** по запросу «${query}»:\n\n` +
      contextLines.join("\n\n") +
      (results.length > 3 ? `\n\n...и ещё ${results.length - 3} результатов` : "");
  }

  return { content, sources };
}

// ─── OpenAI-backed answer (if available) ──────────────────────────────────────
async function tryOpenAI(
  query: string,
  relevantMemories: Memory[],
  history: { role: "user" | "assistant"; content: string }[]
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const contextBlock = relevantMemories.slice(0, 5).map(m => getMemoryContext(m)).join("\n---\n");
    const systemPrompt =
      `Ты — персональный AI-ассистент базы знаний. Отвечай на русском языке.\n` +
      `Используй ТОЛЬКО информацию из переданного контекста. Не придумывай факты.\n` +
      `Если ответа нет в контексте, честно скажи об этом.\n` +
      `Контекст из базы знаний пользователя:\n${contextBlock}`;

    const messages: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-6),
      { role: "user", content: query },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 600,
        temperature: 0.3,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json() as { choices: { message: { content: string } }[] };
    return data.choices[0]?.message?.content || null;
  } catch {
    return null;
  }
}

// ─── Main entry point ──────────────────────────────────────────────────────────
export async function answerQuery(
  query: string,
  memories: Memory[],
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<ChatEngineResult> {
  const q = query.toLowerCase();
  const intent = detectIntent(q);

  // Stats and metadata intents don't need OpenAI
  if (intent === "stats") return handleStats(memories);
  if (intent === "tags") return handleTags(memories);
  if (intent === "recent") return handleRecent(memories);
  if (intent === "types") return handleTypes(memories);
  if (intent === "files") return handleFiles(memories);

  // Get relevant memories for context
  const relevant = searchMemories(memories, query, "semantic").slice(0, 5);
  const sources: ChatSource[] = relevant.map(r => ({ id: r.id, title: r.title, type: r.type }));

  if (intent === "relations") {
    return handleRelations(query, memories);
  }

  // Try OpenAI first if key available
  if (relevant.length > 0) {
    const aiAnswer = await tryOpenAI(query, relevant, history);
    if (aiAnswer) {
      return { content: aiAnswer, sources };
    }
  }

  // Fall back to local template-based answer
  return handleSearch(query, memories);
}

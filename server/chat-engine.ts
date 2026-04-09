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

// ─── Utilities ─────────────────────────────────────────────────────────────────

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} ${many}`;
  if (mod10 === 1) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} ${few}`;
  return `${n} ${many}`;
}

function excerpt(text: string, maxLen = 200): string {
  const t = (text || "").trim();
  return t.length > maxLen ? t.slice(0, maxLen) + "..." : t;
}

function bestText(m: Memory, maxLen = 250): string {
  for (const c of [m.extractedContent, m.linkDescription, m.summary, m.content]) {
    if (c && c.trim().length > 20) return excerpt(c, maxLen);
  }
  return "";
}

function fileStatusLabel(m: Memory): string {
  const mime = m.fileMimeType || "";
  const path = m.filePath || "";
  const isPdf = mime.includes("pdf") || path.endsWith(".pdf");
  const isDocx = mime.includes("word") || mime.includes("docx") || path.endsWith(".docx");
  const ext = (mime.split("/").pop() || path.split(".").pop() || "").toUpperCase();

  if (m.processingStatus === "ocr_needed") {
    return "сканированный PDF — текст как изображения, нужен OCR";
  }
  if (m.processingStatus === "protected") {
    return "PDF защищён паролем";
  }
  if (m.extractedContent && m.extractedContent.trim().length > 10) {
    const words = m.extractedContent.trim().split(/\s+/).length;
    if (isPdf) return `PDF с извлечённым текстом (${words} слов)`;
    if (isDocx) return `DOCX с извлечённым текстом (${words} слов)`;
    return `${ext || "файл"} с извлечённым текстом (${words} слов)`;
  }
  if (isPdf) return "PDF (текст не извлечён)";
  if (isDocx) return "DOCX";
  return ext ? `${ext}-файл` : "файл";
}

// ─── Intent Detection ─────────────────────────────────────────────────────────

type Intent =
  | "status"
  | "capability"
  | "summary"
  | "list"
  | "stats"
  | "tags"
  | "recent"
  | "comparison"
  | "explanation"
  | "file"
  | "link"
  | "relations"
  | "search";

function detectIntent(q: string): Intent {
  if (/статус|состояни[ея]|сканирован|защищ[её]н|зашифрован|ocr|распознан|тип файл|формат файл/.test(q))
    return "status";
  if (/можно ли|возможно ли|доступен ли|как извлечь|можно извлечь|работает ли|поддержива|доступно ли/.test(q))
    return "capability";
  if (/о\s+[её]м|что содержит|расскажи\s|кратко[ею]?|краткое|суммаризируй|что там|что в[о]?\s|что написано|из чего|содержание/.test(q))
    return "summary";
  if (/список|перечисли|покажи все|все запис|все файл|все ссылк|выведи все/.test(q))
    return "list";
  // tags must be checked before stats — "статистику по тегам" should route to tags
  if (/тег|метк|категор/.test(q))
    return "tags";
  if (/сколько|количество|всего|итого|статистик|аналитик|сводк/.test(q))
    return "stats";
  if (/недел|недавн|сегодня|вчера|последн|добавлял|когда добав/.test(q))
    return "recent";
  if (/сравни|сравнение|отличи[ея]|разниц|versus|vs\b/.test(q))
    return "comparison";
  // "X или Y?" — two distinct nouns separated by "или" at end of query
  if (/\S+\s+или\s+\S+\s*\??\s*$/.test(q) && !/что|какой|какая|когда|где|как|есть/.test(q))
    return "comparison";
  if (/объясни|почему|как работает|расскажи подробн|что такое|зачем/.test(q))
    return "explanation";
  if (/файл|документ|pdf|docx|загрузил|загружен|прикреплён/.test(q))
    return "file";
  if (/ссылк|сайт|страниц|url|домен|сохранил ссылку/.test(q))
    return "link";
  if (/связ|отношени|граф|похожи/.test(q))
    return "relations";
  return "search";
}

// ─── Target Memory Finder ─────────────────────────────────────────────────────
// Multi-signal scorer: title words (bidirectional) + filename tokens + URL + semantic

function scoreTargetMatch(query: string, m: Memory): number {
  const q = query.toLowerCase();
  // Tokenise: split on spaces, punctuation, underscores, brackets
  const splitQ = q.split(/[\s\-_()\[\],.!?]+/u).filter(w => w.length >= 3);
  const titleLower = m.title.toLowerCase();
  const splitTitle = titleLower.split(/[\s\-_()\[\],.!?]+/u).filter(w => w.length >= 3);
  let score = 0;

  // Title words that appear in the query (forward match)
  for (const tw of splitTitle) {
    if (q.includes(tw)) score += tw.length >= 5 ? 4 : 2;
  }
  // Query words that appear in the title (reverse match)
  for (const qw of splitQ) {
    if (titleLower.includes(qw)) score += qw.length >= 5 ? 3 : 1;
  }

  // Filename token match (e.g. "memory_hub(1)" → ["memory", "hub", "1"])
  if (m.filePath) {
    const filename = (m.filePath.split("/").pop() || "").toLowerCase();
    const fnWords = filename.split(/[\s\-_()\[\],.!?]+/u).filter(w => w.length >= 3);
    for (const fw of fnWords) {
      if (q.includes(fw)) score += fw.length >= 5 ? 4 : 2;
    }
  }

  // Link URL segment match
  if (m.linkUrl) {
    const urlParts = m.linkUrl.toLowerCase().split(/[/.\-_?&=]+/u).filter(w => w.length >= 3);
    for (const up of urlParts) {
      if (q.includes(up)) score += 2;
    }
    // Domain name in query
    if (m.linkDomain && q.includes(m.linkDomain.toLowerCase().replace(/^www\./, ""))) score += 5;
  }

  return score;
}

function findTargetMemory(query: string, candidates: Memory[]): Memory | null {
  if (candidates.length === 0) return null;

  // Score every candidate
  const scored = candidates
    .map(m => ({ m, score: scoreTargetMatch(query, m) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  const runner = scored[1];

  // Accept if score is non-trivial and clearly better than the runner-up
  if (best.score >= 3 && (runner === undefined || best.score >= runner.score + 2)) {
    return best.m;
  }

  // Fall back to semantic search
  const results = searchMemories(candidates, query, "semantic");
  if (results.length > 0 && results[0].relevanceScore > 0.42) return results[0];

  // Last resort: accept the top scorer if threshold met
  if (best.score >= 4) return best.m;

  return null;
}

// ─── Intent Handlers ──────────────────────────────────────────────────────────

function handleStatus(query: string, memories: Memory[]): ChatEngineResult {
  const files = memories.filter(m => m.type === "file");
  const target = findTargetMemory(query, files) ?? findTargetMemory(query, memories);

  if (!target) {
    if (files.length === 0) return { content: "В базе нет файлов.", sources: [] };

    const lines = files.map(f => `• **${f.title}** — ${fileStatusLabel(f)}`);
    return {
      content: `**Статус файлов:**\n\n${lines.join("\n")}`,
      sources: files.map(f => ({ id: f.id, title: f.title, type: f.type })),
    };
  }

  if (target.type !== "file") {
    return {
      content:
        `**${target.title}** — текстовая запись, статус: доступна для поиска и просмотра.\n\n` +
        (bestText(target, 150) ? `Содержание: ${bestText(target, 150)}` : ""),
      sources: [{ id: target.id, title: target.title, type: target.type }],
    };
  }

  const status = fileStatusLabel(target);
  let content = `**${target.title}** — ${status}.`;

  if (target.processingStatus === "ocr_needed") {
    content +=
      `\n\nЭтот PDF хранит текст в виде отсканированных изображений. Автоматическое извлечение текста невозможно — ` +
      `файл доступен для скачивания, но поиск по содержимому не работает. Для извлечения текста потребуется OCR.`;
  } else if (target.processingStatus === "protected") {
    content +=
      `\n\nФайл защищён паролем или DRM. Содержимое недоступно без разблокировки. ` +
      `Скачайте файл и откройте с паролем вручную.`;
  } else if (target.extractedContent && target.extractedContent.trim().length > 10) {
    const words = target.extractedContent.trim().split(/\s+/).length;
    content += `\n\nИзвлечено **${words} слов** — файл полностью индексирован. Фрагмент: «${excerpt(target.extractedContent, 120)}»`;
  } else {
    content += `\n\nТекст не был извлечён — возможно, нестандартный формат или пустой файл.`;
  }

  if (target.fileSize) {
    content += `\n\nРазмер: ${(target.fileSize / 1024).toFixed(1)} КБ`;
  }

  return { content, sources: [{ id: target.id, title: target.title, type: target.type }] };
}

function handleCapability(query: string, memories: Memory[]): ChatEngineResult {
  const lq = query.toLowerCase();

  if (/извлечь текст|ocr|распознать|текст из|получить текст/.test(lq)) {
    const target = findTargetMemory(query, memories.filter(m => m.type === "file"));

    if (target && target.type === "file") {
      if (target.processingStatus === "ocr_needed") {
        return {
          content:
            `**Нет — автоматическое извлечение текста из «${target.title}» недоступно.**\n\n` +
            `Это сканированный PDF: текст хранится как изображение. Memory Hub пока не имеет встроенного OCR.\n\n` +
            `**Что можно сделать:**\n` +
            `• Использовать Google Drive (загрузить PDF → Открыть в Docs) для бесплатного OCR\n` +
            `• Использовать Adobe Acrobat или Tesseract\n` +
            `• Затем сохранить распознанный текст как новую заметку в Memory Hub`,
          sources: [{ id: target.id, title: target.title, type: target.type }],
        };
      }
      if (target.processingStatus === "protected") {
        return {
          content:
            `**Нет — «${target.title}» защищён паролем.**\n\n` +
            `Для извлечения текста сначала снимите защиту, затем загрузите файл заново.`,
          sources: [{ id: target.id, title: target.title, type: target.type }],
        };
      }
      if (target.extractedContent && target.extractedContent.trim().length > 10) {
        const words = target.extractedContent.trim().split(/\s+/).length;
        return {
          content:
            `**Да — текст из «${target.title}» уже извлечён.**\n\n` +
            `Доступно **${words} слов**, файл полностью индексирован и доступен для поиска.`,
          sources: [{ id: target.id, title: target.title, type: target.type }],
        };
      }
    }

    return {
      content:
        `Memory Hub автоматически извлекает текст из DOCX и текстовых PDF при загрузке.\n\n` +
        `Сканированные PDF (текст как изображения) требуют OCR — встроенного OCR в системе нет. ` +
        `Рекомендую распознать текст через Google Drive или Tesseract и загрузить как заметку.`,
      sources: [],
    };
  }

  const results = searchMemories(memories, query, "semantic").slice(0, 3);
  if (results.length === 0) {
    return { content: `По запросу «${query}» информации в базе не найдено.`, sources: [] };
  }

  const text = bestText(results[0], 250);
  return {
    content: text
      ? `На основе «${results[0].title}»:\n\n${text}`
      : `Запись «${results[0].title}» найдена, но текстового содержимого нет.`,
    sources: results.map(r => ({ id: r.id, title: r.title, type: r.type })),
  };
}

// Extracts the core topic phrase from a summary query
function extractTopicPhrase(query: string): string {
  let q = query.trim();
  // Strip action verb prefix
  q = q.replace(/^(сделай|составь|дай|покажи|расскажи|напиши)\s+/i, "");
  // Strip quality modifiers — applied with + so "краткое summary" is stripped in one pass
  q = q.replace(/^(кратко[ею]?\s+|summary\s+|резюме\s+)+/ig, "");
  // Strip "того, что у меня есть по" etc.
  q = q.replace(/^того,?\s+/i, "");
  q = q.replace(/^что\s+(?:у\s+меня\s+есть\s+)?(?:по\s+)?/i, "");
  q = q.replace(/^(?:по\s+|о\s+|об\s+)/i, "");
  q = q.replace(/[?!.]+$/, "").trim();
  return q || query.trim();
}

function handleSummary(query: string, memories: Memory[]): ChatEngineResult {
  const results = searchMemories(memories, query, "semantic").slice(0, 5);

  if (results.length === 0) {
    return { content: `По запросу «${query}» ничего не найдено.`, sources: [] };
  }

  const top = results[0];
  const topScore = top.relevanceScore ?? 0;

  // ── Case 1: asking about a SPECIFIC named item (high confidence) ──────────
  // Triggers when query contains specific title words or score is very high
  const titleScore = scoreTargetMatch(query, top);
  const isSpecificItem = titleScore >= 4 || topScore > 0.82;

  if (isSpecificItem) {
    if (top.type === "file" && top.processingStatus === "ocr_needed") {
      return {
        content:
          `«**${top.title}**» — сканированный PDF, текст не извлечён. ` +
          `Содержимое недоступно для анализа без OCR.`,
        sources: [{ id: top.id, title: top.title, type: top.type }],
      };
    }

    const text = bestText(top, 480);
    if (!text) {
      return {
        content: `«${top.title}» существует в базе, но текстового содержимого нет.`,
        sources: [{ id: top.id, title: top.title, type: top.type }],
      };
    }

    let content = `**${top.title}**\n\n${text}`;
    if (top.tags.length) content += `\n\nТеги: ${top.tags.map(t => `#${t}`).join(" ")}`;
    if (top.type === "link" && top.linkDomain) content += `\n\nИсточник: ${top.linkDomain}`;
    return { content, sources: [{ id: top.id, title: top.title, type: top.type }] };
  }

  // ── Case 2: TOPIC summary — synthesize across multiple results ────────────
  const topic = extractTopicPhrase(query);

  // Group by type for structured synthesis
  const notes = results.filter(r => r.type === "text");
  const links = results.filter(r => r.type === "link");
  const files = results.filter(r => r.type === "file");

  const parts: string[] = [];

  // Opening count sentence — plural() already includes the number, don't prepend it again
  const typeBreakdown: string[] = [];
  if (notes.length) typeBreakdown.push(plural(notes.length, "заметка", "заметки", "заметок"));
  if (links.length) typeBreakdown.push(plural(links.length, "ссылка", "ссылки", "ссылок"));
  if (files.length) typeBreakdown.push(plural(files.length, "файл", "файла", "файлов"));

  parts.push(
    `По теме «**${topic}**» в базе ${plural(results.length, "запись", "записи", "записей")}` +
    (typeBreakdown.length ? ` (${typeBreakdown.join(", ")})` : "") + `:`
  );

  // Key idea per result — extract one sentence or leading phrase
  const ideaLines = results.map(r => {
    const icon = r.type === "file" ? "📎" : r.type === "link" ? "🔗" : "📝";
    const fullText = bestText(r, 180);

    // For files with no text, show status instead of "(нет текста)"
    if (!fullText && r.type === "file") {
      const status = r.processingStatus === "ocr_needed"
        ? "сканированный PDF, OCR нужен"
        : r.processingStatus === "protected"
        ? "защищён паролем"
        : "текст не извлечён";
      return `${icon} **${r.title}** — ${status}`;
    }

    // Trim to first meaningful sentence for compact synthesis
    const sentence = fullText
      ? fullText.replace(/\.\s.*$/, "").slice(0, 160)  // up to first sentence
      : "";
    return `${icon} **${r.title}**${sentence ? ` — ${sentence}` : ""}`;
  });

  parts.push(ideaLines.join("\n"));

  // Synthesised observation (only when 3+ results available)
  if (results.length >= 3) {
    const allTags = Array.from(new Set(results.flatMap(r => r.tags))).slice(0, 5);
    if (allTags.length >= 2) {
      parts.push(`_Связанные темы: ${allTags.map(t => `#${t}`).join(" ")}_`);
    }
  }

  return {
    content: parts.join("\n\n"),
    sources: results.map(r => ({ id: r.id, title: r.title, type: r.type })),
  };
}

function handleList(query: string, memories: Memory[]): ChatEngineResult {
  const lq = query.toLowerCase();

  let subset: Memory[];
  let label: string;

  if (/файл|pdf|docx|документ/.test(lq)) {
    subset = memories.filter(m => m.type === "file");
    label = "Файлы";
  } else if (/ссылк|сайт|link/.test(lq)) {
    subset = memories.filter(m => m.type === "link");
    label = "Ссылки";
  } else if (/замет|текст/.test(lq)) {
    // "замет" catches заметка, заметки, заметок, заметках (all inflections)
    subset = memories.filter(m => m.type === "text");
    label = "Заметки";
  } else {
    const results = searchMemories(memories, query, "semantic").slice(0, 8);
    if (results.length === 0) {
      return { content: `Ничего не найдено по запросу «${query}».`, sources: [] };
    }
    const lines = results.map(r => {
      const icon = r.type === "file" ? "📎" : r.type === "link" ? "🔗" : "📝";
      return `${icon} **${r.title}** — ${excerpt(r.summary || r.content, 80)}`;
    });
    return {
      content: `По запросу «${query}»:\n\n${lines.join("\n")}`,
      sources: results.map(r => ({ id: r.id, title: r.title, type: r.type })),
    };
  }

  if (subset.length === 0) {
    return { content: `${label} в базе пока нет.`, sources: [] };
  }

  const lines = subset.map(m => {
    const icon = m.type === "file" ? "📎" : m.type === "link" ? "🔗" : "📝";
    const detail = m.type === "file"
      ? ` [${fileStatusLabel(m)}]`
      : m.type === "link"
      ? ` — ${m.linkDomain || ""}`
      : ` — ${excerpt(m.summary || m.content, 60)}`;
    return `${icon} **${m.title}**${detail}`;
  });

  return {
    content: `**${label} (${subset.length}):**\n\n${lines.join("\n")}`,
    sources: subset.slice(0, 6).map(m => ({ id: m.id, title: m.title, type: m.type })),
  };
}

function handleStats(memories: Memory[]): ChatEngineResult {
  const textCount = memories.filter(m => m.type === "text").length;
  const linkCount = memories.filter(m => m.type === "link").length;
  const fileCount = memories.filter(m => m.type === "file").length;
  const allTags = new Set(memories.flatMap(m => m.tags));
  const withExtracted = memories.filter(m => m.extractedContent && m.extractedContent.trim().length > 10).length;
  const scanned = memories.filter(m => m.processingStatus === "ocr_needed").length;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentCount = memories.filter(m => new Date(m.createdAt).getTime() > weekAgo).length;

  let content =
    `В базе знаний **${plural(memories.length, "воспоминание", "воспоминания", "воспоминаний")}**.\n\n` +
    `**По типу:**\n` +
    `• 📝 Заметки: ${textCount}\n` +
    `• 🔗 Ссылки: ${linkCount}\n` +
    `• 📎 Файлы: ${fileCount}\n\n` +
    `**Контент:**\n` +
    `• С извлечённым текстом: ${withExtracted}\n`;

  if (scanned > 0) content += `• Сканированных PDF (нужен OCR): ${scanned}\n`;
  content += `• Добавлено за эту неделю: ${recentCount}\n\n`;
  content += `**Теги:** ${allTags.size} уникальных`;

  return { content, sources: [] };
}

function handleTags(query: string, memories: Memory[]): ChatEngineResult {
  const tagCounts: Record<string, number> = {};
  memories.forEach(m => m.tags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));

  if (Object.keys(tagCounts).length === 0) {
    return { content: "В базе пока нет тегов.", sources: [] };
  }

  // Check if asking about a specific tag
  const allTags = Object.keys(tagCounts);
  const lq = query.toLowerCase();
  const mentionedTag = allTags.find(t => lq.includes(t.toLowerCase()));

  if (mentionedTag) {
    const tagged = memories.filter(m => m.tags.includes(mentionedTag));
    const count = tagged.length;
    const lines = tagged.map(m => {
      const icon = m.type === "file" ? "📎" : m.type === "link" ? "🔗" : "📝";
      return `${icon} **${m.title}**`;
    });
    return {
      content:
        `С тегом **#${mentionedTag}** — ${plural(count, "запись", "записи", "записей")}:\n\n` +
        lines.join("\n"),
      sources: tagged.slice(0, 6).map(m => ({ id: m.id, title: m.title, type: m.type })),
    };
  }

  const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const content =
    `**Теги** (всего уникальных: ${Object.keys(tagCounts).length}):\n\n` +
    sorted.map(([tag, count]) => `• **#${tag}** — ${plural(count, "запись", "записи", "записей")}`).join("\n");

  return { content, sources: [] };
}

function handleRecent(memories: Memory[]): ChatEngineResult {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = memories
    .filter(m => new Date(m.createdAt).getTime() > weekAgo)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (recent.length === 0) {
    return { content: "За последнюю неделю новых записей не добавлялось.", sources: [] };
  }

  const lines = recent.slice(0, 6).map(m => {
    const icon = m.type === "file" ? "📎" : m.type === "link" ? "🔗" : "📝";
    const desc = bestText(m, 70);
    return `${icon} **${m.title}**${desc ? ` — ${desc}` : ""}`;
  });

  const content =
    `За последние 7 дней добавлено **${plural(recent.length, "воспоминание", "воспоминания", "воспоминаний")}**:\n\n` +
    lines.join("\n");

  return {
    content,
    sources: recent.slice(0, 5).map(m => ({ id: m.id, title: m.title, type: m.type })),
  };
}

function handleFile(query: string, memories: Memory[]): ChatEngineResult {
  const files = memories.filter(m => m.type === "file");

  if (files.length === 0) {
    return { content: "В базе нет загруженных файлов.", sources: [] };
  }

  const target = findTargetMemory(query, files);

  if (target && target.type === "file") {
    let content = `**${target.title}**\n• Тип: ${fileStatusLabel(target)}`;
    if (target.fileSize) content += `\n• Размер: ${(target.fileSize / 1024).toFixed(1)} КБ`;

    const text = bestText(target, 350);
    if (text) {
      content += `\n\n**Содержимое:**\n${text}`;
    } else if (target.processingStatus === "ocr_needed") {
      content += `\n\nТекст не извлечён — сканированный PDF, требуется OCR.`;
    } else if (target.processingStatus === "protected") {
      content += `\n\nТекст не доступен — файл защищён паролем.`;
    }

    if (target.tags.length) content += `\n\nТеги: ${target.tags.map(t => `#${t}`).join(" ")}`;

    return { content, sources: [{ id: target.id, title: target.title, type: target.type }] };
  }

  const lines = files.map(f =>
    `• **${f.title}** — ${fileStatusLabel(f)}${f.fileSize ? ` (${(f.fileSize / 1024).toFixed(1)} КБ)` : ""}`
  );

  return {
    content: `**Файлы в базе (${files.length}):**\n\n${lines.join("\n")}`,
    sources: files.slice(0, 6).map(f => ({ id: f.id, title: f.title, type: f.type })),
  };
}

function handleLink(query: string, memories: Memory[]): ChatEngineResult {
  const links = memories.filter(m => m.type === "link");

  if (links.length === 0) {
    return { content: "В базе нет сохранённых ссылок.", sources: [] };
  }

  const target = findTargetMemory(query, links);

  if (target && target.type === "link") {
    let content = `**${target.title}**`;
    if (target.linkDomain) content += `\n• Домен: ${target.linkDomain}`;
    if (target.linkUrl) content += `\n• URL: ${target.linkUrl}`;

    const text = bestText(target, 350);
    if (text) content += `\n\n**Описание:**\n${text}`;
    if (target.tags.length) content += `\n\nТеги: ${target.tags.map(t => `#${t}`).join(" ")}`;

    return { content, sources: [{ id: target.id, title: target.title, type: target.type }] };
  }

  const lines = links.map(l => {
    const domain = l.linkDomain ? ` [${l.linkDomain}]` : "";
    const desc = l.linkDescription ? ` — ${excerpt(l.linkDescription, 60)}` : "";
    return `• **${l.title}**${domain}${desc}`;
  });

  return {
    content: `**Ссылки в базе (${links.length}):**\n\n${lines.join("\n")}`,
    sources: links.slice(0, 6).map(l => ({ id: l.id, title: l.title, type: l.type })),
  };
}

// Extract the two terms being compared from the query
function extractComparisonTerms(query: string): [string, string] | null {
  const q = query.trim();
  const patterns: RegExp[] = [
    /сравни\s+(.+?)\s+и\s+(.+?)(?:\s+по\s+|\s*[?!.]?\s*$)/i,
    /сравнение\s+(.+?)\s+(?:и|vs|versus|против)\s+(.+?)(?:\s+по\s+|\s*[?!.]?\s*$)/i,
    /(.+?)\s+vs\.?\s+(.+?)(?:\s+по\s+|\s*[?!.]?\s*$)/i,
    /(.+?)\s+versus\s+(.+?)(?:\s+по\s+|\s*[?!.]?\s*$)/i,
    /(.+?)\s+против\s+(.+?)(?:\s+по\s+|\s*[?!.]?\s*$)/i,
    /отличи[ея]\s+(.+?)\s+(?:от|и)\s+(.+?)(?:\s+по\s+|\s*[?!.]?\s*$)/i,
    /разниц[аы]\s+(?:между\s+)?(.+?)\s+и\s+(.+?)(?:\s+по\s+|\s*[?!.]?\s*$)/i,
    /(.+?)\s+или\s+(.+?)(?:\s*[?!.]?\s*$)/i,
  ];

  for (const p of patterns) {
    const m = q.match(p);
    if (m) {
      const clean = (s: string) =>
        s.trim().replace(/^(по\s+|мои\s+|моим\s+)/, "").replace(/[?!.]+$/, "").trim();
      const a = clean(m[1]);
      const b = clean(m[2]);
      if (a.length >= 2 && b.length >= 2) return [a, b];
    }
  }
  return null;
}

function handleComparison(query: string, memories: Memory[]): ChatEngineResult {
  const terms = extractComparisonTerms(query);

  if (!terms) {
    // No parseable terms — fall back to search
    return handleSearch(query, memories);
  }

  const [termA, termB] = terms;

  // Search for memories about each term separately
  const aboutA = searchMemories(memories, termA, "semantic")
    .filter(r => (r.relevanceScore ?? 0) > 0.05)
    .slice(0, 2);
  const aboutB = searchMemories(memories, termB, "semantic")
    .filter(r => (r.relevanceScore ?? 0) > 0.05)
    .slice(0, 2);

  const hasA = aboutA.length > 0;
  const hasB = aboutB.length > 0;

  if (!hasA && !hasB) {
    return {
      content:
        `В базе нет материалов ни о «${termA}», ни о «${termB}».\n\n` +
        `Добавьте заметки или ссылки по каждой теме, чтобы я мог провести сравнение.`,
      sources: [],
    };
  }

  const lines: string[] = [`**${termA} vs ${termB}**\n`];

  if (hasA) {
    const text = bestText(aboutA[0], 220);
    lines.push(
      `**${termA}:**\n` +
      (text
        ? text
        : `_(данные из «${aboutA[0].title}», но текстового содержимого нет)_`)
    );
  } else {
    lines.push(`**${termA}:** материалов в базе нет — добавьте записи по этой теме.`);
  }

  if (hasB) {
    const text = bestText(aboutB[0], 220);
    lines.push(
      `**${termB}:**\n` +
      (text
        ? text
        : `_(данные из «${aboutB[0].title}», но текстового содержимого нет)_`)
    );
  } else {
    lines.push(`**${termB}:** материалов в базе нет — добавьте записи по этой теме.`);
  }

  // Closing note when only partial data exists
  if (!hasA || !hasB) {
    lines.push(
      `_Для полноценного сравнения добавьте материалы о «${!hasA ? termA : termB}» в базу._`
    );
  }

  // Deduplicated sources from both sides
  const allSources = [...aboutA, ...aboutB].filter(
    (m, i, arr) => arr.findIndex(x => x.id === m.id) === i
  );

  return {
    content: lines.join("\n\n"),
    sources: allSources.map(m => ({ id: m.id, title: m.title, type: m.type })),
  };
}

function handleExplanation(query: string, memories: Memory[]): ChatEngineResult {
  const results = searchMemories(memories, query, "semantic").slice(0, 3);

  if (results.length === 0) {
    return {
      content: `По запросу «${query}» в базе нет материалов для объяснения.`,
      sources: [],
    };
  }

  const main = results[0];
  const text = bestText(main, 450);

  let content = text
    ? `На основе «**${main.title}**»:\n\n${text}`
    : `Запись «${main.title}» найдена, но текстового содержимого нет.`;

  if (results.length > 1) {
    content += `\n\nСвязанные материалы: ${results.slice(1).map(r => `«${r.title}»`).join(", ")}`;
  }

  return {
    content,
    sources: results.map(r => ({ id: r.id, title: r.title, type: r.type })),
  };
}

function handleRelations(query: string, memories: Memory[]): ChatEngineResult {
  const results = searchMemories(memories, query, "semantic").slice(0, 3);
  if (results.length === 0) {
    return { content: "Не найдено связанных записей.", sources: [] };
  }

  const main = results[0];
  const related = memories.filter(m => (main.relatedIds || []).includes(m.id)).slice(0, 4);

  let content = `**${main.title}**`;

  if (related.length > 0) {
    content +=
      `\n\n**Связанные записи:**\n` +
      related.map(r => {
        const icon = r.type === "file" ? "📎" : r.type === "link" ? "🔗" : "📝";
        return `${icon} ${r.title}`;
      }).join("\n");
  } else {
    const semanticNeighbours = results.slice(1).map(r => `«${r.title}»`).join(", ");
    content += semanticNeighbours
      ? `\n\nЯвных связей нет, но семантически близко к: ${semanticNeighbours}`
      : "\n\nЯвных связей с другими записями пока нет.";
  }

  return {
    content,
    sources: [main, ...related].slice(0, 5).map(m => ({ id: m.id, title: m.title, type: m.type })),
  };
}

function handleSearch(query: string, memories: Memory[]): ChatEngineResult {
  const results = searchMemories(memories, query, "semantic").slice(0, 5);

  if (results.length === 0) {
    return {
      content:
        `По запросу «${query}» ничего не найдено.\n\n` +
        `**Попробуйте:**\n` +
        `• Другие слова или более общий запрос\n` +
        `• Переключиться на Поиск по ключевым словам\n` +
        `• Добавить записи по этой теме`,
      sources: [],
    };
  }

  const sources: ChatSource[] = results.map(r => ({ id: r.id, title: r.title, type: r.type }));

  if (results.length === 1 || results[0].relevanceScore > 0.8) {
    const m = results[0];
    const text = bestText(m, 400);
    let content = `**${m.title}**`;
    if (text) content += `\n\n${text}`;
    if (m.tags.length) content += `\n\nТеги: ${m.tags.map(t => `#${t}`).join(" ")}`;
    return { content, sources };
  }

  const lines = results.slice(0, 4).map(r => {
    const icon = r.type === "file" ? "📎" : r.type === "link" ? "🔗" : "📝";
    const text = bestText(r, 130);
    return `${icon} **${r.title}**${text ? `\n   ${text}` : ""}`;
  });

  return {
    content: `По теме «${query}»:\n\n${lines.join("\n\n")}`,
    sources,
  };
}

// ─── OpenAI Context Builder ────────────────────────────────────────────────────

function buildMemoryContext(memories: Memory[], maxItems = 6): string {
  return memories.slice(0, maxItems).map(m => {
    const parts: string[] = [`[${m.type.toUpperCase()}] "${m.title}"`];

    if (m.type === "file") {
      const statusLine =
        m.processingStatus === "ocr_needed" ? "статус: сканированный PDF, OCR нужен — текст как изображения"
        : m.processingStatus === "protected" ? "статус: защищён паролем"
        : (m.extractedContent && m.extractedContent.trim().length > 10)
          ? `статус: текст извлечён (${m.extractedContent.trim().split(/\s+/).length} слов)`
        : "статус: текст не извлечён";
      parts.push(statusLine);
      if (m.fileSize) parts.push(`размер: ${(m.fileSize / 1024).toFixed(1)} КБ`);
    }

    if (m.type === "link") {
      if (m.linkUrl) parts.push(`URL: ${m.linkUrl}`);
      if (m.linkDomain) parts.push(`домен: ${m.linkDomain}`);
    }

    const text = bestText(m, 350);
    if (text) parts.push(`содержимое: ${text}`);
    if (m.tags.length) parts.push(`теги: ${m.tags.join(", ")}`);

    return parts.join("\n");
  }).join("\n---\n");
}

// ─── OpenAI-backed answer ──────────────────────────────────────────────────────

const INTENT_GUIDE: Record<Intent, string> = {
  status:
    "Пользователь спрашивает о СТАТУСЕ файла или записи. " +
    "Ответь ПРЯМО: что это, можно ли извлечь текст, каков статус обработки. " +
    "Используй данные о processingStatus из контекста.",
  capability:
    "Пользователь спрашивает о ВОЗМОЖНОСТЯХ системы. " +
    "Ответь конкретно: да/нет, и почему. Если нет — предложи альтернативу.",
  summary:
    "Пользователь просит РЕЗЮМЕ или КРАТКОЕ СОДЕРЖАНИЕ. " +
    "Если вопрос о конкретном документе — дай его содержание. " +
    "Если вопрос о теме — синтезируй главные идеи из нескольких записей в связный текст, не просто список.",
  list:
    "Пользователь просит СПИСОК. Дай структурированный список с кратким описанием каждого.",
  stats:
    "Пользователь спрашивает СТАТИСТИКУ. Начни с числа, затем детали.",
  tags:
    "Пользователь спрашивает о ТЕГАХ. Перечисли теги с частотой.",
  recent:
    "Пользователь спрашивает о НЕДАВНИХ записях. Перечисли то, что добавлено недавно.",
  comparison:
    "Пользователь просит СРАВНЕНИЕ двух понятий или инструментов. " +
    "Выдели два сравниваемых объекта. " +
    "Для каждого — один абзац на основе данных из контекста. " +
    "Заверши одним предложением с явным выводом или рекомендацией. " +
    "НЕ перечисляй записи как список — сравни явно.",
  explanation:
    "Пользователь просит ОБЪЯСНЕНИЕ. Объясни, опираясь на текст из контекста.",
  file:
    "Вопрос про ФАЙЛ. Используй все метаданные: тип файла, статус обработки, размер, содержимое. " +
    "Если сканированный PDF — скажи об этом явно.",
  link:
    "Вопрос про ССЫЛКУ или САЙТ. Используй URL, домен, описание страницы, заголовок.",
  relations:
    "Вопрос про СВЯЗИ. Опиши связи на основе тегов и семантического сходства.",
  search:
    "Семантический поиск. Дай прямой ответ на основе найденного контента. " +
    "Начни с ответа, а не с перечисления источников.",
};

async function tryOpenAI(
  query: string,
  intent: Intent,
  relevantMemories: Memory[],
  history: { role: "user" | "assistant"; content: string }[]
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const contextBlock = buildMemoryContext(relevantMemories, 6);

    const systemPrompt =
      `Ты — персональный AI-ассистент базы знаний Memory Hub. Отвечай ТОЛЬКО на русском языке.\n\n` +
      `Тип вопроса: ${INTENT_GUIDE[intent]}\n\n` +
      `ПРАВИЛА ОТВЕТА:\n` +
      `• Отвечай ПРЯМО — сначала ответ, потом объяснение, потом источники\n` +
      `• Используй ТОЛЬКО факты из контекста ниже\n` +
      `• Не придумывай содержимое файлов и ссылок\n` +
      `• Если информации нет — честно скажи об этом\n` +
      `• НЕ начинай с перечисления всех записей\n` +
      `• Разные вопросы — разные стили ответа\n` +
      `• Будь конкретным и кратким\n\n` +
      `Контекст из базы знаний:\n${contextBlock}`;

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
        max_tokens: 750,
        temperature: 0.2,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json() as { choices: { message: { content: string } }[] };
    return data.choices[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

// ─── Main Entry Point ──────────────────────────────────────────────────────────

export async function answerQuery(
  query: string,
  memories: Memory[],
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<ChatEngineResult> {
  const intent = detectIntent(query.toLowerCase());

  // Pure data intents — no retrieval needed
  if (intent === "stats") return handleStats(memories);
  if (intent === "tags")  return handleTags(query, memories);
  if (intent === "recent") return handleRecent(memories);
  if (intent === "list")  return handleList(query, memories);

  // Retrieval for all remaining intents
  const relevant = searchMemories(memories, query, "semantic").slice(0, 6);
  const sources: ChatSource[] = relevant.map(r => ({ id: r.id, title: r.title, type: r.type }));

  // Try OpenAI with intent-aware prompt
  if (relevant.length > 0) {
    const aiAnswer = await tryOpenAI(query, intent, relevant, history);
    if (aiAnswer) {
      return { content: aiAnswer, sources };
    }
  }

  // Local fallback — intent-routed handlers
  switch (intent) {
    case "status":      return handleStatus(query, memories);
    case "capability":  return handleCapability(query, memories);
    case "summary":     return handleSummary(query, memories);
    case "file":        return handleFile(query, memories);
    case "link":        return handleLink(query, memories);
    case "comparison":  return handleComparison(query, memories);
    case "explanation": return handleExplanation(query, memories);
    case "relations":   return handleRelations(query, memories);
    default:            return handleSearch(query, memories);
  }
}

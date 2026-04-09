export interface LinkMetadata {
  url: string;
  domain: string;
  title: string;
  description: string;
  bodyText: string;
  success: boolean;
  error?: string;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getMetaContent(html: string, name: string): string {
  const patterns = [
    new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${name}["']`, "i"),
    new RegExp(`<meta[^>]*property=["']${name}["'][^>]*content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${name}["']`, "i"),
  ];
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m) return m[1].trim();
  }
  return "";
}

function getTitleFromHtml(html: string): string {
  const ogTitle = getMetaContent(html, "og:title");
  if (ogTitle) return ogTitle;
  const twitterTitle = getMetaContent(html, "twitter:title");
  if (twitterTitle) return twitterTitle;
  const tagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (tagMatch) return tagMatch[1].trim();
  return "";
}

function getDescriptionFromHtml(html: string): string {
  return (
    getMetaContent(html, "og:description") ||
    getMetaContent(html, "twitter:description") ||
    getMetaContent(html, "description") ||
    ""
  );
}

// Patterns that indicate UI boilerplate noise
const NOISE_PATTERNS = [
  /^(home|about|contact|sign\s?in|sign\s?up|log\s?in|register|menu|navigation|search|close|open|toggle|skip to|back to top|read more|learn more|click here|get started|subscribe|newsletter|cookie|accept|decline|ok|cancel|yes|no|×|‹|›|«|»|\.{3})$/i,
  /^(главная|о нас|контакты|войти|выйти|зарегистрироваться|меню|поиск|закрыть|назад|вперёд|читать|ещё|далее|отмена|принять|отклонить)$/i,
  /cookie/i,
  /privacy policy/i,
  /terms of service/i,
  /all rights reserved/i,
  /copyright ©/i,
  /follow us/i,
  /share this/i,
];

function isNoisyLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 4) return true;
  // Pure navigation / menu items: very short with no sentence structure
  if (trimmed.length < 25 && !/[.!?,]/.test(trimmed) && /^[A-ZА-Я]/.test(trimmed) && !/\s{2,}/.test(trimmed)) {
    // Single word or very short label — likely a nav item
    if (!/\s/.test(trimmed)) return true;
  }
  // Known boilerplate patterns
  if (NOISE_PATTERNS.some(p => p.test(trimmed))) return true;
  // Breadcrumb pattern (e.g. "Home > Blog > Article")
  if (/(\w+\s*[>›»/]\s*){2,}\w+/.test(trimmed)) return true;
  return false;
}

function extractParagraphs(html: string): string[] {
  const paragraphs: string[] = [];

  // Extract text from <p> tags first (highest signal)
  const pTagMatches = html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  for (const m of pTagMatches) {
    const text = stripTags(m[1]).trim();
    if (text.length > 40 && !isNoisyLine(text)) {
      paragraphs.push(text);
    }
  }

  // Also extract <li> items that look like sentences
  const liMatches = html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi);
  for (const m of liMatches) {
    const text = stripTags(m[1]).trim();
    if (text.length > 30 && text.includes(" ") && !isNoisyLine(text)) {
      paragraphs.push(text);
    }
  }

  // Extract <h2>/<h3> headings as context anchors
  const headingMatches = html.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi);
  for (const m of headingMatches) {
    const text = stripTags(m[1]).trim();
    if (text.length > 5 && text.length < 120 && !isNoisyLine(text)) {
      paragraphs.push(text);
    }
  }

  return paragraphs;
}

function getBodyText(html: string, maxChars = 3000): string {
  // Remove boilerplate structural elements
  let body = html
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Try structured paragraph extraction first
  const mainMatch = body.match(/<(?:main|article|section)[^>]*>([\s\S]*?)<\/(?:main|article|section)>/i);
  const contentArea = mainMatch ? mainMatch[1] : body;

  const paragraphs = extractParagraphs(contentArea);

  if (paragraphs.length >= 2) {
    // Use paragraph-based extraction — highest quality
    const result = paragraphs.join("\n").slice(0, maxChars);
    return result;
  }

  // Fallback: strip all tags from main content area
  const rawText = stripTags(contentArea);

  // Filter line-by-line
  const lines = rawText
    .split(/\n+/)
    .map(l => l.trim())
    .filter(l => l.length > 20 && !isNoisyLine(l));

  return lines.join("\n").slice(0, maxChars);
}

export async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
  const domain = extractDomain(url);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MemoryHub/1.0; +https://memoryhub.app)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ru,en;q=0.8",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        url, domain,
        title: domain,
        description: "",
        bodyText: "",
        success: false,
        error: `HTTP ${response.status}`,
      };
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return {
        url, domain,
        title: domain,
        description: `Файл: ${contentType}`,
        bodyText: "",
        success: true,
      };
    }

    const html = await response.text();
    const title = getTitleFromHtml(html) || domain;
    const description = getDescriptionFromHtml(html);
    const bodyText = getBodyText(html);

    return { url, domain, title, description, bodyText, success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Ошибка подключения";
    return {
      url, domain,
      title: domain,
      description: "",
      bodyText: "",
      success: false,
      error: msg,
    };
  }
}

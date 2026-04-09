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

function getBodyText(html: string, maxChars = 3000): string {
  // Remove boilerplate sections
  let body = html
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "");

  // Try to extract main content area first
  const mainMatch = body.match(/<(?:main|article)[^>]*>([\s\S]*?)<\/(?:main|article)>/i);
  const contentHtml = mainMatch ? mainMatch[1] : body;

  const text = stripTags(contentHtml);
  return text.slice(0, maxChars);
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

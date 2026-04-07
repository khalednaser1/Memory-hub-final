import { Memory } from '@shared/schema';

// Russian + English synonym map for semantic-like searching
const SYNONYMS: Record<string, string[]> = {
  // Russian
  'учёба':      ['образование', 'обучение', 'учить', 'изучать', 'университет', 'курс'],
  'работа':     ['практика', 'проект', 'задача', 'стажировка', 'офис', 'компания'],
  'проект':     ['разработка', 'приложение', 'система', 'продукт', 'стартап'],
  'идея':       ['концепция', 'мысль', 'вдохновение', 'план', 'предложение'],
  'ошибка':     ['баг', 'проблема', 'issue', 'exception', 'сбой', 'дефект'],
  'дизайн':     ['ui', 'ux', 'интерфейс', 'макет', 'верстка', 'стиль'],
  'программ':   ['код', 'разработка', 'frontend', 'backend', 'алгоритм'],
  'поиск':      ['найти', 'искать', 'запрос', 'фильтр', 'результат'],
  'сохранить':  ['запись', 'хранить', 'архив', 'база', 'документ'],
  'диплом':     ['дипломная', 'дипломный', 'курсовая', 'защита', 'university'],
  'статья':     ['материал', 'текст', 'документ', 'заметка', 'публикация'],
  'react':      ['реакт', 'jsx', 'component', 'hook', 'useState', 'useEffect', 'vite'],
  'алгоритм':   ['метод', 'подход', 'реализация', 'логика', 'функция'],
  'семантика':  ['смысл', 'значение', 'контекст', 'nlp', 'embedding'],
  'фронтенд':   ['frontend', 'react', 'css', 'html', 'javascript', 'typescript'],
  'бэкенд':     ['backend', 'server', 'api', 'express', 'node'],
  'база':       ['db', 'database', 'хранилище', 'данные', 'postgres', 'sql'],
  // English
  'learn':      ['study', 'education', 'training', 'course', 'tutorial'],
  'work':       ['job', 'task', 'project', 'internship', 'career'],
  'idea':       ['concept', 'thought', 'inspiration', 'brainstorm'],
  'bug':        ['error', 'issue', 'problem', 'fix', 'debug'],
  'design':     ['ui', 'ux', 'interface', 'layout', 'style'],
  'api':        ['endpoint', 'request', 'response', 'rest', 'http'],
  'database':   ['db', 'data', 'storage', 'sql', 'query'],
  'frontend':   ['client', 'web', 'react', 'vue', 'angular'],
  'backend':    ['server', 'api', 'logic', 'node', 'express'],
};

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/\b[\wа-яёА-ЯЁ]+\b/g) || [];
}

function computeTokenOverlap(queryTokens: string[], text: string): number {
  const querySet = new Set(queryTokens);
  const textTokens = tokenize(text);
  let matches = 0;
  textTokens.forEach(token => {
    if (querySet.has(token)) matches++;
    // Partial stem match for Russian (prefix of 5+ chars)
    if (token.length >= 5) {
      queryTokens.forEach(qt => {
        if (qt.length >= 5 && (token.startsWith(qt.slice(0, 5)) || qt.startsWith(token.slice(0, 5)))) {
          matches += 0.5;
        }
      });
    }
  });
  return queryTokens.length > 0 ? Math.min(1, matches / queryTokens.length) : 0;
}

function findSynonymMatches(queryTokens: string[], text: string): number {
  const textTokenSet = new Set(tokenize(text));
  let synonymMatches = 0;
  queryTokens.forEach(token => {
    const syns = SYNONYMS[token] || [];
    syns.forEach(synonym => {
      if (textTokenSet.has(synonym)) synonymMatches += 0.8;
    });
    // Also check reverse: if text token is a synonym key and query overlaps its synonyms
    textTokenSet.forEach(textToken => {
      const reverseSyns = SYNONYMS[textToken] || [];
      if (reverseSyns.includes(token)) synonymMatches += 0.5;
    });
  });
  return synonymMatches;
}

function computeTagOverlap(queryTokens: string[], memory: Memory): number {
  const memoryTagsLower = memory.tags.map((t: string) => t.toLowerCase());
  let matches = 0;
  memoryTagsLower.forEach(tag => {
    queryTokens.forEach(token => {
      if (tag === token) matches += 1.5;           // exact tag match
      else if (tag.includes(token) || token.includes(tag)) matches += 0.8; // partial
    });
  });
  return matches;
}

function detectPhraseMatch(query: string, text: string): boolean {
  const q = query.toLowerCase().trim();
  return q.length >= 4 && text.toLowerCase().includes(q);
}

function getRecencyBonus(memory: Memory): number {
  const daysSince = (Date.now() - new Date(memory.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, 0.8 - daysSince / 60); // fades over 60 days
}

export interface SearchResult extends Memory {
  relevanceScore: number;
  matchReason: string;
}

export function semanticSearch(
  memories: Memory[],
  query: string,
  mode: 'semantic' | 'keyword'
): SearchResult[] {
  if (!query.trim()) return [];
  const queryTokens = tokenize(query);
  const results: SearchResult[] = [];

  memories.forEach(memory => {
    const titleText = memory.title.toLowerCase();
    const fullText = `${memory.title} ${memory.content} ${memory.summary || ''} ${memory.tags.join(' ')}`.toLowerCase();

    let score = 0;
    const reasons: string[] = [];

    if (mode === 'keyword') {
      // Keyword mode: exact phrase first, then word overlap
      if (detectPhraseMatch(query, fullText)) {
        score += 1.0;
        reasons.push('Точное совпадение');
      } else {
        const overlap = computeTokenOverlap(queryTokens, fullText);
        if (overlap > 0) {
          score += overlap * 0.7;
          reasons.push(`Совпадение ${Math.round(overlap * 100)}%`);
        }
      }
      // Tag bonus in keyword mode too
      const tagScore = computeTagOverlap(queryTokens, memory);
      if (tagScore > 0) {
        score += Math.min(0.3, tagScore * 0.15);
        reasons.push('Теги');
      }
    } else {
      // Semantic mode: multi-signal scoring

      // 1. Phrase match (highest signal)
      if (detectPhraseMatch(query, fullText)) {
        score += 0.6;
        reasons.push('Точное совпадение');
      }

      // 2. Title match gets 2× weight
      const titleOverlap = computeTokenOverlap(queryTokens, titleText);
      if (titleOverlap > 0) {
        score += titleOverlap * 0.5;
        reasons.push('Заголовок');
      }

      // 3. Content/summary token overlap
      const contentOverlap = computeTokenOverlap(queryTokens, `${memory.content} ${memory.summary || ''}`);
      if (contentOverlap > 0) {
        score += contentOverlap * 0.3;
        if (!reasons.includes('Заголовок')) reasons.push(`Контент (${Math.round(contentOverlap * 100)}%)`);
      }

      // 4. Synonym matching
      const synonymMatches = findSynonymMatches(queryTokens, fullText);
      if (synonymMatches > 0) {
        score += Math.min(0.35, synonymMatches * 0.1);
        reasons.push('Синонимы');
      }

      // 5. Tag overlap
      const tagOverlap = computeTagOverlap(queryTokens, memory);
      if (tagOverlap > 0) {
        score += Math.min(0.3, tagOverlap * 0.12);
        reasons.push('Теги');
      }

      // 6. Entities match
      const entityText = `${(memory.entities?.people || []).join(' ')} ${(memory.entities?.topics || []).join(' ')}`.toLowerCase();
      const entityOverlap = computeTokenOverlap(queryTokens, entityText);
      if (entityOverlap > 0) {
        score += entityOverlap * 0.15;
        reasons.push('Сущности');
      }

      // 7. Recency boost (small)
      score += getRecencyBonus(memory) * 0.08;
    }

    if (score > 0.05) {
      results.push({
        ...memory,
        relevanceScore: Math.min(1, score),
        matchReason: reasons.slice(0, 3).join(' + ') || 'Релевантно',
      });
    }
  });

  return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

export function extractEntities(text: string) {
  const entities = {
    people: [] as string[],
    dates: [] as string[],
    emails: [] as string[],
  };
  const capitalizedWords = text.match(/\b[A-ЯЁ][a-яё]+(?:\s+[A-ЯЁ][a-яё]+)*/g) || [];
  entities.people = Array.from(new Set(capitalizedWords)).slice(0, 5);
  const dates = text.match(/\b(\d{4}|\d{1,2}\.\d{1,2}\.\d{2,4}|\d{1,2}\/\d{1,2}\/\d{2,4})\b/g) || [];
  entities.dates = Array.from(new Set(dates));
  const emails = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [];
  entities.emails = Array.from(new Set(emails));
  return entities;
}

export function generateSummary(content: string): string {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());
  if (sentences.length === 0) return content.slice(0, 150);
  const summary = sentences.slice(0, 2).join('. ').trim();
  return summary.length > 150 ? summary.slice(0, 150) + '...' : summary + '.';
}

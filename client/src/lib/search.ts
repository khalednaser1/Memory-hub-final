import { Memory } from '@shared/schema';

// Synonym map for semantic-like searching
const SYNONYMS: Record<string, string[]> = {
  'learn': ['study', 'education', 'training'],
  'university': ['uni', 'college', 'school'],
  'report': ['document', 'paper', 'article'],
  'work': ['internship', 'job', 'task', 'project'],
  'idea': ['concept', 'thought', 'inspiration'],
  'bug': ['error', 'issue', 'problem'],
  'feature': ['functionality', 'capability'],
  'design': ['ui', 'ux', 'interface', 'layout'],
  'api': ['endpoint', 'request', 'response'],
  'database': ['db', 'data', 'storage'],
  'frontend': ['client', 'ui', 'web'],
  'backend': ['server', 'api', 'logic'],
};

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/\b\w+\b/g) || [];
}

function computeTokenOverlap(query: string, text: string): number {
  const queryTokens = tokenize(query);
  const querySet: Record<string, boolean> = {};
  queryTokens.forEach(t => { querySet[t] = true; });
  const textTokens = tokenize(text);
  
  let matches = 0;
  textTokens.forEach(token => {
    if (querySet[token]) matches++;
  });
  
  return queryTokens.length > 0 ? matches / queryTokens.length : 0;
}

function findSynonymMatches(query: string, text: string): number {
  const queryTokens = tokenize(query);
  const textTokenSet: Record<string, boolean> = {};
  tokenize(text).forEach(t => { textTokenSet[t] = true; });
  
  let synonymMatches = 0;
  
  queryTokens.forEach(token => {
    if (SYNONYMS[token]) {
      SYNONYMS[token].forEach(synonym => {
        if (textTokenSet[synonym]) {
          synonymMatches++;
        }
      });
    }
  });
  
  return synonymMatches;
}

function computeTagOverlap(queryTokens: string[], memory: Memory): number {
  const memoryTagsLower = memory.tags.map((t: string) => t.toLowerCase());
  const querySet: Record<string, boolean> = {};
  queryTokens.forEach(t => { querySet[t] = true; });
  
  let matches = 0;
  memoryTagsLower.forEach(tag => {
    queryTokens.forEach(token => {
      if (tag.includes(token) || token.includes(tag)) {
        matches++;
      }
    });
  });
  
  return matches;
}

function getRecencyBonus(memory: Memory): number {
  const daysSince = (Date.now() - new Date(memory.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, 1 - (daysSince / 30)); // Bonus decreases over 30 days
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
  const queryTokens = tokenize(query);
  const results: SearchResult[] = [];

  memories.forEach(memory => {
    const fullText = `${memory.title} ${memory.content} ${memory.summary}`.toLowerCase();
    
    let score = 0;
    let reasons: string[] = [];

    if (mode === 'keyword') {
      // Keyword mode: exact or partial word matching
      if (fullText.includes(query.toLowerCase())) {
        score += 1;
        reasons.push('Точное совпадение');
      } else {
        const overlap = computeTokenOverlap(query, fullText);
        if (overlap > 0) {
          score += overlap * 0.7;
          reasons.push(`Совпадение ${Math.round(overlap * 100)}%`);
        }
      }
    } else {
      // Semantic mode: multiple signals
      const tokenOverlap = computeTokenOverlap(query, fullText);
      if (tokenOverlap > 0) {
        score += tokenOverlap * 0.4;
        reasons.push(`Слова (${Math.round(tokenOverlap * 100)}%)`);
      }

      const synonymMatches = findSynonymMatches(query, fullText);
      if (synonymMatches > 0) {
        score += Math.min(0.3, synonymMatches * 0.1);
        reasons.push('Синонимы');
      }

      const tagOverlap = computeTagOverlap(queryTokens, memory);
      if (tagOverlap > 0) {
        score += Math.min(0.2, tagOverlap * 0.1);
        reasons.push('Теги');
      }

      const recency = getRecencyBonus(memory);
      score += recency * 0.1;
    }

    if (score > 0) {
      results.push({
        ...memory,
        relevanceScore: Math.min(1, score),
        matchReason: reasons.join(' + ') || 'Релевантно'
      });
    }
  });

  return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

export function extractEntities(text: string) {
  const entities = {
    people: [] as string[],
    dates: [] as string[],
    emails: [] as string[]
  };

  // Simple capitalized word detection for people
  const capitalizedWords = text.match(/\b[A-ЯЁ][a-яё]+(?:\s+[A-ЯЁ][a-яё]+)*/g) || [];
  entities.people = Array.from(new Set(capitalizedWords)).slice(0, 5);

  // Simple date patterns (YYYY, DD.MM, etc)
  const dates = text.match(/\b(\d{4}|\d{1,2}\.\d{1,2}\.\d{2,4}|\d{1,2}\/\d{1,2}\/\d{2,4})\b/g) || [];
  entities.dates = Array.from(new Set(dates));

  // Email detection
  const emails = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || [];
  entities.emails = Array.from(new Set(emails));

  return entities;
}

export function generateSummary(content: string): string {
  // Simple heuristic: first 2-3 sentences or first 150 chars
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());
  if (sentences.length === 0) return content.slice(0, 150);
  
  const summary = sentences.slice(0, 2).join('. ').trim();
  return summary.length > 150 ? summary.slice(0, 150) + '...' : summary + '.';
}

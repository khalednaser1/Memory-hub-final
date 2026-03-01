import { type Memory } from "@shared/schema";

export function generateMockEnrichment(title: string, content: string) {
  const combined = `${title} ${content}`.toLowerCase();
  
  const topics = [];
  if (combined.includes("react") || combined.includes("js") || combined.includes("frontend")) topics.push("Frontend");
  if (combined.includes("report") || combined.includes("doc")) topics.push("Work");
  if (combined.includes("internship") || combined.includes("practice")) topics.push("Internship");
  if (topics.length === 0) topics.push("General");
  
  return {
    tags: topics.map(t => t.toLowerCase()),
    entities: {
      people: combined.includes("john") ? ["John Doe"] : [],
      dates: combined.includes("2024") ? ["2024"] : [],
      topics: topics
    },
    summary: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
    semanticSignature: combined
  };
}

export function searchMemories(memories: Memory[], query: string, mode: 'semantic' | 'keyword') {
  const q = query.toLowerCase();
  const results = [];
  
  for (const m of memories) {
    let score = 0;
    let reason = "";
    
    const combined = `${m.title} ${m.content} ${m.tags.join(' ')} ${m.summary}`.toLowerCase();
    
    if (mode === 'keyword') {
      if (combined.includes(q)) {
        score = 1;
        reason = "Exact keyword match";
        results.push({ ...m, relevanceScore: score, matchReason: reason });
      }
    } else {
      let matched = false;
      
      // Direct word match
      if (combined.includes(q)) {
        score += 0.8;
        matched = true;
        reason = "Direct match";
      }
      
      // Mock semantic synonym (specifically requested by user)
      if ((q.includes("internship report") && combined.includes("practice document")) ||
          (q.includes("practice document") && combined.includes("internship report"))) {
        score += 0.9;
        matched = true;
        reason = "Semantic similarity match";
      }
      
      // Topic match
      if (m.tags.some(t => q.includes(t))) {
        score += 0.5;
        matched = true;
        reason = reason ? reason + ", topic match" : "Topic match";
      }
      
      if (matched) {
        results.push({ ...m, relevanceScore: Math.min(1, score), matchReason: reason });
      }
    }
  }
  
  return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

import { useMemories } from "@/hooks/use-memories";
import { motion } from "framer-motion";
import { Network, Hash, User, Globe, Cpu, Tag, Brain, TrendingUp } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38 } }
};

function NodeGraph({ nodes }: { nodes: { label: string; count: number; color: string }[] }) {
  const W = 480;
  const H = 260;
  const cx = W / 2;
  const cy = H / 2;
  const radius = 100;
  const displayed = nodes.slice(0, 10);
  const maxCount = Math.max(...displayed.map(n => n.count), 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </radialGradient>
        <filter id="blur-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <circle cx={cx} cy={cy} r={50} fill="url(#centerGlow)" />

      {displayed.map((node, i) => {
        const angle = (i / displayed.length) * 2 * Math.PI - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        const strength = node.count / maxCount;
        return (
          <line
            key={`line-${i}`}
            x1={cx} y1={cy} x2={x} y2={y}
            stroke={node.color}
            strokeWidth={0.5 + strength * 1.5}
            strokeOpacity={0.2 + strength * 0.3}
            strokeDasharray={strength > 0.6 ? "none" : "3,4"}
          />
        );
      })}

      <circle cx={cx} cy={cy} r={22} fill="hsl(var(--primary) / 0.12)" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1.5" />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="hsl(var(--primary))" fontWeight="600">Hub</text>

      {displayed.map((node, i) => {
        const angle = (i / displayed.length) * 2 * Math.PI - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        const nodeR = 6 + (node.count / maxCount) * 10;
        const labelOffset = nodeR + 10;
        const labelX = cx + Math.cos(angle) * (radius + labelOffset);
        const labelY = cy + Math.sin(angle) * (radius + labelOffset);

        return (
          <g key={`node-${i}`}>
            <circle cx={x} cy={y} r={nodeR + 3} fill={node.color} fillOpacity="0.1" />
            <circle
              cx={x} cy={y} r={nodeR}
              fill={node.color}
              fillOpacity="0.85"
              stroke="white"
              strokeWidth="1"
              strokeOpacity="0.4"
            />
            <text
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="8"
              fill="hsl(var(--foreground))"
              fillOpacity="0.7"
              fontWeight="500"
            >
              {node.label.length > 10 ? node.label.slice(0, 9) + "…" : node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function BarItem({ label, count, max, color, idx }: { label: string; count: number; max: number; color: string; idx: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground truncate pr-2">{label}</span>
        <span className="text-muted-foreground tabular-nums shrink-0">{count}</span>
      </div>
      <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 + idx * 0.05 }}
        />
      </div>
    </div>
  );
}

function PersonBadge({ name, count }: { name: string; count: number }) {
  const initials = name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase()).join("");
  const colors = [
    "from-blue-500 to-blue-600",
    "from-purple-500 to-purple-600",
    "from-emerald-500 to-emerald-600",
    "from-amber-500 to-amber-600",
    "from-rose-500 to-rose-600",
  ];
  const colorClass = colors[name.length % colors.length];
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border/30 hover:border-purple-500/20 transition-colors">
      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
        {initials || "?"}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        <p className="text-[10px] text-muted-foreground">{count} упомин.</p>
      </div>
    </div>
  );
}

function TagCloud({ tags }: { tags: [string, number][] }) {
  const max = Math.max(...tags.map(([, c]) => c), 1);
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(([tag, count]) => {
        const scale = 0.75 + (count / max) * 0.5;
        const opacity = 0.5 + (count / max) * 0.5;
        return (
          <motion.span
            key={tag}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center px-2.5 py-1 rounded-lg bg-secondary/60 text-secondary-foreground border border-border/30 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all cursor-default font-medium"
            style={{
              fontSize: `${scale * 0.8}rem`,
              opacity,
            }}
          >
            #{tag}
            <span className="ml-1 text-[9px] opacity-50 tabular-nums">{count}</span>
          </motion.span>
        );
      })}
    </div>
  );
}

export default function Connections() {
  const { data: memories, isLoading } = useMemories();

  const aggregated = {
    topics: new Map<string, number>(),
    people: new Map<string, number>(),
    tags: new Map<string, number>(),
  };

  memories?.forEach(m => {
    m.tags?.forEach(t => aggregated.tags.set(t, (aggregated.tags.get(t) || 0) + 1));
    m.entities?.topics?.forEach(t => aggregated.topics.set(t, (aggregated.topics.get(t) || 0) + 1));
    m.entities?.people?.forEach(p => aggregated.people.set(p, (aggregated.people.get(p) || 0) + 1));
  });

  const getTopItems = (map: Map<string, number>) =>
    Array.from(map.entries()).sort((a, b) => b[1] - a[1]);

  const topTopics = getTopItems(aggregated.topics).slice(0, 12);
  const topPeople = getTopItems(aggregated.people).slice(0, 10);
  const topTags = getTopItems(aggregated.tags).slice(0, 20);

  const topicMax = topTopics[0]?.[1] || 1;
  const totalNodes = aggregated.topics.size + aggregated.people.size + aggregated.tags.size;
  const totalConnections = memories?.reduce((acc, m) => acc + m.tags.length + (m.entities?.topics?.length || 0) + (m.entities?.people?.length || 0), 0) || 0;

  const graphNodes = [
    ...topTopics.slice(0, 5).map(([l, c]) => ({ label: l, count: c, color: "hsl(217, 91%, 60%)" })),
    ...topTags.slice(0, 5).map(([l, c]) => ({ label: l, count: c, color: "hsl(43, 96%, 56%)" })),
  ];

  const statCards = [
    { icon: Cpu, label: "Уникальных узлов", value: totalNodes, color: "text-primary", bg: "bg-primary/10" },
    { icon: TrendingUp, label: "Связей извлечено", value: totalConnections, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { icon: Hash, label: "Уникальных тегов", value: aggregated.tags.size, color: "text-amber-500", bg: "bg-amber-500/10" },
    { icon: User, label: "Упомянутых людей", value: aggregated.people.size, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  return (
    <div className="max-w-7xl mx-auto p-5 md:p-8 lg:p-10">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-1.5">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-xl blur-md opacity-20" />
            <div className="relative bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/15 p-2.5 rounded-xl">
              <Network className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-connections-title">Граф Знаний</h1>
            <p className="text-sm text-muted-foreground">Визуализация связей, тем и концепций из ваших записей</p>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Brain className="w-8 h-8 animate-pulse text-muted-foreground/20" />
        </div>
      ) : memories?.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-2xl border border-border/30">
          <Globe className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Недостаточно данных для построения связей.</p>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

          <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {statCards.map(card => (
              <div key={card.label} className="bg-card border border-border/30 rounded-xl p-4 flex items-center gap-3">
                <div className={`${card.bg} p-2 rounded-lg shrink-0`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold tabular-nums">{card.value}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{card.label}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {graphNodes.length > 0 && (
            <motion.div variants={item} className="bg-card border border-border/30 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Brain className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Карта концепций</h2>
                <div className="ml-auto flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Темы</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Теги</span>
                </div>
              </div>
              <div className="h-64 w-full flex items-center justify-center">
                <NodeGraph nodes={graphNodes} />
              </div>
            </motion.div>
          )}

          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-card border border-border/30 rounded-2xl p-5" data-testid="card-topics">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 pb-3 border-b border-border/30">
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <Hash className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <span className="uppercase tracking-wider text-muted-foreground text-xs">Ключевые темы</span>
                <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">{topTopics.length}</span>
              </h2>
              {topTopics.length > 0 ? (
                <div className="space-y-3">
                  {topTopics.map(([topic, count], i) => (
                    <BarItem key={topic} label={topic} count={count} max={topicMax} color="hsl(217, 91%, 60%)" idx={i} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">Нет извлечённых тем</p>
              )}
            </div>

            <div className="bg-card border border-border/30 rounded-2xl p-5" data-testid="card-people">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 pb-3 border-b border-border/30">
                <div className="p-1.5 rounded-lg bg-purple-500/10">
                  <User className="w-3.5 h-3.5 text-purple-500" />
                </div>
                <span className="uppercase tracking-wider text-muted-foreground text-xs">Упомянутые люди</span>
                <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">{topPeople.length}</span>
              </h2>
              {topPeople.length > 0 ? (
                <div className="space-y-2">
                  {topPeople.map(([person, count]) => (
                    <PersonBadge key={person} name={person} count={count} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">Нет упомянутых людей</p>
              )}
            </div>

            <div className="bg-card border border-border/30 rounded-2xl p-5" data-testid="card-tags">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 pb-3 border-b border-border/30">
                <div className="p-1.5 rounded-lg bg-amber-500/10">
                  <Tag className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <span className="uppercase tracking-wider text-muted-foreground text-xs">Облако тегов</span>
                <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">{topTags.length}</span>
              </h2>
              {topTags.length > 0 ? (
                <TagCloud tags={topTags} />
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">Нет тегов</p>
              )}
            </div>
          </motion.div>

        </motion.div>
      )}
    </div>
  );
}

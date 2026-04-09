import { Link } from "wouter";
import { motion } from "framer-motion";
import { Brain, ArrowRight, Search, Sparkles, Database, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } }
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center">
      
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] -z-10 animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-[120px] -z-10 animate-pulse-slow" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/8 rounded-full blur-[140px] -z-10" />

      <div className="max-w-5xl mx-auto px-6 py-16 text-center relative z-10">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div variants={item} className="flex justify-center mb-10">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="relative inline-flex items-center justify-center p-5 bg-gradient-to-br from-primary to-purple-600 rounded-3xl text-white shadow-2xl shadow-primary/30">
                <Brain className="w-10 h-10" />
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="mb-3">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase border border-primary/20">
              <Zap className="w-3 h-3" />
              Интеллектуальная база знаний
            </span>
          </motion.div>

          <motion.h1 
            variants={item}
            className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]"
          >
            Ваша вторая{" "}
            <span className="gradient-text">память</span>
          </motion.h1>

          <motion.p 
            variants={item}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed text-balance"
          >
            Memory Hub собирает ваши разрозненные заметки, ссылки и идеи. 
            Интеллектуальный поиск находит то, что вы имели в виду, а не просто совпадения по словам.
          </motion.p>

          <motion.div 
            variants={item}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button asChild size="lg" className="h-14 px-10 text-base rounded-2xl shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/35 hover:-translate-y-0.5 transition-all font-semibold" data-testid="button-login-hero">
              <Link href="/login">
                Начать работу <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-10 text-base rounded-2xl border-border/60 hover:bg-card" data-testid="button-demo-hero">
              <Link href="/login">
                Демо-режим
              </Link>
            </Button>
          </motion.div>

          <motion.div 
            variants={item}
            className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-5 text-left"
          >
            {[
              { icon: Database, title: "Единая база", desc: "Сохраняйте тексты, ссылки и файлы в одном безопасном месте без сложных структур.", gradient: "from-blue-500/10 to-cyan-500/10" },
              { icon: Search, title: "Смысловой поиск", desc: "Ищите по смыслу. Забыли точную фразу? Опишите идею, и система найдет нужное.", gradient: "from-purple-500/10 to-pink-500/10" },
              { icon: Sparkles, title: "Умные связи", desc: "Автоматическое извлечение людей, тем и дат для создания графа ваших знаний.", gradient: "from-amber-500/10 to-orange-500/10" }
            ].map((feature, idx) => (
              <motion.div 
                key={idx} 
                className={`bg-gradient-to-br ${feature.gradient} backdrop-blur-sm border border-border/30 p-6 rounded-2xl hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group`}
                whileHover={{ scale: 1.02 }}
              >
                <div className="bg-card/80 p-3 rounded-xl w-fit mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={item} className="mt-16 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Локальные данные</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-border" />
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Быстрый поиск</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-border" />
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              <span>AI-анализ</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

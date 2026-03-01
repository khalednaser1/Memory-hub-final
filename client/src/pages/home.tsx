import { Link } from "wouter";
import { motion } from "framer-motion";
import { Brain, ArrowRight, Search, Sparkles, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center">
      
      {/* Background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/30 rounded-full blur-[100px] -z-10" />

      <div className="max-w-5xl mx-auto px-6 py-20 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center justify-center p-4 bg-card shadow-2xl shadow-primary/20 rounded-3xl border border-white/20 dark:border-white/10">
            <Brain className="w-12 h-12 text-primary" />
          </div>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6"
        >
          Ваша вторая <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-foreground">память</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed text-balance"
        >
          Memory Hub собирает ваши разрозненные заметки, ссылки и идеи. 
          Интеллектуальный поиск находит то, что вы имели в виду, а не просто совпадения по словам.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button asChild size="lg" className="h-14 px-8 text-lg rounded-2xl shadow-xl shadow-primary/25 hover:-translate-y-1 transition-all">
            <Link href="/login">
              Войти в демо <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left"
        >
          {[
            { icon: Database, title: "Единая база", desc: "Сохраняйте тексты, ссылки и файлы в одном безопасном месте без сложных структур." },
            { icon: Search, title: "Смысловой поиск", desc: "Ищите по смыслу. Забыли точную фразу? Опишите идею, и система найдет нужное." },
            { icon: Sparkles, title: "Умные связи", desc: "Автоматическое извлечение людей, тем и дат для создания графа ваших знаний." }
          ].map((feature, idx) => (
            <div key={idx} className="bg-card/50 backdrop-blur-sm border border-border/50 p-6 rounded-2xl">
              <feature.icon className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

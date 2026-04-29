import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Brain, ArrowRight, Search, Sparkles, Shield, Zap, GraduationCap,
  BookOpen, FileText, Network, MessageCircle, Settings as SettingsIcon,
  Download, PlayCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } }
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const useCases = [
  {
    icon: BookOpen,
    title: "Конспекты лекций",
    desc: "Сохранить краткие заметки после пары, добавить теги дисциплины и быстро вернуться к материалу перед зачётом.",
  },
  {
    icon: GraduationCap,
    title: "Материалы ВКР",
    desc: "Держать рядом идеи, требования, ссылки, документы и заметки по проекту Memory Hub.",
  },
  {
    icon: FileText,
    title: "Ссылки и файлы",
    desc: "Собрать полезные статьи, PDF, DOCX и изображения в одном интерфейсе frontend-прототипа.",
  },
  {
    icon: Search,
    title: "Подготовка к встрече",
    desc: "Найти старую информацию по проекту перед консультацией, демонстрацией или защитой.",
  },
];

const demoSteps = [
  "войти в демо-режим",
  "добавить воспоминание",
  "открыть библиотеку",
  "выполнить поиск",
  "посмотреть временную шкалу",
  "открыть граф связей",
  "задать вопрос mock AI assistant",
  "перейти в настройки и экспорт",
];

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
              frontend-прототип для ВКР
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
            Прототип демонстрирует поиск, организацию, временную шкалу, граф связей и mock AI assistant без реального backend и платных AI-сервисов.
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
              { icon: FileText, title: "Единое пространство", desc: "Сохраняйте тексты, ссылки и файлы в одном интерфейсе для демонстрации пользовательского сценария.", gradient: "from-blue-500/10 to-cyan-500/10" },
              { icon: Search, title: "Поиск по смыслу", desc: "Прототип показывает, как пользователь может искать старые записи по описанию идеи или ключевым словам.", gradient: "from-purple-500/10 to-pink-500/10" },
              { icon: Sparkles, title: "Демо-связи", desc: "Локальная логика помогает показать теги, темы и граф связей между сохранёнными материалами.", gradient: "from-amber-500/10 to-orange-500/10" }
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

          <motion.div
            variants={item}
            className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-5 text-left"
          >
            <div className="bg-card/80 border border-border/40 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <GraduationCap className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Контекст ВКР</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="section-label mb-1">Тема</p>
                  <p className="font-medium leading-relaxed">Разработка интеллектуальной системы личной памяти (Memory Hub)</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="section-label mb-1">Университет</p>
                    <p className="text-muted-foreground">УрФУ</p>
                  </div>
                  <div>
                    <p className="section-label mb-1">Формат</p>
                    <p className="text-muted-foreground">frontend-прототип</p>
                  </div>
                  <div>
                    <p className="section-label mb-1">Студент</p>
                    <p className="text-muted-foreground">Гомаа Халид Насир Ахмед Заид</p>
                  </div>
                  <div>
                    <p className="section-label mb-1">Группа и роль</p>
                    <p className="text-muted-foreground">РИ-420947, Frontend Developer</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card/80 border border-border/40 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Примеры для студенческой жизни</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {useCases.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="rounded-xl border border-border/30 bg-muted/25 p-4">
                    <Icon className="w-4 h-4 text-primary mb-2" />
                    <p className="font-semibold text-sm mb-1">{title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="mt-5 bg-card/80 border border-border/40 rounded-2xl p-6 text-left shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <PlayCircle className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Сценарий видео-демонстрации</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Короткий путь для защиты показывает основные модули прототипа без заявления о готовом production backend.
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-primary bg-primary/10 border border-primary/15 px-3 py-1.5 rounded-full">
                локальная демонстрация
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {demoSteps.map((step, idx) => {
                const icons = [Shield, FileText, BookOpen, Search, PlayCircle, Network, MessageCircle, SettingsIcon];
                const Icon = icons[idx] || PlayCircle;
                return (
                  <div key={step} className="flex items-center gap-3 rounded-xl border border-border/30 bg-muted/25 p-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground mb-0.5" />
                      <p className="text-xs font-medium leading-snug">{step}</p>
                    </div>
                  </div>
                );
              })}
            </div>
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
              <span>mock AI assistant</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-border hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-500" />
              <span>Экспорт JSON</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

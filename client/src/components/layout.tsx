import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Brain, Plus, Library, Search, Network, LogOut, Menu, X,
  Calendar, MessageSquare, Settings as SettingsIcon, LayoutDashboard,
  Tag, Sun, Moon, Zap
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/contexts/theme-context";
import { CommandMenu } from "./command-menu";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandOpen(open => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  if (!user) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  const displayName = user.username || "Пользователь";
  const initials = displayName.substring(0, 2).toUpperCase();

  const navItems = [
    { href: "/dashboard",   icon: LayoutDashboard, label: "Главная"        },
    { href: "/library",     icon: Library,          label: "Библиотека"     },
    { href: "/timeline",    icon: Calendar,         label: "Шкала времени"  },
    { href: "/search",      icon: Search,           label: "Поиск"          },
    { href: "/chat",        icon: MessageSquare,    label: "Чат"            },
    { href: "/tags",        icon: Tag,              label: "Теги"           },
    { href: "/connections", icon: Network,          label: "Связи"         },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/20">
      <aside className="hidden md:flex flex-col w-[260px] border-r border-border/40 bg-card/40 backdrop-blur-xl relative z-20">
        <div className="p-5 pb-1">
          <Link href="/dashboard" className="flex items-center gap-3 font-bold text-lg text-foreground hover:opacity-80 transition-opacity group" data-testid="link-home">
            <div className="relative">
              <div className="bg-gradient-to-br from-primary to-purple-600 dark:from-primary dark:to-purple-500 p-2 rounded-xl text-white shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
                <Brain className="w-5 h-5" />
              </div>
            </div>
            <span className="tracking-tight">Memory Hub</span>
          </Link>
        </div>

        <div className="px-3 py-4">
          <Button asChild className="w-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all rounded-xl h-10 font-medium" size="default" data-testid="button-add-memory">
            <Link href="/capture">
              <Plus className="w-4 h-4 mr-2" />
              Добавить
            </Link>
          </Button>
        </div>

        <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
          <button
            onClick={() => setIsCommandOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all text-sm text-left mb-3 group"
            data-testid="button-quick-search"
          >
            <Search className="w-4 h-4" />
            <span className="flex-1">Быстрый поиск</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded-md bg-muted/80 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/70 border border-border/50">
              <span className="text-[10px]">⌘</span>K
            </kbd>
          </button>

          {navItems.map(item => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-[13px] font-medium ${
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
                data-testid={`link-nav-${item.href.slice(1)}`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
                {item.label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border/30 mt-auto space-y-0.5">
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-[13px] font-medium ${
              location === "/settings"
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
            data-testid="link-settings"
          >
            <SettingsIcon className="w-4 h-4" />
            Настройки
          </Link>

          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all text-[13px] text-left font-medium"
            title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
            data-testid="button-toggle-theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === "dark" ? "Светлая тема" : "Тёмная тема"}
          </button>

          <div className="flex items-center justify-between px-3 py-2.5 mt-2 rounded-xl bg-muted/30">
            <div className="flex items-center gap-3 truncate">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 text-white flex items-center justify-center font-semibold text-xs shrink-0 shadow-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <span className="text-sm font-medium truncate block leading-tight">{displayName}</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" />Активен
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-destructive/10"
              aria-label="Выйти"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <header className="md:hidden fixed top-0 left-0 right-0 h-14 border-b border-border/30 bg-background/90 backdrop-blur-xl z-30 flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-base" data-testid="link-mobile-home">
          <div className="bg-gradient-to-br from-primary to-purple-600 text-white p-1.5 rounded-lg shadow-sm">
            <Brain className="w-4 h-4" />
          </div>
          Memory Hub
        </Link>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsCommandOpen(true)} aria-label="Поиск" data-testid="button-mobile-search">
            <Search className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme} aria-label={theme === "dark" ? "Светлая тема" : "Тёмная тема"} data-testid="button-mobile-theme">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Меню" data-testid="button-mobile-menu">
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-14 bg-background/95 backdrop-blur-xl z-20 flex flex-col p-4 animate-in slide-in-from-top-2 duration-200 overflow-y-auto">
          <Button asChild className="w-full mb-4 rounded-xl" size="lg" data-testid="button-mobile-add">
            <Link href="/capture">
              <Plus className="w-5 h-5 mr-2" />
              Добавить воспоминание
            </Link>
          </Button>
          <nav className="flex-1 space-y-1">
            {navItems.map(item => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 p-3.5 rounded-xl text-base font-medium ${
                    isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
                  }`}
                  data-testid={`link-mobile-${item.href.slice(1)}`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            <Link href="/settings" className="flex items-center gap-4 p-3.5 rounded-xl text-base font-medium text-foreground hover:bg-muted/50" data-testid="link-mobile-settings">
              <SettingsIcon className="w-5 h-5" />
              Настройки
            </Link>
          </nav>
          <Button variant="outline" className="mt-4 w-full text-destructive rounded-xl" onClick={logout} data-testid="button-mobile-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>
      )}

      <main className="flex-1 relative overflow-y-auto md:pt-0 pt-14 scroll-smooth">
        {children}
      </main>

      <CommandMenu open={isCommandOpen} onOpenChange={setIsCommandOpen} />
    </div>
  );
}

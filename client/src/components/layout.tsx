import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Brain, Plus, Library, Search, Network, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { CommandMenu } from "./command-menu";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  if (!user) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  const navItems = [
    { href: "/library", icon: Library, label: "Библиотека" },
    { href: "/search", icon: Search, label: "Поиск" },
    { href: "/connections", icon: Network, label: "Связи" },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/20">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border/50 bg-card/30 backdrop-blur-xl relative z-20">
        <div className="p-6 pb-2">
          <Link href="/library" className="flex items-center gap-3 font-semibold text-xl text-foreground hover:opacity-80 transition-opacity">
            <div className="bg-primary/10 text-primary p-2 rounded-xl">
              <Brain className="w-6 h-6" />
            </div>
            Memory Hub
          </Link>
        </div>

        <div className="px-4 py-4">
          <Button asChild className="w-full shadow-md shadow-primary/20 hover:shadow-lg transition-all" size="lg">
            <Link href="/capture">
              <Plus className="w-5 h-5 mr-2" />
              Добавить
            </Link>
          </Button>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1">
          <button 
            onClick={() => setIsCommandOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors text-sm text-left mb-2 border border-transparent hover:border-border/50"
          >
            <Search className="w-5 h-5" />
            <span className="flex-1">Быстрый поиск</span>
            <kbd className="hidden lg:inline-flex items-center gap-1 rounded bg-muted px-1.5 text-[10px] font-medium opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>

          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50 mt-auto">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-3 truncate">
              <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-semibold text-sm shrink-0">
                {user.substring(0, 2).toUpperCase()}
              </div>
              <span className="text-sm font-medium truncate">{user}</span>
            </div>
            <button onClick={logout} className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-destructive/10" title="Выйти">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border/50 bg-background/80 backdrop-blur-md z-30 flex items-center justify-between px-4">
        <Link href="/library" className="flex items-center gap-2 font-semibold text-lg">
          <div className="bg-primary/10 text-primary p-1.5 rounded-lg">
            <Brain className="w-5 h-5" />
          </div>
          Memory Hub
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsCommandOpen(true)}>
            <Search className="w-5 h-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-background z-20 flex flex-col p-4 animate-in slide-in-from-top-4 duration-200">
          <Button asChild className="w-full mb-6" size="lg">
            <Link href="/capture">
              <Plus className="w-5 h-5 mr-2" />
              Добавить воспоминание
            </Link>
          </Button>
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`flex items-center gap-4 p-4 rounded-xl text-lg ${
                    isActive ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Button variant="outline" className="mt-auto w-full text-destructive" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto md:pt-0 pt-16 scroll-smooth">
        {children}
      </main>

      <CommandMenu open={isCommandOpen} onOpenChange={setIsCommandOpen} />
    </div>
  );
}

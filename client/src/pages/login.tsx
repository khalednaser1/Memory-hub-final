import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Brain, ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

export default function Login() {
  const { login, loginDemo } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    await new Promise(r => setTimeout(r, 300));

    if (!identifier.trim()) {
      setError("Введите имя пользователя или email");
      setIsLoading(false);
      return;
    }
    if (!password) {
      setError("Введите пароль");
      setIsLoading(false);
      return;
    }

    const err = login(identifier, password);
    if (err) setError(err);
    setIsLoading(false);
  };

  const handleDemoLogin = () => {
    loginDemo("Демо");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse-slow" />
      <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] -z-10 animate-pulse-slow" style={{ animationDelay: '2s' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-[420px]"
      >
        <div className="bg-card rounded-3xl shadow-2xl shadow-black/8 dark:shadow-black/30 border border-border/40 p-8 md:p-10">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-600 rounded-2xl blur-lg opacity-30" />
              <div className="relative bg-gradient-to-br from-primary to-purple-600 p-3.5 rounded-2xl text-white shadow-lg">
                <Brain className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight mb-1.5" data-testid="text-login-title">Вход в Memory Hub</h1>
            <p className="text-muted-foreground text-sm">Введите свои данные для входа</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -4 }} 
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center"
              data-testid="text-login-error"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="identifier" className="text-xs font-medium text-muted-foreground ml-0.5">
                Email или имя пользователя
              </Label>
              <Input
                id="identifier"
                type="text"
                placeholder="alex или alex@example.com"
                className="h-11 rounded-xl bg-muted/40 border-border/30 focus:bg-background focus:border-primary/50 transition-all text-sm px-4"
                value={identifier}
                onChange={e => { setIdentifier(e.target.value); setError(null); }}
                autoFocus
                autoComplete="username"
                data-testid="input-identifier"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-muted-foreground ml-0.5">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Введите пароль"
                  className="h-11 rounded-xl bg-muted/40 border-border/30 focus:bg-background focus:border-primary/50 transition-all text-sm px-4 pr-11"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null); }}
                  autoComplete="current-password"
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 inset-y-0 my-auto text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all mt-1"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? "Вход..." : <>Войти <ArrowRight className="ml-2 w-4 h-4" /></>}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/40" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="bg-card px-3 text-muted-foreground font-medium">или</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xl text-sm font-medium border-border/40 hover:bg-muted/50 gap-2"
            onClick={handleDemoLogin}
            data-testid="button-demo-login"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            Войти в демо-режиме
          </Button>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Нет аккаунта?{" "}
            <Link href="/register" className="text-primary hover:underline font-semibold" data-testid="link-register">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

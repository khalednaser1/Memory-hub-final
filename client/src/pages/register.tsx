import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Brain, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

export default function Register() {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Пароли не совпадают");
      return;
    }

    setIsLoading(true);
    await new Promise(r => setTimeout(r, 300));

    const err = register(username, email, password);
    if (err) setError(err);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-[2rem] shadow-2xl shadow-black/5 border border-border/60 p-8 md:p-12">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="bg-primary/10 p-4 rounded-2xl text-primary">
              <Brain className="w-10 h-10" />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight mb-2">Создать аккаунт</h1>
            <p className="text-muted-foreground text-sm">
              Начните вести свою личную базу знаний
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium ml-1">Имя пользователя</Label>
              <Input
                id="username"
                type="text"
                placeholder="alex"
                className="h-12 rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-primary transition-all text-base px-4"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(null); }}
                autoFocus
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium ml-1">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="alex@example.com"
                className="h-12 rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-primary transition-all text-base px-4"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null); }}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium ml-1">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Минимум 6 символов"
                  className="h-12 rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-primary transition-all text-base px-4 pr-12"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null); }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 inset-y-0 my-auto text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-sm font-medium ml-1">Повторите пароль</Label>
              <Input
                id="confirm"
                type={showPassword ? "text" : "password"}
                placeholder="Повторите пароль"
                className="h-12 rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-primary transition-all text-base px-4"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(null); }}
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base shadow-lg shadow-primary/20 hover:shadow-xl transition-all mt-2"
              disabled={isLoading}
            >
              {isLoading ? "Создание аккаунта..." : <>Зарегистрироваться <ArrowRight className="ml-2 w-4 h-4" /></>}
            </Button>
          </form>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Войти
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Brain, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

export default function Login() {
  const [username, setUsername] = useState("");
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      login(username.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-[2rem] shadow-2xl shadow-black/5 border border-border/60 p-8 md:p-12">
          <div className="flex justify-center mb-8">
            <div className="bg-primary/10 p-4 rounded-2xl text-primary">
              <Brain className="w-10 h-10" />
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight mb-2">Добро пожаловать</h1>
            <p className="text-muted-foreground text-sm">
              Введите любое имя для входа в демо-режим. Данные будут сохранены локально.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium ml-1">Имя пользователя</Label>
              <Input 
                id="username"
                type="text" 
                placeholder="Например: alex" 
                className="h-12 rounded-xl bg-muted/50 border-transparent focus:bg-background focus:border-primary transition-all text-base px-4"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl text-base shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
              disabled={!username.trim()}
            >
              Войти <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>

          <div className="mt-8 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Вернуться на главную
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

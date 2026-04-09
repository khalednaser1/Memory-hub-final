import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/contexts/theme-context";
import { useMemories } from "@/hooks/use-memories";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Trash2, AlertCircle, Sun, Moon, Monitor, Settings as SettingsIcon, User, Search, Database } from "lucide-react";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data: memories = [] } = useMemories();
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [defaultSearchMode, setDefaultSearchMode] = useState<"semantic" | "keyword">(
    (localStorage.getItem("defaultSearchMode") as "semantic" | "keyword") || "semantic"
  );

  const handleExport = () => {
    try {
      const data = { exportDate: new Date().toISOString(), version: "1.0", memories };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `memory-hub-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Экспорт завершён", description: `${memories.length} воспоминаний сохранено` });
    } catch {
      toast({ title: "Ошибка экспорта", variant: "destructive" });
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      try {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const data = JSON.parse(await file.text());
        if (data.memories && Array.isArray(data.memories)) {
          toast({ title: "Данные импортированы", description: "Перезагрузите страницу" });
          window.location.reload();
        } else throw new Error("Invalid format");
      } catch {
        toast({ title: "Ошибка импорта", description: "Неверный формат", variant: "destructive" });
      }
    };
    input.click();
  };

  const handleClearAll = () => {
    localStorage.clear();
    sessionStorage.clear();
    toast({ title: "Все данные удалены" });
    setTimeout(() => (window.location.href = "/login"), 800);
  };

  const handleSaveSearch = () => {
    localStorage.setItem("defaultSearchMode", defaultSearchMode);
    toast({ title: "Настройки поиска сохранены" });
  };

  const uniqueTagCount = new Set(memories.flatMap(m => m.tags)).size;

  return (
    <div className="max-w-3xl mx-auto p-5 md:p-10">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
        <motion.div variants={item}>
          <div className="flex items-center gap-2.5 mb-1">
            <SettingsIcon className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-settings-title">Настройки</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-[34px]">Управление аккаунтом, темой и данными</p>
        </motion.div>

        <motion.div variants={item}>
          <Card className="p-5 border-border/30 bg-card" data-testid="card-appearance">
            <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Sun className="w-4 h-4" />Оформление
            </h2>
            <div className="grid grid-cols-3 gap-2.5">
              {([
                { value: "light", icon: Sun,     label: "Светлая" },
                { value: "dark",  icon: Moon,    label: "Тёмная"  },
                { value: "system", icon: Monitor, label: "Авто"   },
              ] as const).map(({ value, icon: Icon, label }) => {
                const isActive = value === "system"
                  ? false
                  : theme === value;
                return (
                  <button
                    key={value}
                    onClick={() => { if (value !== "system") setTheme(value); }}
                    disabled={value === "system"}
                    className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                      isActive
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border/30 hover:border-border text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid={`button-theme-${value}`}
                  >
                    <div className={`p-2 rounded-lg ${isActive ? "bg-primary/10" : "bg-muted/50"}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold">{label}</span>
                    {isActive && (
                      <span className="text-[10px] text-primary font-semibold">Активна</span>
                    )}
                    {value === "system" && (
                      <span className="text-[10px] text-muted-foreground">Скоро</span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="p-5 border-border/30 bg-card" data-testid="card-profile">
            <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4" />Профиль
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-primary/20">
                  {(user?.username || "G").substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm" data-testid="text-username">{user?.username || "Гость"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || "Демо-аккаунт"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-xl p-3 text-center border border-border/20">
                  <p className="text-xl font-bold tabular-nums" data-testid="text-memory-count">{memories.length}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">воспоминаний</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3 text-center border border-border/20">
                  <p className="text-xl font-bold tabular-nums" data-testid="text-tag-count">{uniqueTagCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">уникальных тегов</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="p-5 border-border/30 bg-card" data-testid="card-search-settings">
            <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Search className="w-4 h-4" />Поиск
            </h2>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Режим поиска по умолчанию</p>
              <div className="flex gap-2">
                {(["semantic", "keyword"] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setDefaultSearchMode(m)}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all ${
                      defaultSearchMode === m
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "bg-muted/50 text-muted-foreground hover:text-foreground border border-border/30"
                    }`}
                    data-testid={`button-search-${m}`}
                  >
                    {m === "semantic" ? "По смыслу" : "По ключевым словам"}
                  </button>
                ))}
              </div>
              <Button onClick={handleSaveSearch} variant="outline" className="w-full rounded-xl h-9 text-xs border-border/30" data-testid="button-save-search">
                Сохранить
              </Button>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="p-5 border-border/30 bg-card" data-testid="card-data">
            <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Database className="w-4 h-4" />Данные
            </h2>
            <div className="space-y-2">
              <Button onClick={handleExport} variant="outline" className="w-full justify-start gap-2.5 rounded-xl h-10 text-xs border-border/30" data-testid="button-export">
                <Download className="w-4 h-4" />
                Экспортировать данные (JSON)
              </Button>
              <Button onClick={handleImport} variant="outline" className="w-full justify-start gap-2.5 rounded-xl h-10 text-xs border-border/30" data-testid="button-import">
                <Upload className="w-4 h-4" />
                Импортировать из JSON
              </Button>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="p-5 border-destructive/20 bg-destructive/3" data-testid="card-danger">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-destructive/10 shrink-0">
                <AlertCircle className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-destructive mb-0.5">Опасная зона</h2>
                <p className="text-xs text-muted-foreground mb-4">Эти действия необратимы</p>
                {!showDeleteConfirm ? (
                  <Button onClick={() => setShowDeleteConfirm(true)} variant="destructive" className="w-full rounded-xl h-9 text-xs" data-testid="button-clear-all">
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Очистить все данные
                  </Button>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-xs font-medium">Вы уверены? Удалятся все воспоминания, настройки и сессия.</p>
                    <div className="flex gap-2">
                      <Button onClick={() => setShowDeleteConfirm(false)} variant="outline" className="flex-1 rounded-xl h-9 text-xs" data-testid="button-cancel-clear">Отмена</Button>
                      <Button onClick={handleClearAll} variant="destructive" className="flex-1 rounded-xl h-9 text-xs" data-testid="button-confirm-clear">Удалить всё</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

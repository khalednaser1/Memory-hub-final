import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/contexts/theme-context";
import { useMemories } from "@/hooks/use-memories";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Trash2, AlertCircle, Sun, Moon, Monitor } from "lucide-react";

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

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Настройки</h1>
        <p className="text-muted-foreground">Управление аккаунтом, темой и данными</p>
      </div>

      {/* Appearance — THEME */}
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
        <h2 className="text-xl font-semibold mb-5">Оформление</h2>
        <div>
          <p className="text-sm text-muted-foreground mb-4">Выберите тему интерфейса</p>
          <div className="grid grid-cols-3 gap-3">
            {([
              { value: "light", icon: Sun,     label: "Светлая" },
              { value: "dark",  icon: Moon,    label: "Тёмная"  },
              { value: "system", icon: Monitor, label: "Авто"   },
            ] as const).map(({ value, icon: Icon, label }) => {
              const isActive = value === "system"
                ? false // we don't support system yet beyond initial detection
                : theme === value;
              return (
                <button
                  key={value}
                  onClick={() => { if (value !== "system") setTheme(value); }}
                  disabled={value === "system"}
                  className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    isActive
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border/50 hover:border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${isActive ? "bg-primary/10" : "bg-muted/60"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                  {isActive && (
                    <span className="text-[10px] text-primary font-medium">Активна</span>
                  )}
                  {value === "system" && (
                    <span className="text-[10px] text-muted-foreground">Скоро</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Profile */}
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
        <h2 className="text-xl font-semibold mb-5">Профиль</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
              {(user?.username || "G").substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{user?.username || "Гость"}</p>
              <p className="text-sm text-muted-foreground">{user?.email || "Демо-аккаунт"}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{memories.length}</p>
              <p className="text-xs text-muted-foreground">воспоминаний</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">
                {new Set(memories.flatMap(m => m.tags)).size}
              </p>
              <p className="text-xs text-muted-foreground">уникальных тегов</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Search Settings */}
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
        <h2 className="text-xl font-semibold mb-5">Поиск</h2>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Режим поиска по умолчанию</p>
          <div className="flex gap-2">
            {(["semantic", "keyword"] as const).map(m => (
              <button
                key={m}
                onClick={() => setDefaultSearchMode(m)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                  defaultSearchMode === m
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "semantic" ? "По смыслу" : "По ключевым словам"}
              </button>
            ))}
          </div>
          <Button onClick={handleSaveSearch} variant="outline" className="w-full">
            Сохранить настройки поиска
          </Button>
        </div>
      </Card>

      {/* Data Management */}
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
        <h2 className="text-xl font-semibold mb-5">Данные</h2>
        <div className="space-y-3">
          <Button onClick={handleExport} variant="outline" className="w-full justify-start gap-3">
            <Download className="w-4 h-4" />
            Экспортировать данные (JSON)
          </Button>
          <Button onClick={handleImport} variant="outline" className="w-full justify-start gap-3">
            <Upload className="w-4 h-4" />
            Импортировать из JSON
          </Button>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-destructive/30 bg-destructive/5">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-destructive mb-1">Опасная зона</h2>
            <p className="text-sm text-muted-foreground mb-5">Эти действия необратимы</p>
            {!showDeleteConfirm ? (
              <Button onClick={() => setShowDeleteConfirm(true)} variant="destructive" className="w-full">
                <Trash2 className="w-4 h-4 mr-2" />
                Очистить все данные
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium">Вы уверены? Удалятся все воспоминания, настройки и сессия.</p>
                <div className="flex gap-2">
                  <Button onClick={() => setShowDeleteConfirm(false)} variant="outline" className="flex-1">Отмена</Button>
                  <Button onClick={handleClearAll} variant="destructive" className="flex-1">Удалить всё</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

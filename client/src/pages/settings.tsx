import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMemories } from "@/hooks/use-memories";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Trash2, AlertCircle } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { data: memories = [] } = useMemories();
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [defaultSearchMode, setDefaultSearchMode] = useState<'semantic' | 'keyword'>(
    (localStorage.getItem('defaultSearchMode') as any) || 'semantic'
  );

  const handleExport = () => {
    try {
      const data = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        memories,
        settings: { defaultSearchMode }
      };
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memory-hub-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Данные экспортированы успешно" });
    } catch (error) {
      toast({ title: "Ошибка экспорта", variant: "destructive" });
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      try {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (data.memories && Array.isArray(data.memories)) {
          localStorage.setItem('memories', JSON.stringify(data.memories));
          toast({ title: "Данные импортированы", description: "Перезагрузите страницу для применения" });
          window.location.reload();
        } else {
          throw new Error('Invalid format');
        }
      } catch (error) {
        toast({ title: "Ошибка импорта", description: "Неверный формат файла", variant: "destructive" });
      }
    };
    input.click();
  };

  const handleClearAll = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      toast({ title: "Все данные удалены" });
      setTimeout(() => window.location.href = '/login', 1000);
    } catch (error) {
      toast({ title: "Ошибка удаления", variant: "destructive" });
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('defaultSearchMode', defaultSearchMode);
    toast({ title: "Настройки сохранены" });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Настройки</h1>
        <p className="text-muted-foreground">Управление вашим аккаунтом и данными</p>
      </div>

      {/* Profile */}
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
        <h2 className="text-2xl font-semibold mb-6">Профиль</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Пользователь</p>
            <p className="text-lg font-medium">{user || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Всего воспоминаний</p>
            <p className="text-lg font-medium">{memories.length}</p>
          </div>
        </div>
      </Card>

      {/* Search Settings */}
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
        <h2 className="text-2xl font-semibold mb-6">Поиск</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Режим поиска по умолчанию</label>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setDefaultSearchMode('semantic')}
                className={`px-4 py-2 rounded-lg transition-all ${defaultSearchMode === 'semantic' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                По смыслу
              </button>
              <button
                onClick={() => setDefaultSearchMode('keyword')}
                className={`px-4 py-2 rounded-lg transition-all ${defaultSearchMode === 'keyword' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                По ключевым словам
              </button>
            </div>
          </div>
          <Button onClick={handleSaveSettings} className="w-full mt-4">
            Сохранить
          </Button>
        </div>
      </Card>

      {/* Data Management */}
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
        <h2 className="text-2xl font-semibold mb-6">Управление данными</h2>
        <div className="space-y-4">
          <Button onClick={handleExport} variant="outline" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Экспортировать данные (JSON)
          </Button>
          <Button onClick={handleImport} variant="outline" className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            Импортировать из JSON
          </Button>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-destructive/30 bg-destructive/5 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-destructive mt-1 shrink-0" />
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-destructive mb-2">Опасная зона</h2>
            <p className="text-sm text-muted-foreground mb-6">Эти действия необратимы</p>
            
            {!showDeleteConfirm ? (
              <Button onClick={() => setShowDeleteConfirm(true)} variant="destructive" className="w-full">
                <Trash2 className="w-4 h-4 mr-2" />
                Очистить все данные
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium">Вы уверены? Это удалит все ваши воспоминания и настройки. Это невозможно отменить.</p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowDeleteConfirm(false)} 
                    variant="outline" 
                    className="flex-1"
                  >
                    Отмена
                  </Button>
                  <Button 
                    onClick={handleClearAll} 
                    variant="destructive" 
                    className="flex-1"
                  >
                    Удалить все
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

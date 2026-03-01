import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Calculator, Calendar, CreditCard, Settings, Smile, User, Brain, Search as SearchIcon, ArrowRight, Type, Hash } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useSearchMemories } from "@/hooks/use-memories";
import { Badge } from "./ui/badge";

export function CommandMenu({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  
  // Throttle search slightly in a real app, but for demo direct is fine
  const { data: searchData, isLoading } = useSearchMemories(query, 'semantic');

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Поиск по смыслу или ключевым словам..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>
          {isLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <Brain className="w-6 h-6 animate-pulse text-primary/50" />
              Ищем в глубинах памяти...
            </div>
          ) : query.length > 2 ? (
            "Ничего не найдено."
          ) : (
            "Введите хотя бы 3 символа для поиска."
          )}
        </CommandEmpty>
        
        {searchData?.results && searchData.results.length > 0 && (
          <CommandGroup heading="Результаты поиска">
            {searchData.results.map((result) => (
              <CommandItem
                key={result.id}
                onSelect={() => runCommand(() => setLocation(`/memory/${result.id}`))}
                className="flex flex-col items-start gap-1 py-3 px-4 cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="font-medium text-foreground flex items-center gap-2">
                    <SearchIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    {result.title}
                  </div>
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    Сходство {Math.round(result.relevanceScore * 100)}%
                  </Badge>
                </div>
                {result.summary && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                    {result.summary}
                  </p>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />
        <CommandGroup heading="Быстрые действия">
          <CommandItem onSelect={() => runCommand(() => setLocation("/capture"))}>
            <Type className="mr-2 h-4 w-4" />
            <span>Новая текстовая заметка</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setLocation("/library"))}>
            <Library className="mr-2 h-4 w-4" />
            <span>Перейти в Библиотеку</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

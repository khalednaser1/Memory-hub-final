import { useState, useEffect } from "react";
import { useLocation } from "wouter";

// Very simple demo authentication hook using localStorage
export function useAuth() {
  const [user, setUser] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem("memory_hub_demo_user");
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoaded(true);
  }, []);

  const login = (username: string) => {
    localStorage.setItem("memory_hub_demo_user", username);
    setUser(username);
    setLocation("/library");
  };

  const logout = () => {
    localStorage.removeItem("memory_hub_demo_user");
    setUser(null);
    setLocation("/");
  };

  return { user, isLoaded, login, logout };
}

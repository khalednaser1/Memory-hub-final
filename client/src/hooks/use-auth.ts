import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";

interface StoredUser {
  username: string;
  email: string;
  password: string;
  createdAt: string;
}

interface AuthUser {
  username: string;
  email: string;
}

const USERS_KEY = "memory_hub_users";
const SESSION_KEY = "memory_hub_session";

function getUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const session = getSession();
    setUser(session);
    setIsLoaded(true);

    // Backward-compat: migrate old simple string session
    const legacy = localStorage.getItem("memory_hub_demo_user");
    if (legacy && !session) {
      const migrated: AuthUser = { username: legacy, email: "" };
      localStorage.setItem(SESSION_KEY, JSON.stringify(migrated));
      setUser(migrated);
    }
  }, []);

  const register = useCallback((username: string, email: string, password: string): string | null => {
    const users = getUsers();

    // Validation
    if (!username.trim() || !email.trim() || !password) return "Заполните все поля";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return "Неверный формат email";
    if (password.length < 6) return "Пароль должен быть не менее 6 символов";
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase()))
      return "Пользователь с таким email уже существует";
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase()))
      return "Пользователь с таким именем уже существует";

    const newUser: StoredUser = {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users, newUser]);

    const session: AuthUser = { username: newUser.username, email: newUser.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    setLocation("/dashboard");
    return null;
  }, [setLocation]);

  const login = useCallback((emailOrUsername: string, password: string): string | null => {
    // Also allow old simple demo login (no password required if user doesn't exist)
    if (!emailOrUsername.trim()) return "Введите имя пользователя или email";

    const users = getUsers();

    // If no users exist yet, create a demo account automatically
    if (users.length === 0 && !password) {
      const session: AuthUser = { username: emailOrUsername.trim(), email: "" };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setUser(session);
      setLocation("/dashboard");
      return null;
    }

    const found = users.find(
      u =>
        u.email.toLowerCase() === emailOrUsername.toLowerCase() ||
        u.username.toLowerCase() === emailOrUsername.toLowerCase()
    );

    if (!found) return "Пользователь не найден";
    if (found.password !== password) return "Неверный пароль";

    const session: AuthUser = { username: found.username, email: found.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    setLocation("/dashboard");
    return null;
  }, [setLocation]);

  const loginDemo = useCallback((username: string) => {
    const session: AuthUser = { username: username.trim() || "Гость", email: "" };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    setLocation("/dashboard");
  }, [setLocation]);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("memory_hub_demo_user");
    setUser(null);
    setLocation("/login");
  }, [setLocation]);

  return { user, isLoaded, register, login, loginDemo, logout };
}

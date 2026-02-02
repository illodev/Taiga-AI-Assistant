"use client";

import * as React from "react";

// ============================================
// Tipos
// ============================================

interface TaigaUser {
  id: number;
  username: string;
  full_name: string;
  email: string;
  photo: string | null;
}

interface AuthContextType {
  user: TaigaUser | null;
  token: string | null;
  taigaUrl: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    username: string,
    password: string,
    taigaUrl: string,
  ) => Promise<void>;
  logout: () => void;
  error: string | null;
}

// ============================================
// Contexto
// ============================================

const AuthContext = React.createContext<AuthContextType | null>(null);

const TOKEN_KEY = "taiga_auth_token";
const USER_KEY = "taiga_user";
const TAIGA_URL_KEY = "taiga_url";

// ============================================
// Hook
// ============================================

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}

// ============================================
// Provider
// ============================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = React.useState<TaigaUser | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [taigaUrl, setTaigaUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Cargar sesión guardada al iniciar
  React.useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    const savedUrl = localStorage.getItem(TAIGA_URL_KEY);

    if (savedToken && savedUser && savedUrl) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setTaigaUrl(savedUrl);
      } catch {
        // Si hay error al parsear, limpiar
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TAIGA_URL_KEY);
      }
    }

    setIsLoading(false);
  }, []);

  // Login con credenciales
  const login = React.useCallback(
    async (username: string, password: string, url: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, taigaUrl: url }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error de autenticación");
        }

        setUser(data.user);
        setToken(data.token);
        setTaigaUrl(url);

        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        localStorage.setItem(TAIGA_URL_KEY, url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Logout
  const logout = React.useCallback(() => {
    setUser(null);
    setToken(null);
    setTaigaUrl(null);
    setError(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TAIGA_URL_KEY);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    taigaUrl,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

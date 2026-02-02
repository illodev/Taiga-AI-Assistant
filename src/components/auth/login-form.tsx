"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "./auth-provider";
import { Loader2, Key, AlertCircle, Globe } from "lucide-react";

const DEFAULT_TAIGA_URL = "";

export function LoginForm() {
  const { login, isLoading, error } = useAuth();
  const [taigaUrl, setTaigaUrl] = React.useState(DEFAULT_TAIGA_URL);
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [localError, setLocalError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Validar y normalizar URL
    let normalizedUrl = taigaUrl.trim();
    if (!normalizedUrl) {
      setLocalError("La URL de Taiga es requerida");
      return;
    }

    // Quitar / al final si existe
    normalizedUrl = normalizedUrl.replace(/\/+$/, "");

    // Añadir /api/v1 si no está presente
    if (!normalizedUrl.includes("/api/v1")) {
      normalizedUrl = `${normalizedUrl}/api/v1`;
    }

    try {
      await login(username, password, normalizedUrl);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Error de autenticación",
      );
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Key className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Taiga AI Assistant</CardTitle>
          <CardDescription>
            Conecta con tu instancia de Taiga para comenzar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="taigaUrl"
                className="text-sm font-medium flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                URL de Taiga
              </label>
              <Input
                id="taigaUrl"
                type="url"
                placeholder="https://tu-taiga.com o https://api.taiga.io"
                value={taigaUrl}
                onChange={(e) => setTaigaUrl(e.target.value)}
                disabled={isLoading}
                required
              />
              <p className="text-xs text-muted-foreground">
                URL de tu instancia de Taiga (se añade /api/v1 automáticamente)
              </p>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Usuario
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="tu-usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2 mt-4">
                <label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {displayError && (
              <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{displayError}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                "Conectar"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-center text-muted-foreground">
              Tus credenciales se usan para autenticarte con tu instancia de
              Taiga. El token se almacena localmente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

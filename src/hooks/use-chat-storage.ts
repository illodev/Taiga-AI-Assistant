"use client";

import { useState, useEffect, useCallback } from "react";

// ============================================
// Tipos para partes de mensajes (compatibles con use-chat)
// ============================================

export type StoredTextPart = {
  type: "text";
  text: string;
};

export type StoredReasoningPart = {
  type: "reasoning";
  text: string;
};

export type StoredToolCallPart = {
  type: `tool-${string}`;
  toolName: string;
  input: Record<string, unknown>;
  output?: unknown;
  state:
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error";
  errorText?: string;
};

export type StoredMessagePart =
  | StoredTextPart
  | StoredReasoningPart
  | StoredToolCallPart;

// ============================================
// Tipos
// ============================================

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  parts?: StoredMessagePart[];
  timestamp: Date;
  isLoading?: boolean;
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatStorageState {
  sessions: ChatSession[];
  activeSessionId: string | null;
}

const STORAGE_KEY = "taiga-ai-chat-sessions";

// ============================================
// Funciones de utilidad
// ============================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateTitle(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find((m) => m.role === "user");
  if (firstUserMessage) {
    const content = firstUserMessage.content;
    return content.length > 40 ? content.substring(0, 40) + "..." : content;
  }
  return "Nueva conversación";
}

function serializeState(state: ChatStorageState): string {
  return JSON.stringify({
    ...state,
    sessions: state.sessions.map((session) => ({
      ...session,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      messages: session.messages.map((msg) => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
      })),
    })),
  });
}

function deserializeState(json: string): ChatStorageState {
  const parsed = JSON.parse(json);
  return {
    ...parsed,
    sessions: parsed.sessions.map(
      (session: {
        id: string;
        title: string;
        createdAt: string;
        updatedAt: string;
        messages: Array<{
          id: string;
          role: "user" | "assistant";
          content: string;
          parts?: StoredMessagePart[];
          timestamp: string;
          isLoading?: boolean;
          isError?: boolean;
        }>;
      }) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((msg) => ({
          ...msg,
          parts: msg.parts || [{ type: "text" as const, text: msg.content }],
          timestamp: new Date(msg.timestamp),
        })),
      }),
    ),
  };
}

// ============================================
// Hook principal
// ============================================

export function useChatStorage() {
  const [state, setState] = useState<ChatStorageState>({
    sessions: [],
    activeSessionId: null,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar estado inicial desde localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const loadedState = deserializeState(stored);
        setState(loadedState);
      }
    } catch (error) {
      console.error("Error loading chat sessions:", error);
    }
    setIsLoaded(true);
  }, []);

  // Guardar estado en localStorage cuando cambie
  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEY, serializeState(state));
    } catch (error) {
      console.error("Error saving chat sessions:", error);
    }
  }, [state, isLoaded]);

  // Obtener sesión activa
  const activeSession = state.sessions.find(
    (s) => s.id === state.activeSessionId,
  );

  // Crear nueva sesión
  const createSession = useCallback((): ChatSession => {
    const newSession: ChatSession = {
      id: generateId(),
      title: "Nueva conversación",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setState((prev) => ({
      sessions: [newSession, ...prev.sessions],
      activeSessionId: newSession.id,
    }));

    return newSession;
  }, []);

  // Seleccionar sesión
  const selectSession = useCallback((sessionId: string) => {
    setState((prev) => ({
      ...prev,
      activeSessionId: sessionId,
    }));
  }, []);

  // Eliminar sesión
  const deleteSession = useCallback((sessionId: string) => {
    setState((prev) => {
      const newSessions = prev.sessions.filter((s) => s.id !== sessionId);
      let newActiveId = prev.activeSessionId;

      // Si eliminamos la sesión activa, seleccionar otra
      if (prev.activeSessionId === sessionId) {
        newActiveId = newSessions.length > 0 ? newSessions[0].id : null;
      }

      return {
        sessions: newSessions,
        activeSessionId: newActiveId,
      };
    });
  }, []);

  // Añadir mensaje a la sesión activa
  const addMessage = useCallback(
    (message: Omit<ChatMessage, "id" | "timestamp">) => {
      const newMessage: ChatMessage = {
        ...message,
        id: generateId(),
        timestamp: new Date(),
      };

      setState((prev) => {
        // Si no hay sesión activa, crear una nueva
        if (!prev.activeSessionId) {
          const newSession: ChatSession = {
            id: generateId(),
            title: "Nueva conversación",
            messages: [newMessage],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return {
            sessions: [newSession, ...prev.sessions],
            activeSessionId: newSession.id,
          };
        }

        // Añadir mensaje a la sesión activa
        return {
          ...prev,
          sessions: prev.sessions.map((session) => {
            if (session.id !== prev.activeSessionId) return session;

            const updatedMessages = [...session.messages, newMessage];
            return {
              ...session,
              messages: updatedMessages,
              title:
                session.messages.length === 0
                  ? generateTitle(updatedMessages)
                  : session.title,
              updatedAt: new Date(),
            };
          }),
        };
      });

      return newMessage;
    },
    [],
  );

  // Actualizar mensaje existente
  const updateMessage = useCallback(
    (messageId: string, updates: Partial<ChatMessage>) => {
      setState((prev) => ({
        ...prev,
        sessions: prev.sessions.map((session) => {
          if (session.id !== prev.activeSessionId) return session;

          return {
            ...session,
            messages: session.messages.map((msg) =>
              msg.id === messageId ? { ...msg, ...updates } : msg,
            ),
            updatedAt: new Date(),
          };
        }),
      }));
    },
    [],
  );

  // Limpiar mensajes de la sesión activa
  const clearActiveSession = useCallback(() => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) => {
        if (session.id !== prev.activeSessionId) return session;

        return {
          ...session,
          messages: [],
          title: "Nueva conversación",
          updatedAt: new Date(),
        };
      }),
    }));
  }, []);

  // Renombrar sesión
  const renameSession = useCallback((sessionId: string, newTitle: string) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) =>
        session.id === sessionId
          ? { ...session, title: newTitle, updatedAt: new Date() }
          : session,
      ),
    }));
  }, []);

  return {
    // Estado
    sessions: state.sessions,
    activeSession,
    activeSessionId: state.activeSessionId,
    isLoaded,

    // Acciones
    createSession,
    selectSession,
    deleteSession,
    addMessage,
    updateMessage,
    clearActiveSession,
    renameSession,
  };
}

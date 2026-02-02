"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatStatus } from "ai";

// ============================================
// Tipos para partes de mensajes
// ============================================

export type TextPart = {
  type: "text";
  text: string;
};

export type ReasoningPart = {
  type: "reasoning";
  text: string;
};

export type ToolCallPart = {
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

export type MessagePart = TextPart | ReasoningPart | ToolCallPart;

// ============================================
// Tipos para mensajes
// ============================================

export interface UIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  parts: MessagePart[];
  createdAt: Date;
}

// ============================================
// Opciones del hook
// ============================================

export interface UseChatOptions {
  api?: string;
  id?: string;
  initialMessages?: UIMessage[];
  body?: Record<string, unknown>;
  onFinish?: (message: UIMessage) => void;
  onError?: (error: Error) => void;
  onToolCall?: (toolCall: ToolCallPart) => void;
}

// ============================================
// Estado y retorno del hook
// ============================================

export interface UseChatReturn {
  messages: UIMessage[];
  setMessages: React.Dispatch<React.SetStateAction<UIMessage[]>>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  handleInputChange: (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => void;
  handleSubmit: (e?: React.FormEvent) => void;
  sendMessage: (options: { text: string }) => void;
  status: ChatStatus;
  isLoading: boolean;
  error: Error | null;
  stop: () => void;
  reload: () => void;
  append: (message: Omit<UIMessage, "id" | "createdAt" | "parts">) => void;
}

// ============================================
// Generador de IDs
// ============================================

const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// ============================================
// Hook useChat
// ============================================

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const {
    api = "/api/chat",
    initialMessages = [],
    body = {},
    onFinish,
    onError,
    onToolCall,
  } = options;

  const [messages, setMessages] = useState<UIMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // ============================================
  // Crear mensaje de usuario
  // ============================================

  const createUserMessage = useCallback(
    (content: string): UIMessage => ({
      id: generateId(),
      role: "user",
      content,
      parts: [{ type: "text", text: content }],
      createdAt: new Date(),
    }),
    [],
  );

  // ============================================
  // Crear mensaje de asistente vacío
  // ============================================

  const createAssistantMessage = useCallback((): UIMessage => {
    return {
      id: generateId(),
      role: "assistant",
      content: "",
      parts: [],
      createdAt: new Date(),
    };
  }, []);

  // ============================================
  // Parsear evento SSE
  // ============================================

  const parseSSEEvent = useCallback(
    (
      line: string,
      currentMessage: UIMessage,
      activeToolCalls: Map<string, ToolCallPart>,
    ): UIMessage => {
      if (!line.startsWith("data: ")) return currentMessage;

      try {
        const data = JSON.parse(line.slice(6));

        // Error en el stream
        if (data.error) {
          throw new Error(data.error);
        }

        // Reasoning - procesar antes de texto para evitar conflictos
        if (data.type === "reasoning") {
          const reasoningText = data.text || data.content || "";
          if (!reasoningText) return currentMessage;

          const lastPart =
            currentMessage.parts[currentMessage.parts.length - 1];
          let newParts: MessagePart[];

          if (lastPart?.type === "reasoning") {
            newParts = [
              ...currentMessage.parts.slice(0, -1),
              { type: "reasoning", text: lastPart.text + reasoningText },
            ];
          } else {
            newParts = [
              ...currentMessage.parts,
              { type: "reasoning", text: reasoningText },
            ];
          }

          return { ...currentMessage, parts: newParts };
        }

        // Contenido de texto
        if (data.type === "text") {
          const textContent = data.content || "";
          if (!textContent) return currentMessage;

          const newContent = currentMessage.content + textContent;

          // Buscar o crear parte de texto
          const lastPart =
            currentMessage.parts[currentMessage.parts.length - 1];
          let newParts: MessagePart[];

          if (lastPart?.type === "text") {
            newParts = [
              ...currentMessage.parts.slice(0, -1),
              { type: "text", text: lastPart.text + textContent },
            ];
          } else {
            newParts = [
              ...currentMessage.parts,
              { type: "text", text: textContent },
            ];
          }

          return { ...currentMessage, content: newContent, parts: newParts };
        }

        // Inicio de tool call
        if (
          data.type === "tool_call_start" ||
          data.type === "tool-call-start"
        ) {
          const toolId = data.toolCallId || data.id || generateId();
          const toolName = data.toolName || data.name || "unknown";

          const toolPart: ToolCallPart = {
            type: `tool-${toolName}` as const,
            toolName,
            input: data.input || {},
            state: "input-available",
          };

          activeToolCalls.set(toolId, toolPart);

          onToolCall?.(toolPart);

          return {
            ...currentMessage,
            parts: [...currentMessage.parts, toolPart],
          };
        }

        // Resultado de tool
        if (
          data.type === "tool_call_result" ||
          data.type === "tool-call-result" ||
          data.type === "tool_result"
        ) {
          const toolId = data.toolCallId || data.id;
          const existingTool = activeToolCalls.get(toolId);

          if (existingTool) {
            const hasError = data.error || data.isError;
            const updatedTool: ToolCallPart = {
              ...existingTool,
              output: data.result || data.output,
              state: hasError ? "output-error" : "output-available",
              errorText: hasError ? data.error || data.errorText : undefined,
            };
            activeToolCalls.set(toolId, updatedTool);

            const newParts = currentMessage.parts.map((part) =>
              part.type === existingTool.type ? updatedTool : part,
            );

            return { ...currentMessage, parts: newParts };
          }
        }

        // Mensaje completado
        if (data.done) {
          return currentMessage;
        }

        return currentMessage;
      } catch (parseError) {
        // Ignorar errores de parseo de líneas incompletas
        if (parseError instanceof SyntaxError) {
          return currentMessage;
        }
        throw parseError;
      }
    },
    [onToolCall],
  );

  // ============================================
  // Enviar mensaje
  // ============================================

  const sendMessage = useCallback(
    async ({ text }: { text: string }) => {
      if (!text.trim() || status === "streaming") return;

      setError(null);
      setStatus("submitted");

      const userMessage = createUserMessage(text);
      const assistantMessage = createAssistantMessage();

      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      // Crear AbortController
      abortControllerRef.current = new AbortController();

      try {
        // Preparar historial para la API
        const messageHistory = [
          ...messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          { role: "user" as const, content: text },
        ];

        const response = await fetch(api, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: messageHistory,
            ...body,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Error al procesar el mensaje");
        }

        setStatus("streaming");

        // Procesar stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let currentMessage = assistantMessage;
        const activeToolCalls = new Map<string, ToolCallPart>();

        if (!reader) {
          throw new Error("No se pudo obtener el stream de respuesta");
        }

        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");

          // Mantener la última línea incompleta en el buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.trim()) {
              currentMessage = parseSSEEvent(
                line,
                currentMessage,
                activeToolCalls,
              );

              // Actualizar mensaje en tiempo real
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessage.id ? currentMessage : m,
                ),
              );
            }
          }
        }

        // Procesar cualquier dato restante en el buffer
        if (buffer.trim()) {
          currentMessage = parseSSEEvent(
            buffer,
            currentMessage,
            activeToolCalls,
          );
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id ? currentMessage : m,
            ),
          );
        }

        setStatus("ready");
        onFinish?.(currentMessage);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setStatus("ready");
          return;
        }

        const error =
          err instanceof Error ? err : new Error("Error desconocido");
        setError(error);
        setStatus("error");
        onError?.(error);

        // Actualizar mensaje con error
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? {
                  ...m,
                  content: error.message,
                  parts: [{ type: "text", text: error.message }],
                }
              : m,
          ),
        );
      }
    },
    [
      api,
      body,
      createAssistantMessage,
      createUserMessage,
      messages,
      onError,
      onFinish,
      parseSSEEvent,
      status,
    ],
  );

  // ============================================
  // Handlers
  // ============================================

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      setInput(e.target.value);
    },
    [],
  );

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (input.trim()) {
        sendMessage({ text: input });
        setInput("");
      }
    },
    [input, sendMessage],
  );

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus("ready");
  }, []);

  const reload = useCallback(() => {
    if (messages.length < 2) return;

    // Obtener el último mensaje del usuario
    const lastUserMessageIndex = messages.findLastIndex(
      (m) => m.role === "user",
    );
    if (lastUserMessageIndex === -1) return;

    const lastUserMessage = messages[lastUserMessageIndex];

    // Eliminar mensajes desde el último del usuario
    setMessages((prev) => prev.slice(0, lastUserMessageIndex));

    // Reenviar
    sendMessage({ text: lastUserMessage.content });
  }, [messages, sendMessage]);

  const append = useCallback(
    (message: Omit<UIMessage, "id" | "createdAt" | "parts">) => {
      const newMessage: UIMessage = {
        ...message,
        id: generateId(),
        createdAt: new Date(),
        parts: [{ type: "text", text: message.content }],
      };
      setMessages((prev) => [...prev, newMessage]);
    },
    [],
  );

  return {
    messages,
    setMessages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    sendMessage,
    status,
    isLoading: status === "streaming" || status === "submitted",
    error,
    stop,
    reload,
    append,
  };
}

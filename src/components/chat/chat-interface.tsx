"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { LoginForm } from "@/components/auth/login-form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStorage, type ChatSession } from "@/hooks/use-chat-storage";
import { useChat, type UIMessage, type ToolCallPart } from "@/hooks/use-chat";
import { Input } from "@/components/ui/input";
import {
  Bot,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Sparkles,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  RefreshCwIcon,
  CopyIcon,
  StopCircleIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  EditIcon,
  ChevronsUpDown,
  Bell,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// AI Elements
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import {
  ModelSelector,
  ModelSelectorTrigger,
  ModelSelectorContent,
  ModelSelectorInput,
  ModelSelectorList,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorItem,
  ModelSelectorLogo,
  ModelSelectorName,
  DEFAULT_MODELS,
  DEFAULT_MODEL,
  getModelsByProvider,
  type Model,
  ModelSelectorSeparator,
} from "@/components/ai-elements/model-selector";
import { Spinner } from "@/components/ui/spinner";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "../ai-elements/reasoning";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Image from "next/image";

// ============================================
// Ejemplos de prompts
// ============================================

const EXAMPLE_PROMPTS = [
  "¿Cuáles son mis proyectos?",
  "Muéstrame el estado del sprint actual",
  "Busca historias relacionadas con 'login'",
  "Crea una historia de usuario para...",
  "¿Cuántas tareas quedan pendientes?",
  "Dame un resumen del proyecto",
  "Dame estadísticas de mis tareas asignadas",
  "¿Qué tareas vencen esta semana?",
];

// ============================================
// Componente de item de sesión
// ============================================

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
}

function SessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: SessionItemProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(session.title);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSubmitRename = () => {
    if (editTitle.trim()) {
      onRename(editTitle.trim());
    } else {
      setEditTitle(session.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmitRename();
    } else if (e.key === "Escape") {
      setEditTitle(session.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`
        group flex items-center gap-2 p-2 px-4 rounded-md w-full cursor-pointer transition-colors
        ${isActive ? "bg-primary/5 text-primary" : "hover:bg-muted"}
      `}
      onClick={() => !isEditing && onSelect()}
    >
      <MessageSquare className="h-4 w-4 flex-none" />
      {isEditing ? (
        <div className="flex-1 flex items-center gap-1">
          <Input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSubmitRename}
            onKeyDown={handleKeyDown}
            className="h-6 text-sm py-0"
            onClick={(e) => e.stopPropagation()}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              handleSubmitRename();
            }}
          >
            <Check className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex-1 text-sm truncate grow">{session.title}</div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mr-2 opacity-0 flex-none group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                <Pencil />
                Renombrar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}

// ============================================
// Componente de mensaje del chat
// ============================================

interface ChatMessageItemProps {
  message: UIMessage;
  isLastAssistantMessage: boolean;
  isStreaming: boolean;
  onReload?: () => void;
  onStop?: () => void;
  onCopy?: (content: string) => void;
}

function ChatMessageItem({
  message,
  isLastAssistantMessage,
  isStreaming,
  onReload,
  onStop,
  onCopy,
}: ChatMessageItemProps) {
  const isAssistant = message.role === "assistant";

  return (
    <Message from={message.role}>
      <MessageContent className="group-[.is-assistant]:w-full space-y-6">
        {message.parts.map((part, i) => {
          switch (part.type) {
            case "text":
              return part.text ? (
                <MessageResponse key={`${message.id}-${i}`}>
                  {part.text}
                </MessageResponse>
              ) : null;

            case "reasoning":
              return (
                <Reasoning
                  key={`${message.id}-${i}`}
                  className="w-full"
                  isStreaming={isStreaming}
                >
                  <ReasoningTrigger />
                  <ReasoningContent>{part.text}</ReasoningContent>
                </Reasoning>
              );

            default:
              // Tool call
              if (part.type.startsWith("tool-")) {
                const toolPart = part as ToolCallPart;

                return (
                  <Tool key={`${message.id}-${i}`}>
                    <ToolHeader
                      type={toolPart.type as `tool-${string}`}
                      state={toolPart.state}
                      title={formatToolName(toolPart.toolName)}
                    />
                    <ToolContent>
                      <ToolInput input={toolPart.input} />
                      {(toolPart.output || toolPart.errorText) && (
                        <ToolOutput
                          output={toolPart.output}
                          errorText={toolPart.errorText}
                        />
                      )}
                    </ToolContent>
                  </Tool>
                );
              }
              return null;
          }
        })}

        {/* Spinner mientras está en streaming sin contenido */}
        {/* {isAssistant &&
          isStreaming &&
          message.parts.length === 0 &&
          !message.content && <Spinner className="h-5 w-5" />} */}
      </MessageContent>

      {/* Acciones del mensaje */}
      {isAssistant && isLastAssistantMessage && message.content && (
        <MessageActions className="mt-2">
          {isStreaming ? null : (
            <>
              <MessageAction
                onClick={onReload}
                tooltip="Regenerar"
                label="Regenerar respuesta"
              >
                <RefreshCwIcon className="size-3" />
              </MessageAction>
              <MessageAction
                onClick={() => onCopy?.(message.content)}
                tooltip="Copiar"
                label="Copiar respuesta"
              >
                <CopyIcon className="size-3" />
              </MessageAction>
            </>
          )}
        </MessageActions>
      )}
    </Message>
  );
}

// ============================================
// Utilidades
// ============================================

function formatToolName(toolName: string): string {
  return toolName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

// ============================================
// Componente principal
// ============================================

export function ChatInterface() {
  const {
    isAuthenticated,
    isLoading: authLoading,
    token,
    taigaUrl,
    user,
    logout,
  } = useAuth();

  const {
    sessions,
    activeSession,
    activeSessionId,
    isLoaded,
    createSession,
    selectSession,
    deleteSession,
    addMessage: addStoredMessage,
    updateMessage: updateStoredMessage,
    renameSession,
  } = useChatStorage();

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [selectedModel, setSelectedModel] =
    React.useState<Model>(DEFAULT_MODEL);
  const [modelSelectorOpen, setModelSelectorOpen] = React.useState(false);

  // Modelos agrupados por proveedor
  const modelGroups = React.useMemo(() => getModelsByProvider(), []);

  // Agrupar sesiones por fecha
  const groupedSessions = React.useMemo(() => {
    const groups: { label: string; sessions: ChatSession[] }[] = [];
    const today: ChatSession[] = [];
    const yesterday: ChatSession[] = [];
    const week: ChatSession[] = [];
    const older: ChatSession[] = [];

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);
    const weekStart = new Date(todayStart.getTime() - 7 * 86400000);

    sessions.forEach((session) => {
      const date = new Date(session.updatedAt);
      if (date >= todayStart) {
        today.push(session);
      } else if (date >= yesterdayStart) {
        yesterday.push(session);
      } else if (date >= weekStart) {
        week.push(session);
      } else {
        older.push(session);
      }
    });

    if (today.length > 0) groups.push({ label: "Hoy", sessions: today });
    if (yesterday.length > 0)
      groups.push({ label: "Ayer", sessions: yesterday });
    if (week.length > 0) groups.push({ label: "Esta semana", sessions: week });
    if (older.length > 0) groups.push({ label: "Anteriores", sessions: older });

    return groups;
  }, [sessions]);

  // Ref para rastrear el último input del usuario (para guardar después)
  const lastUserInputRef = React.useRef<string>("");
  // Ref para evitar re-sincronización - guarda el sessionId que ya fue sincronizado
  const syncedSessionIdRef = React.useRef<string | null>(null);

  // Hook de chat personalizado
  const {
    messages,
    setMessages,
    sendMessage,
    status,
    isLoading,
    stop,
    reload,
  } = useChat({
    api: "/api/chat",
    body: {
      taigaToken: token,
      taigaUrl: taigaUrl,
      sessionId: activeSessionId,
      user,
      model: selectedModel.id,
    },
    onFinish: (assistantMessage) => {
      // Persistir mensajes cuando termina el streaming
      // Guardar el mensaje del usuario
      if (lastUserInputRef.current) {
        addStoredMessage({
          role: "user",
          content: lastUserInputRef.current,
          parts: [{ type: "text", text: lastUserInputRef.current }],
        });
        lastUserInputRef.current = "";
      }
      // Guardar el mensaje del asistente con todas las partes (reasoning, tools, text)
      if (assistantMessage.content || assistantMessage.parts.length > 0) {
        addStoredMessage({
          role: "assistant",
          content: assistantMessage.content,
          parts: assistantMessage.parts,
        });
      }
    },
  });

  // Sincronizar mensajes SOLO cuando el usuario cambia de sesión activa
  // No sincronizar cuando se actualiza la misma sesión (ej: al guardar mensajes)
  React.useEffect(() => {
    // Si ya sincronizamos esta sesión, no volver a hacerlo
    if (syncedSessionIdRef.current === activeSessionId) {
      return;
    }

    // Marcar esta sesión como sincronizada
    syncedSessionIdRef.current = activeSessionId;

    if (activeSession) {
      // Convertir mensajes de storage a formato del hook (incluyendo partes)
      const convertedMessages: UIMessage[] = activeSession.messages.map(
        (m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          parts: m.parts || [{ type: "text" as const, text: m.content }],
          createdAt: m.timestamp,
        }),
      );
      setMessages(convertedMessages);
    } else {
      setMessages([]);
    }
    // Solo depende de activeSessionId para evitar re-sincronización cuando activeSession cambia su contenido
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId]);

  // Mostrar loading mientras se carga
  if (authLoading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Bot className="h-12 w-12 text-primary animate-pulse" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Mostrar login si no está autenticado
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Handlers
  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    // Guardar el input para persistirlo después en onFinish
    lastUserInputRef.current = text.trim();
    sendMessage({ text });
    setInputValue("");
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    handleSendMessage(inputValue);
  };

  const handleNewChat = () => {
    createSession();
    setSidebarOpen(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  // Determinar último mensaje del asistente
  const lastAssistantMessageIndex = messages.findLastIndex(
    (m) => m.role === "assistant",
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-sidebar transform transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header del sidebar */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 mx-auto">
                <span className="font-semibold">Taiga AI</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Botón nueva conversación */}
          <div className="p-4">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleNewChat}
            >
              <EditIcon />
              Nueva conversación
            </Button>
          </div>

          {/* Lista de sesiones */}
          <div className="flex-1 px-4 w-full overflow-auto style-scrollbar">
            {groupedSessions.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No hay conversaciones
                </p>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {groupedSessions.map((group) => (
                  <div key={group.label}>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase">
                      {group.label}
                    </p>
                    <div className="space-y-1">
                      {group.sessions.map((session) => (
                        <SessionItem
                          key={session.id}
                          session={session}
                          isActive={session.id === activeSessionId}
                          onSelect={() => {
                            selectSession(session.id);
                            setSidebarOpen(false);
                          }}
                          onDelete={() => deleteSession(session.id)}
                          onRename={(newTitle) =>
                            renameSession(session.id, newTitle)
                          }
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Usuario */}
          {user && (
            <div className="p-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="lg" variant="ghost" className="h-14 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.photo ?? undefined}
                        alt={
                          user.full_name?.charAt(0) || user.username.charAt(0)
                        }
                      />
                      <AvatarFallback className="rounded-lg">
                        {user.full_name?.charAt(0) || user.username.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {user.full_name || user.username}
                      </span>
                      <span className="truncate text-xs">{user.email}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
                  side="top"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center gap-2 text-left text-sm">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user.photo ?? undefined}
                          alt={
                            user.full_name?.charAt(0) || user.username.charAt(0)
                          }
                        />
                        <AvatarFallback className="rounded-lg">
                          {user.full_name?.charAt(0) || user.username.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">
                          {user.full_name || user.username}
                        </span>
                        <span className="truncate text-xs">{user.email}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </aside>

      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header móvil */}
        <header className="flex items-center justify-between p-4 border-b lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Taiga AI</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleNewChat}>
            <Plus className="h-5 w-5" />
          </Button>
        </header>

        {/* Área de mensajes con componentes de AI Elements */}
        <Conversation className="flex-1">
          <ConversationContent className="max-w-3xl mx-auto w-full py-16">
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<Sparkles className="size-12" />}
                title="¡Hola! Soy tu asistente de Taiga"
                description="Puedo ayudarte a gestionar tus proyectos, historias de usuario, tareas y sprints usando lenguaje natural."
              >
                <div className="mt-6 space-y-4 w-full">
                  <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
                    {EXAMPLE_PROMPTS.map((prompt, index) => (
                      <Suggestion
                        key={index}
                        suggestion={prompt}
                        onClick={handleSuggestionClick}
                      />
                    ))}
                  </div>
                </div>
              </ConversationEmptyState>
            ) : (
              <>
                {messages.map((message, index) => (
                  <ChatMessageItem
                    key={message.id}
                    message={message}
                    isLastAssistantMessage={index === lastAssistantMessageIndex}
                    isStreaming={
                      isLoading && index === lastAssistantMessageIndex
                    }
                    onReload={reload}
                    onStop={stop}
                    onCopy={handleCopy}
                  />
                ))}

                {/* Indicador de carga cuando se envía pero aún no hay respuesta */}
                {status === "submitted" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Spinner className="h-4 w-4" />
                    <span className="text-sm">
                      Cargando recursos y artefactos de Taiga...
                    </span>
                  </div>
                )}
              </>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {/* Input con componentes de AI Elements */}
        <div className="p-4">
          <PromptInput
            onSubmit={(msg) => handleSendMessage(msg.text || "")}
            className="max-w-4xl mx-auto"
          >
            <PromptInputTextarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Pregúntame sobre tus proyectos en Taiga..."
              className="min-h-13"
            />
            <PromptInputFooter>
              {/* Model Selector */}
              <ModelSelector
                open={modelSelectorOpen}
                onOpenChange={setModelSelectorOpen}
              >
                <ModelSelectorTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <ModelSelectorLogo provider={selectedModel.provider} />
                    <span className="inline">{selectedModel.name}</span>
                    <span className="text-xs opacity-60">
                      {selectedModel.costMultiplier}x
                    </span>
                    <ChevronsUpDown className="h-3 w-3 opacity-50" />
                  </Button>
                </ModelSelectorTrigger>
                <ModelSelectorContent>
                  <ModelSelectorInput placeholder="Buscar modelo..." />
                  <ModelSelectorList className="style-scrollbar">
                    <ModelSelectorEmpty>
                      No se encontraron modelos.
                    </ModelSelectorEmpty>
                    {modelGroups.map((group) => (
                      <ModelSelectorGroup
                        key={group.provider}
                        heading={
                          <div className="flex items-center gap-2">
                            <ModelSelectorLogo provider={group.provider} />
                            <span className="capitalize">{group.provider}</span>
                          </div>
                        }
                      >
                        {group.models.map((model) => (
                          <ModelSelectorItem
                            key={model.id}
                            onSelect={() => {
                              setSelectedModel(model);
                              setModelSelectorOpen(false);
                            }}
                            disabled={model.disabled}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <Check
                                className={`h-4 w-4 ${
                                  selectedModel.id === model.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              <ModelSelectorName>
                                {model.name}
                              </ModelSelectorName>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {model.costMultiplier}x
                            </span>
                          </ModelSelectorItem>
                        ))}
                      </ModelSelectorGroup>
                    ))}
                  </ModelSelectorList>
                  <ModelSelectorSeparator />
                  <ModelSelectorItem disabled>
                    <div className="p-2 text-xs text-muted-foreground">
                      Modelos de pago deshabilitados por seguridad.
                    </div>
                  </ModelSelectorItem>
                </ModelSelectorContent>
              </ModelSelector>

              <div className="flex-1" />
              <PromptInputSubmit
                status={status === "streaming" ? "streaming" : "ready"}
                disabled={!inputValue.trim() && status !== "streaming"}
              />
            </PromptInputFooter>
          </PromptInput>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Taiga AI puede cometer errores. Verifica la información importante.
          </p>
        </div>
      </main>
    </div>
  );
}

"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Bot, User, AlertCircle, Loader2 } from "lucide-react";
import Markdown from "./markdown";

// ============================================
// Tipos
// ============================================

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isError?: boolean;
  isLoading?: boolean;
}

interface ChatMessageProps {
  message: Message;
}

// ============================================
// Componente
// ============================================

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn("flex gap-3 p-4", isUser ? "bg-muted/50" : "bg-background")}
    >
      <Avatar className={cn("h-8 w-8 shrink-0", isUser && "order-2")}>
        <AvatarFallback
          className={cn(
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground",
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn("flex-1 space-y-2 overflow-hidden", isUser && "order-1")}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {isUser ? "Tú" : "Asistente"}
          </span>
          <span className="text-sm text-muted-foreground">
            {message.timestamp.toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {message.isError ? (
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{message.content}</span>
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {message.content ? (
              <>
                <Markdown>{message.content}</Markdown>
                {message.isLoading && (
                  <span className="inline-flex items-center gap-1 text-muted-foreground ml-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                  </span>
                )}
              </>
            ) : message.isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Pensando...</span>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

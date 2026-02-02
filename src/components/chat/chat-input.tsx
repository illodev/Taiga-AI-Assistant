"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Send, Loader2 } from "lucide-react";

// ============================================
// Tipos
// ============================================

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

// ============================================
// Componente
// ============================================

export function ChatInput({
  onSend,
  disabled = false,
  isLoading = false,
  placeholder = "Escribe tu mensaje...",
}: ChatInputProps) {
  const [input, setInput] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-resize del textarea
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || disabled || isLoading) return;

    onSend(trimmedInput);
    setInput("");

    // Reset altura del textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enviar con Enter (sin Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-end gap-2 p-4 border-t bg-background">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={1}
            className={cn(
              "w-full resize-none rounded-lg border border-input bg-transparent px-4 py-3 pr-12",
              "text-sm placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "min-h-[48px] max-h-[200px]",
            )}
          />
        </div>

        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || disabled || isLoading}
          className="h-12 w-12 shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
          <span className="sr-only">Enviar mensaje</span>
        </Button>
      </div>

      <div className="px-4 pb-2 text-xs text-muted-foreground text-center">
        <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Enter</kbd>{" "}
        para enviar •{" "}
        <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">
          Shift + Enter
        </kbd>{" "}
        para nueva línea
      </div>
    </form>
  );
}

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

export type ModelSelectorProps = ComponentProps<typeof Dialog>;

export const ModelSelector = (props: ModelSelectorProps) => (
  <Dialog {...props} />
);

export type ModelSelectorTriggerProps = ComponentProps<typeof DialogTrigger>;

export const ModelSelectorTrigger = (props: ModelSelectorTriggerProps) => (
  <DialogTrigger {...props} />
);

export type ModelSelectorContentProps = ComponentProps<typeof DialogContent> & {
  title?: ReactNode;
};

export const ModelSelectorContent = ({
  className,
  children,
  title = "Model Selector",
  ...props
}: ModelSelectorContentProps) => (
  <DialogContent
    className={cn(
      "outline! border-none! p-0 outline-border! outline-solid!",
      className,
    )}
    {...props}
  >
    <DialogTitle className="sr-only">{title}</DialogTitle>
    <Command className="**:data-[slot=command-input-wrapper]:h-auto">
      {children}
    </Command>
  </DialogContent>
);

export type ModelSelectorDialogProps = ComponentProps<typeof CommandDialog>;

export const ModelSelectorDialog = (props: ModelSelectorDialogProps) => (
  <CommandDialog {...props} />
);

export type ModelSelectorInputProps = ComponentProps<typeof CommandInput>;

export const ModelSelectorInput = ({
  className,
  ...props
}: ModelSelectorInputProps) => (
  <CommandInput className={cn("h-auto py-3.5", className)} {...props} />
);

export type ModelSelectorListProps = ComponentProps<typeof CommandList>;

export const ModelSelectorList = (props: ModelSelectorListProps) => (
  <CommandList {...props} />
);

export type ModelSelectorEmptyProps = ComponentProps<typeof CommandEmpty>;

export const ModelSelectorEmpty = (props: ModelSelectorEmptyProps) => (
  <CommandEmpty {...props} />
);

export type ModelSelectorGroupProps = ComponentProps<typeof CommandGroup>;

export const ModelSelectorGroup = (props: ModelSelectorGroupProps) => (
  <CommandGroup {...props} />
);

export type ModelSelectorItemProps = ComponentProps<typeof CommandItem>;

export const ModelSelectorItem = (props: ModelSelectorItemProps) => (
  <CommandItem {...props} />
);

export type ModelSelectorShortcutProps = ComponentProps<typeof CommandShortcut>;

export const ModelSelectorShortcut = (props: ModelSelectorShortcutProps) => (
  <CommandShortcut {...props} />
);

export type ModelSelectorSeparatorProps = ComponentProps<
  typeof CommandSeparator
>;

export const ModelSelectorSeparator = (props: ModelSelectorSeparatorProps) => (
  <CommandSeparator {...props} />
);

export type ModelSelectorLogoProps = Omit<
  ComponentProps<"img">,
  "src" | "alt"
> & {
  provider:
    | "moonshotai-cn"
    | "lucidquery"
    | "moonshotai"
    | "zai-coding-plan"
    | "alibaba"
    | "xai"
    | "vultr"
    | "nvidia"
    | "upstage"
    | "groq"
    | "github-copilot"
    | "mistral"
    | "vercel"
    | "nebius"
    | "deepseek"
    | "alibaba-cn"
    | "google-vertex-anthropic"
    | "venice"
    | "chutes"
    | "cortecs"
    | "github-models"
    | "togetherai"
    | "azure"
    | "baseten"
    | "huggingface"
    | "opencode"
    | "fastrouter"
    | "google"
    | "google-vertex"
    | "cloudflare-workers-ai"
    | "inception"
    | "wandb"
    | "openai"
    | "zhipuai-coding-plan"
    | "perplexity"
    | "openrouter"
    | "zenmux"
    | "v0"
    | "iflowcn"
    | "synthetic"
    | "deepinfra"
    | "zhipuai"
    | "submodel"
    | "zai"
    | "inference"
    | "requesty"
    | "morph"
    | "lmstudio"
    | "anthropic"
    | "aihubmix"
    | "fireworks-ai"
    | "modelscope"
    | "llama"
    | "scaleway"
    | "amazon-bedrock"
    | "cerebras"
    | (string & {});
};

export const ModelSelectorLogo = ({
  provider,
  className,
  ...props
}: ModelSelectorLogoProps) => (
  <img
    {...props}
    alt={`${provider} logo`}
    className={cn("size-3 dark:invert", className)}
    height={12}
    src={`https://models.dev/logos/${provider}.svg`}
    width={12}
  />
);

export type ModelSelectorLogoGroupProps = ComponentProps<"div">;

export const ModelSelectorLogoGroup = ({
  className,
  ...props
}: ModelSelectorLogoGroupProps) => (
  <div
    className={cn(
      "flex shrink-0 items-center -space-x-1 [&>img]:rounded-full [&>img]:bg-background [&>img]:p-px [&>img]:ring-1 dark:[&>img]:bg-foreground",
      className,
    )}
    {...props}
  />
);

export type ModelSelectorNameProps = ComponentProps<"span">;

export const ModelSelectorName = ({
  className,
  ...props
}: ModelSelectorNameProps) => (
  <span className={cn("flex-1 truncate text-left", className)} {...props} />
);

// ============================================
// Tipos de modelo
// ============================================

export interface Model {
  id: string;
  name: string;
  provider: ModelSelectorLogoProps["provider"];
  costMultiplier: number;
  disabled?: boolean;
}

// ============================================
// Modelos predefinidos (según la imagen)
// ============================================

export const DEFAULT_MODELS: Model[] = [
  // OpenAI - Free tier (0x)
  { id: "gpt-4.1", name: "GPT-4.1", provider: "openai", costMultiplier: 0 },
  { id: "gpt-4o", name: "GPT-4o", provider: "openai", costMultiplier: 0 },
  {
    id: "gpt-5-mini",
    name: "GPT-5 mini",
    provider: "openai",
    costMultiplier: 0,
  },

  // xAI - Free tier (0x)
  {
    id: "grok-code-fast-1",
    name: "Grok Code Fast 1",
    provider: "xai",
    costMultiplier: 0,
  },

  // Google - Free tier (0x)
  {
    id: "raptor-mini-preview",
    name: "Raptor mini (Preview)",
    provider: "google",
    costMultiplier: 0,
  },

  // Anthropic - Budget tier (0.33x)
  {
    id: "claude-haiku-4.5",
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    costMultiplier: 0.33,
    disabled: true,
  },

  // Google - Budget tier (0.33x)
  {
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash (Preview)",
    provider: "google",
    costMultiplier: 0.33,
    disabled: true,
  },

  // OpenAI - Budget tier (0.33x)
  {
    id: "gpt-5.1-codex-mini-preview",
    name: "GPT-5.1-Codex-Mini (Previ...",
    provider: "openai",
    costMultiplier: 0.33,
    disabled: true,
  },

  // Anthropic - Standard tier (1x)
  {
    id: "claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    costMultiplier: 1,
    disabled: true,
  },
  {
    id: "claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    provider: "anthropic",
    costMultiplier: 1,
    disabled: true,
  },

  // Google - Standard tier (1x)
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "google",
    costMultiplier: 1,
    disabled: true,
  },
  {
    id: "gemini-3-pro-preview",
    name: "Gemini 3 Pro (Preview)",
    provider: "google",
    costMultiplier: 1,
    disabled: true,
  },

  // OpenAI - Standard tier (1x)
  {
    id: "gpt-5",
    name: "GPT-5",
    provider: "openai",
    costMultiplier: 1,
    disabled: true,
  },
  {
    id: "gpt-5-codex-preview",
    name: "GPT-5-Codex (Preview)",
    provider: "openai",
    costMultiplier: 1,
    disabled: true,
  },
  {
    id: "gpt-5.1",
    name: "GPT-5.1",
    provider: "openai",
    costMultiplier: 1,
    disabled: true,
  },
  {
    id: "gpt-5.1-codex",
    name: "GPT-5.1-Codex",
    provider: "openai",
    costMultiplier: 1,
    disabled: true,
  },
  {
    id: "gpt-5.1-codex-max",
    name: "GPT-5.1-Codex-Max",
    provider: "openai",
    costMultiplier: 1,
    disabled: true,
  },
  {
    id: "gpt-5.2",
    name: "GPT-5.2",
    provider: "openai",
    costMultiplier: 1,
    disabled: true,
  },
  {
    id: "gpt-5.2-codex",
    name: "GPT-5.2-Codex",
    provider: "openai",
    costMultiplier: 1,
    disabled: true,
  },

  // Anthropic - Premium tier (3x)
  {
    id: "claude-opus-4.5",
    name: "Claude Opus 4.5",
    provider: "anthropic",
    costMultiplier: 3,
    disabled: true,
  },
];

export const DEFAULT_MODEL =
  DEFAULT_MODELS.find((m) => m.id === "gpt-4o") || DEFAULT_MODELS[0];

// Agrupar modelos por proveedor
export function getModelsByProvider(models: Model[] = DEFAULT_MODELS) {
  const providers = [...new Set(models.map((m) => m.provider))];
  return providers.map((provider) => ({
    provider,
    models: models.filter((m) => m.provider === provider),
  }));
}

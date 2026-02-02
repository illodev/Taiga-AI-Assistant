export { ChatInterface } from "./chat-interface";
export { ChatMessage, type Message as ChatMessageType } from "./chat-message";
export { ChatInput } from "./chat-input";

// Re-export AI Elements para uso conveniente
export {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";

export {
  Message as AIMessage,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";

export {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";

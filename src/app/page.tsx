import { ChatInterface } from "@/components/chat/chat-interface";
import { AuthProvider } from "@/components/auth/auth-provider";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <AuthProvider>
        <ChatInterface />
      </AuthProvider>
    </main>
  );
}

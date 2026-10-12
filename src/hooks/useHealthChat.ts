import { useState, useCallback } from "react";
import { sendChatMessage } from "@/lib/api";

const FALLBACK = "Hey, I'm having a connection issue right now. Hang tight!\n\nHere's what you can do:\n\n1. Try sending your message again in a few seconds\n2. If it's urgent, give a health helpline a call\n3. In the meantime: drink water, eat well, and keep your vaccines up to date";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function useHealthChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call Express API → server calls Gemini + stores in MySQL
      const { response } = await sendChatMessage(content);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const fallbackMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: FALLBACK,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, clearMessages };
}

import { useState, useCallback } from "react";
import { sendChatMessage } from "@/lib/api";
import { detectEmergency, EMERGENCY_REPLY } from "@/lib/emergency";

/**
 * Offline / API-failure reply. Deliberately vague about clinical detail: this is
 * fixed text a worried person may trust, so it points at a human instead of
 * pretending to advise. Contains no doses and no diagnosis.
 */
const FALLBACK = `I can't reach my health knowledge base right now, so I'd rather not guess.

Please don't treat this as advice. If you can, talk to a doctor, nurse or your local health worker about what's going on.

If it's urgent, don't wait for me — call 108 (ambulance) or 112 (all emergencies). Both are free and work 24/7.

You can also try sending your message again in a minute.`;

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  /** True when this turn tripped the emergency detector. */
  isEmergency?: boolean;
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

    // Emergency short-circuit: the fixed safety reply goes out immediately,
    // without waiting on the network or on any model. A missed emergency is the
    // worst failure this app can have, so this path never depends on latency,
    // quota, or the API being reachable.
    if (detectEmergency(content)) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: EMERGENCY_REPLY,
          timestamp: new Date(),
          isEmergency: true,
        },
      ]);
      // Still send it so the conversation is logged and the server can escalate,
      // but the user already has the numbers on screen.
      void sendChatMessage(content).catch(() => {});
      return;
    }

    setIsLoading(true);

    try {
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

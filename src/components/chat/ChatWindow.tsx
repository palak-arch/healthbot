import React, { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage from "./ChatMessage";
import { Bot } from "lucide-react";
import type { Message } from "@/hooks/useHealthChat";

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  /** ID of the message currently being spoken */
  speakingId?: string | null;
  /** Callback to speak/stop a message by ID */
  onToggleSpeak?: (text: string, messageId: string) => void;
  /** Whether TTS is supported */
  ttsSupported?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "What vaccines do children need?",
  "How can I prevent the flu?",
  "What are the symptoms of dengue?",
  "Tips for maternal health during pregnancy",
];

const ChatWindow = ({
  messages,
  isLoading,
  speakingId,
  onToggleSpeak,
  ttsSupported = false,
}: ChatWindowProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Empty state with suggested questions
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
          <Bot className="h-8 w-8" />
        </div>
        <h3 className="font-display text-xl font-semibold">Welcome to HealthBot</h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Ask me anything about health, symptoms, vaccinations, or disease prevention.
          I'm here to help you stay informed and healthy.
        </p>
        <div className="mt-6 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              className="rounded-xl border bg-background p-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              onClick={() => {
                const event = new CustomEvent("suggested-question", { detail: q });
                window.dispatchEvent(event);
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="mx-auto max-w-3xl space-y-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isSpeaking={message.role === "assistant" && speakingId === message.id}
            onToggleSpeak={
              message.role === "assistant" && onToggleSpeak
                ? () => onToggleSpeak(message.content, message.id)
                : undefined
            }
            ttsSupported={ttsSupported}
          />
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:-0.3s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:-0.15s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
};

export default ChatWindow;

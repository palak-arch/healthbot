import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bot, User, Volume2, VolumeX } from "lucide-react";
import type { Message } from "@/hooks/useHealthChat";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  message: Message;
  /** Whether this message is currently being spoken */
  isSpeaking?: boolean;
  /** Callback to speak/stop this message */
  onToggleSpeak?: () => void;
  /** Whether TTS is supported at all */
  ttsSupported?: boolean;
}

const ChatMessage = ({
  message,
  isSpeaking = false,
  onToggleSpeak,
  ttsSupported = false,
}: ChatMessageProps) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={
            isUser
              ? "bg-secondary text-secondary-foreground"
              : "bg-primary text-primary-foreground"
          }
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={`group relative max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted rounded-tl-sm"
        }`}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        <div
          className={`mt-1 flex items-center gap-2 ${
            isUser ? "justify-end" : ""
          }`}
        >
          <p className="text-[10px] opacity-60">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>

          {/* Speaker button for assistant messages */}
          {!isUser && ttsSupported && onToggleSpeak && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSpeak}
              className={`h-5 w-5 transition-opacity ${
                isSpeaking
                  ? "text-primary opacity-100"
                  : "text-muted-foreground opacity-0 group-hover:opacity-100"
              }`}
              title={isSpeaking ? "Stop speaking" : "Read aloud"}
            >
              {isSpeaking ? (
                <VolumeX className="h-3 w-3" />
              ) : (
                <Volume2 className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;

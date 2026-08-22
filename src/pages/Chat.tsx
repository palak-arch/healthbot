import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Heart, Volume2, VolumeX } from "lucide-react";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatInput from "@/components/chat/ChatInput";
import ThemeToggle from "@/components/ui/theme-toggle";
import { useHealthChat } from "@/hooks/useHealthChat";
import { useTextToSpeech, useAutoSpeakEffect } from "@/hooks/useTextToSpeech";

const Chat = () => {
  const { messages, isLoading, sendMessage, clearMessages } = useHealthChat();
  const {
    isSupported: ttsSupported,
    autoSpeak,
    isSpeaking,
    speakingId,
    toggleAutoSpeak,
    speak,
    stop: stopSpeaking,
    speakMessage,
  } = useTextToSpeech();

  // Auto-speak new assistant messages
  useAutoSpeakEffect(messages, autoSpeak, speak, stopSpeaking);

  // Listen for suggested question clicks from ChatWindow
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      sendMessage(customEvent.detail);
    };
    window.addEventListener("suggested-question", handler);
    return () => window.removeEventListener("suggested-question", handler);
  }, [sendMessage]);

  // Stop speaking when clearing chat
  const handleClearMessages = () => {
    stopSpeaking();
    clearMessages();
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-background px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Heart className="h-4 w-4" />
            </div>
            <div>
              <h1 className="font-display text-sm font-semibold">HealthBot</h1>
              <p className="text-[10px] text-muted-foreground">
                {isLoading ? "Thinking..." : isSpeaking ? "Speaking..." : "AI Health Assistant"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          {/* Auto-speak toggle */}
          {ttsSupported && (
            <Button
              variant={autoSpeak ? "default" : "ghost"}
              size="sm"
              onClick={toggleAutoSpeak}
              className="gap-1.5"
              title={autoSpeak ? "Disable auto-speak" : "Enable auto-speak"}
            >
              {autoSpeak ? (
                <>
                  <Volume2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Voice On</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4" />
                  <span className="hidden sm:inline">Voice Off</span>
                </>
              )}
            </Button>
          )}

          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearMessages}
              className="gap-2 text-muted-foreground"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </header>

      {/* Chat Area */}
      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        speakingId={speakingId}
        onToggleSpeak={speakMessage}
        ttsSupported={ttsSupported}
      />

      {/* Input */}
      <ChatInput onSend={sendMessage} isLoading={isLoading} />
    </div>
  );
};

export default Chat;

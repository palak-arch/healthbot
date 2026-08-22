import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, MicOff, Loader2 } from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

const ChatInput = ({ onSend, isLoading }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript } = useVoiceInput();

  // Auto-fill input with voice transcript
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput("");
    resetTranscript();
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-4 border-t bg-background">
      {isSupported && (
        <Button
          type="button"
          variant={isListening ? "destructive" : "outline"}
          size="icon"
          onClick={handleVoiceToggle}
          className="shrink-0"
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
      )}

      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={isListening ? "Listening..." : "Ask about health, symptoms, vaccinations..."}
        disabled={isLoading}
        className="flex-1"
        autoComplete="off"
      />

      <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="shrink-0">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
};

export default ChatInput;

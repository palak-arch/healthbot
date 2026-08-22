import { useState, useCallback, useRef, useEffect } from "react";

interface UseTextToSpeechReturn {
  /** Whether the browser supports speech synthesis */
  isSupported: boolean;
  /** Whether auto-speak is enabled */
  autoSpeak: boolean;
  /** Whether speech is currently playing */
  isSpeaking: boolean;
  /** The message ID currently being spoken, if any */
  speakingId: string | null;
  /** Toggle auto-speak on/off */
  toggleAutoSpeak: () => void;
  /** Speak a given text, optionally tied to a message ID */
  speak: (text: string, messageId?: string) => void;
  /** Stop any current speech */
  stop: () => void;
  /** Speak a specific message by ID (for replay buttons) */
  speakMessage: (text: string, messageId: string) => void;
}

/** Strip markdown formatting for cleaner speech output */
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, "") // headings
    .replace(/\*\*(.*?)\*\*/g, "$1") // bold
    .replace(/\*(.*?)\*/g, "$1") // italic
    .replace(/`{1,3}[^`]*`{1,3}/g, (match) => match.replace(/`/g, "")) // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .replace(/^[-*+]\s/gm, "") // list markers
    .replace(/^\d+\.\s/gm, "") // numbered lists
    .replace(/\n{2,}/g, ". ") // double newlines -> pause
    .replace(/\n/g, " ") // single newlines -> space
    .trim();
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [autoSpeak, setAutoSpeak] = useState(() => {
    // Default to true if supported
    return typeof window !== "undefined" && !!window.speechSynthesis;
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const lastSpokenIdRef = useRef<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = typeof window !== "undefined" && !!window.speechSynthesis;

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingId(null);
    utteranceRef.current = null;
  }, []);

  const speak = useCallback(
    (text: string, messageId?: string) => {
      if (!isSupported) return;

      // Stop any current speech first
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      const cleanText = stripMarkdown(text);
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "en-US";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Try to pick a natural-sounding voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Google") ||
            v.name.includes("Samantha") ||
            v.name.includes("Daniel") ||
            v.name.includes("Natural"))
      );
      if (preferred) {
        utterance.voice = preferred;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        if (messageId) setSpeakingId(messageId);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingId(null);
        utteranceRef.current = null;
      };

      utterance.onerror = (event) => {
        // Don't log "interrupted" errors (happens when we cancel)
        if (event.error !== "interrupted") {
          console.error("Speech synthesis error:", event.error);
        }
        setIsSpeaking(false);
        setSpeakingId(null);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported]
  );

  const speakMessage = useCallback(
    (text: string, messageId: string) => {
      // If already speaking this message, stop it
      if (speakingId === messageId && isSpeaking) {
        stop();
        return;
      }
      speak(text, messageId);
    },
    [speak, stop, speakingId, isSpeaking]
  );

  const toggleAutoSpeak = useCallback(() => {
    setAutoSpeak((prev) => {
      if (prev) {
        // Turning off — stop any current speech
        stop();
      }
      return !prev;
    });
  }, [stop]);

  return {
    isSupported,
    autoSpeak,
    isSpeaking,
    speakingId,
    toggleAutoSpeak,
    speak,
    stop,
    speakMessage,
  };
}

/**
 * Given a new assistant message, auto-speak it if autoSpeak is enabled.
 * Call this from a useEffect watching messages.
 */
export function useAutoSpeakEffect(
  messages: Array<{ id: string; role: string; content: string }>,
  autoSpeak: boolean,
  speak: (text: string, messageId: string) => void,
  stop: () => void
) {
  const lastCountRef = useRef(messages.length);

  useEffect(() => {
    if (!autoSpeak) return;

    const prevCount = lastCountRef.current;
    lastCountRef.current = messages.length;

    // Only speak if a new message was added
    if (messages.length <= prevCount) return;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === "assistant") {
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        speak(lastMsg.content, lastMsg.id);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [messages, autoSpeak, speak, stop]);
}

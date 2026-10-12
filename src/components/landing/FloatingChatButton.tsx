import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bot, X } from "lucide-react";

/**
 * Floating chatbot button.
 * Shows on landing pages; hides itself on /chat so it never
 * overlaps the real chat input.
 */
const FloatingChatButton = () => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  // Hide on the chat page itself
  const isChatPage = location.pathname === "/chat";

  // Fade in after a short delay so it feels smooth on page load
  useEffect(() => {
    if (isChatPage) {
      setIsVisible(false);
      return;
    }
    const timer = setTimeout(() => setIsVisible(true), 400);
    return () => clearTimeout(timer);
  }, [isChatPage]);

  if (isChatPage) return null;

  return (
    <Link
      to="/chat"
      aria-label="Chat with HealthBot"
      className={`fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <Bot className="h-7 w-7" />
      {/* Small green dot to show the bot is online */}
      <span className="absolute right-0 top-0 flex h-4 w-4">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-background bg-green-500" />
      </span>
    </Link>
  );
};

export default FloatingChatButton;

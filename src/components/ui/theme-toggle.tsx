import React from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface ThemeToggleProps {
  /** Optional variant for different page contexts */
  variant?: "default" | "ghost";
  /** Show label text next to icon on desktop */
  showLabel?: boolean;
}

const ThemeToggle = ({ variant = "ghost", showLabel = false }: ThemeToggleProps) => {
  const { resolved, toggleTheme } = useTheme();

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={toggleTheme}
      className="gap-1.5"
      title={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {resolved === "dark" ? (
        <>
          <Sun className="h-4 w-4" />
          {showLabel && <span className="hidden sm:inline">Light</span>}
        </>
      ) : (
        <>
          <Moon className="h-4 w-4" />
          {showLabel && <span className="hidden sm:inline">Dark</span>}
        </>
      )}
    </Button>
  );
};

export default ThemeToggle;

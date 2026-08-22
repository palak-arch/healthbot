import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Heart, Bot, Syringe, MapPin } from "lucide-react";
import ThemeToggle from "@/components/ui/theme-toggle";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Heart className="h-5 w-5" />
          </div>
          <span>HealthBot</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Home
          </Link>
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            About
          </a>
          <Link to="/vaccinations" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Vaccinations
          </Link>
          <Link to="/health-centers" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Health Centers
          </Link>
          <ThemeToggle />
          <Link to="/chat">
            <Button size="sm" className="gap-2">
              <Bot className="h-4 w-4" />
              Start Chat
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden border-t bg-background px-4 pb-4 pt-2">
          <Link
            to="/"
            className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>
          <a
            href="#features"
            className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setIsOpen(false)}
          >
            Features
          </a>
          <a
            href="#about"
            className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setIsOpen(false)}
          >
            About
          </a>
          <Link
            to="/vaccinations"
            className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setIsOpen(false)}
          >
            Vaccinations
          </Link>
          <Link
            to="/health-centers"
            className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setIsOpen(false)}
          >
            Health Centers
          </Link>
          <div className="flex items-center py-2">
            <ThemeToggle showLabel />
          </div>
          <Link to="/chat" onClick={() => setIsOpen(false)}>
            <Button size="sm" className="mt-2 w-full gap-2">
              <Bot className="h-4 w-4" />
              Start Chat
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

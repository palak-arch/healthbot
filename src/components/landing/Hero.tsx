import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, ShieldCheck } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-primary/5 px-4 py-1.5 text-sm text-primary">
            <ShieldCheck className="h-4 w-4" />
            <span>AI-Powered Health Guidance</span>
          </div>

          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Your Trusted{" "}
            <span className="text-primary">Health Companion</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground md:text-xl">
            Get instant, reliable guidance on symptoms, vaccinations, and disease prevention.
            Our AI assistant is backed by trusted health data to keep you and your family safe.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/chat">
              <Button size="lg" className="gap-2 px-8 shadow-glow">
                <Bot className="h-5 w-5" />
                Start Health Chat
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="px-8">
                Learn More
              </Button>
            </a>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 grid grid-cols-3 gap-8 border-t pt-8">
            <div>
              <p className="font-display text-2xl font-bold text-primary">24/7</p>
              <p className="text-sm text-muted-foreground">Always Available</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-primary">Free</p>
              <p className="text-sm text-muted-foreground">No Sign-up Required</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-primary">AI</p>
              <p className="text-sm text-muted-foreground">Powered by Gemini</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

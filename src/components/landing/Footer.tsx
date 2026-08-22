import React from "react";
import { Heart } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const Footer = () => {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 font-display text-lg font-bold">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Heart className="h-4 w-4" />
              </div>
              HealthBot
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              AI-powered health assistant providing reliable guidance on symptoms, vaccinations, and disease prevention.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold">Quick Links</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#about" className="hover:text-foreground transition-colors">About</a></li>
              <li><a href="https://www.who.int" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">WHO Resources</a></li>
            </ul>
          </div>

          {/* Disclaimer */}
          <div>
            <h4 className="font-display font-semibold">Disclaimer</h4>
            <p className="mt-3 text-sm text-muted-foreground">
              This tool provides general health information and is not a substitute for professional medical advice.
              Always consult a healthcare provider for personal medical concerns.
            </p>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <p>&copy; {new Date().getFullYear()} HealthBot. All rights reserved.</p>
          <p>Built with ❤️ for better healthcare access</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

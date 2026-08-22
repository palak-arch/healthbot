import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bot,
  Shield,
  Syringe,
  MapPin,
  Mic,
  FileText,
} from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI Health Chat",
    description:
      "Get instant answers to health questions powered by Google Gemini. Ask about symptoms, prevention, and more.",
  },
  {
    icon: Mic,
    title: "Voice Input",
    description:
      "Speak your health concerns naturally using our voice recognition. Perfect for when typing isn't convenient.",
  },
  {
    icon: Shield,
    title: "Disease Awareness",
    description:
      "Stay informed about common diseases, their symptoms, prevention methods, and when to seek medical help.",
  },
  {
    icon: Syringe,
    title: "Vaccination Info",
    description:
      "Access complete vaccination schedules for infants, children, and adults. Never miss an important dose.",
  },
  {
    icon: MapPin,
    title: "Health Center Locator",
    description:
      "Find nearby health centers, clinics, and hospitals when you need in-person medical care.",
  },
  {
    icon: FileText,
    title: "Health Guides",
    description:
      "Browse professional health guides covering maternal care, child health, nutrition, and hygiene practices.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need for{" "}
            <span className="text-primary">Better Health</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Comprehensive health tools and information, all in one place.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="group border-0 bg-background shadow-sm transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

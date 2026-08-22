import React from "react";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />

        {/* About Section */}
        <section id="about" className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                About HealthBot
              </h2>
              <p className="mt-6 text-lg text-muted-foreground">
                HealthBot is an AI-powered health assistant designed to provide accessible,
                reliable health guidance to everyone. Our mission is to bridge the gap between
                medical knowledge and the communities that need it most.
              </p>
              <p className="mt-4 text-muted-foreground">
                Whether you need information about vaccination schedules, want to understand
                common symptoms, or are looking for guidance on maternal and child health,
                HealthBot is here to help — 24/7, completely free.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;

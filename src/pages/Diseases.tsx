import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Search,
  Stethoscope,
  ShieldAlert,
  ShieldCheck,
  HeartHandshake,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { diseaseLibrary, type DiseaseInfo } from "@/lib/diseaseLibrary";

const Diseases = () => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DiseaseInfo | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return diseaseLibrary;
    return diseaseLibrary.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.symptoms.some((s) => s.toLowerCase().includes(q))
    );
  }, [search]);

  const detail = selected ?? filtered[0] ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div>
              <h1 className="font-display text-sm font-semibold">Disease Library</h1>
              <p className="text-[10px] text-muted-foreground">
                Simple, reliable info — symptoms, prevention, and when to see a doctor
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl flex-1 p-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search a disease or symptom... e.g. fever, chest pain, swelling"
            className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          {/* Disease list */}
          <div className="space-y-2">
            {filtered.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelected(d)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                  detail?.id === d.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "hover:border-primary/40"
                }`}
              >
                <span className="text-2xl">{d.emoji}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <p className="text-[10px] text-muted-foreground">{d.category}</p>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="py-8 text-center text-xs text-muted-foreground">
                No match — try "fever" or "breathing".
              </p>
            )}
          </div>

          {/* Detail panel */}
          {detail && (
            <Card>
              <CardContent className="space-y-5 p-5">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{detail.emoji}</span>
                    <div>
                      <h2 className="font-display text-xl font-bold">{detail.name}</h2>
                      <Badge variant="secondary" className="mt-0.5">
                        {detail.category}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{detail.about}</p>
                </div>

                {/* Symptoms */}
                <section>
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Common symptoms
                  </h3>
                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {detail.symptoms.map((s) => (
                      <li key={s} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Prevention */}
                <section>
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    How to prevent it
                  </h3>
                  <ul className="space-y-1.5">
                    {detail.prevention.map((p) => (
                      <li key={p} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-green-600" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Self care */}
                <section>
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                    <HeartHandshake className="h-4 w-4 text-primary" />
                    Self care for mild cases
                  </h3>
                  <ul className="space-y-1.5">
                    {detail.selfCare.map((s) => (
                      <li key={s} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </section>

                {/* When to see doctor — warning box */}
                <section className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-red-700 dark:text-red-400">
                    <ShieldAlert className="h-4 w-4" />
                    See a doctor if...
                  </h3>
                  <ul className="space-y-1.5">
                    {detail.whenToSeeDoctor.map((w) => (
                      <li
                        key={w}
                        className="flex items-start gap-1.5 text-xs text-red-700 dark:text-red-300"
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-500" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Find hospitals CTA */}
                <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">
                    Need treatment? Find the best hospitals for {detail.name.toLowerCase()}.
                  </p>
                  <Link to="/health-centers">
                    <Button size="sm" className="gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      Find hospitals
                    </Button>
                  </Link>
                </div>

                <p className="text-[10px] text-muted-foreground">
                  Educational information only — not a diagnosis. Always consult a doctor for
                  personal medical advice.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Diseases;

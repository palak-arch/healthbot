import React, { useState } from "react";
import { Phone, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { EMERGENCY_CONTACTS } from "@/lib/emergency";

interface EmergencyBarProps {
  /** Collapsed by default on small screens to keep the chat usable. */
  defaultExpanded?: boolean;
}

/**
 * Fixed emergency contact strip. Rendered on the chat screen at all times,
 * independently of any keyword matching, so someone in distress never has to
 * type the "right" words to see where to call.
 */
/** Inline alert shown next to a message that tripped the detector. */
export const EmergencyInlineAlert = () => (
  <div
    role="alert"
    className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm"
  >
    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
    <p>
      <span className="font-semibold text-destructive">
        If this is happening right now, treat it as an emergency.
      </span>{" "}
      Call{" "}
      <a href="tel:108" className="font-semibold underline underline-offset-2">
        108
      </a>{" "}
      (ambulance) or{" "}
      <a href="tel:112" className="font-semibold underline underline-offset-2">
        112
      </a>{" "}
      (all emergencies). Don't wait for a reply here.
    </p>
  </div>
);

const EmergencyBar = ({ defaultExpanded = false }: EmergencyBarProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const primary = EMERGENCY_CONTACTS.slice(0, 2);

  return (
    <div className="border-b border-destructive/30 bg-destructive/5">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Emergency?</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {primary.map((contact) => (
            <a
              key={contact.number}
              href={`tel:${contact.number}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-destructive underline-offset-2 hover:underline"
              title={contact.note}
            >
              <Phone className="h-3 w-3" aria-hidden="true" />
              {contact.label} {contact.number}
            </a>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          aria-expanded={expanded}
        >
          {expanded ? "Fewer numbers" : "All helplines"}
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {expanded && (
        <div className="mx-auto grid max-w-3xl gap-2 px-4 pb-3 sm:grid-cols-2">
          {EMERGENCY_CONTACTS.map((contact) => (
            <a
              key={contact.number}
              href={`tel:${contact.number}`}
              className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-background/70 px-3 py-2 text-xs transition-colors hover:border-destructive/50"
            >
              <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden="true" />
              <span>
                <span className="font-semibold">
                  {contact.label} (India) — {contact.number}
                </span>
                <span className="mt-0.5 block text-muted-foreground">
                  {contact.labelHi} · {contact.labelPa}
                </span>
                <span className="mt-0.5 block text-muted-foreground">{contact.note}</span>
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmergencyBar;

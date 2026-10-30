import React, { useCallback, useState } from "react";
import { AlertTriangle, Mic, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EMERGENCY_CONTACTS } from "@/lib/emergency";

const CONSENT_KEY = "healthbot-safety-notice-v1";

/**
 * Shown before the first chat message, and required before the input unlocks.
 * Covers what DPDP-style notice needs: it says this is not a medical service,
 * what gets stored, and that voice input uses the browser vendor.
 */
const SafetyNotice = ({ onAcknowledge }: { onAcknowledge: () => void }) => {
  const [checked, setChecked] = useState(false);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">Before you start</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              HealthBot gives general health information. It is not a doctor, not a
              diagnosis, and not a medical service.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            For anything urgent, call {EMERGENCY_CONTACTS[0].number} or{" "}
            {EMERGENCY_CONTACTS[1].number}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Ambulance {EMERGENCY_CONTACTS[0].number} · All emergencies{" "}
            {EMERGENCY_CONTACTS[1].number} · Health helpline 104 · Mental health 14416.
            These numbers are always shown at the top of the chat.
          </p>
        </div>

        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">What we store:</span> the
            messages you send and the replies, so you can read them again. Health
            questions you type are sensitive — please don't share details you aren't
            comfortable storing.
          </li>
          <li className="flex gap-2">
            <Mic className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              <span className="font-medium text-foreground">Voice input:</span> the
              microphone button uses your browser's speech service. Your browser may send
              the audio to its own vendor (for example Google or Apple) to turn it into
              text. Skip the mic if that's a problem.
            </span>
          </li>
          <li>
            <span className="font-medium text-foreground">Always double-check:</span>{" "}
            vaccine doses and schedules are reference information. Confirm with a health
            worker or doctor before acting on them.
          </li>
        </ul>

        <label className="mt-4 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-input"
          />
          <span>
            I understand this is general information and not medical advice, and I agree to
            the handling described above.
          </span>
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button disabled={!checked} onClick={onAcknowledge}>
            I understand, start chatting
          </Button>
          <a
            href="/privacy"
            className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Privacy policy
          </a>
          <a
            href="/terms"
            className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Terms of use
          </a>
        </div>
      </div>
    </div>
  );
};

/** Returns whether the notice was already acknowledged on this device. */
export function hasAcknowledgedSafetyNotice(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CONSENT_KEY) === "true";
  } catch {
    return false;
  }
}

export function useSafetyNotice() {
  const [acknowledged, setAcknowledged] = useState<boolean>(hasAcknowledgedSafetyNotice);

  const acknowledge = useCallback(() => {
    try {
      window.localStorage.setItem(CONSENT_KEY, "true");
    } catch {
      // Storage may be unavailable (private mode) — still allow chatting.
    }
    setAcknowledged(true);
  }, []);

  return { acknowledged, acknowledge };
}

export default SafetyNotice;

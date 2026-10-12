import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  UserRound,
  LogIn,
  LogOut,
  UserPlus,
  LockKeyhole,
  HeartPulse,
  Pill,
  TriangleAlert,
  Phone,
  Printer,
  Plus,
  X,
  Loader2,
  MapPin,
  Check,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface PatientRecord {
  id: string;
  full_name: string;
  age: number;
  gender: string | null;
  blood_group: string | null;
  phone: string | null;
  conditions: string[] | null;
  medications: string[] | null;
  allergies: string[] | null;
  emergency_contact: string | null;
  notes: string | null;
  updated_at: string;
}

function parseJsonArray(s: string | string[] | null): string[] {
  if (!s) return [];
  if (Array.isArray(s)) return s; // mysql2 returns JSON columns already parsed
  try {
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

const emptyForm = {
  fullName: "",
  age: "",
  gender: "",
  bloodGroup: "",
  phone: "",
  emergencyContact: "",
  notes: "",
};

// ─── Patient auth (per-user accounts) ─────────────────────────

interface AuthUser {
  id: string;
  name: string;
  phone: string;
}

function loadAuth(): { token: string; user: AuthUser } | null {
  try {
    const raw = localStorage.getItem("healthbot_patient_auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.token && parsed?.user?.id) return parsed;
    return null;
  } catch {
    return null;
  }
}

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const Patient = () => {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [selected, setSelected] = useState<PatientRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dbOffline, setDbOffline] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [conditions, setConditions] = useState<string[]>([]);
  const [medications, setMedications] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [newItem, setNewItem] = useState({ conditions: "", medications: "", allergies: "" });

  // ─── Auth state ─────────────────────────────────────────────
  const [auth, setAuth] = useState<{ token: string; user: AuthUser } | null>(loadAuth);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authForm, setAuthForm] = useState({ name: "", phone: "", password: "" });
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const logout = () => {
    localStorage.removeItem("healthbot_patient_auth");
    setAuth(null);
    setPatients([]);
    setSelected(null);
    setAuthForm({ name: "", phone: "", password: "" });
    setAuthError(null);
  };

  const submitAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthBusy(true);
    setAuthError(null);
    try {
      const isSignup = authMode === "signup";
      const body = isSignup
        ? { name: authForm.name.trim(), phone: authForm.phone.trim(), password: authForm.password }
        : { phone: authForm.phone.trim(), password: authForm.password };
      let res: Response;
      try {
        res = await fetch(`${API_BASE}/api/auth/${isSignup ? "signup" : "login"}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch {
        throw new Error("Can't reach the server — make sure it's running, then try again");
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      localStorage.setItem(
        "healthbot_patient_auth",
        JSON.stringify({ token: data.token, user: data.user })
      );
      setAuth({ token: data.token, user: data.user });
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAuthBusy(false);
    }
  };

  const load = useCallback(async (token: string | null) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/patients`, {
        headers: authHeaders(token),
      });
      if (res.status === 401) {
        // Token expired/invalid (e.g. after many days) — clear it and show
        // the login screen with a friendly notice instead of a raw error.
        logout();
        setAuthError("Your login session expired — please log in again. It's quick!");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPatients(data);
      setDbOffline(false);
      if (data.length > 0) setSelected(data[0]);
    } catch {
      setDbOffline(true);
      setError("Couldn't load your profiles — the app couldn't reach its database. Try again in a minute.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auth?.token) {
      load(auth.token);
    }
  }, [auth?.token, load]);

  const addToList = (key: "conditions" | "medications" | "allergies") => {
    const val = newItem[key].trim();
    if (!val) return;
    const setter = { conditions: setConditions, medications: setMedications, allergies: setAllergies }[key];
    setter((prev) => [...prev, val]);
    setNewItem((n) => ({ ...n, [key]: "" }));
  };

  const removeFromList = (key: "conditions" | "medications" | "allergies", item: string) => {
    const setter = { conditions: setConditions, medications: setMedications, allergies: setAllergies }[key];
    setter((prev) => prev.filter((x) => x !== item));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.age) return;
    setSaving(true);
    setSuccess(null);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(auth?.token ?? null),
        },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          age: Number(form.age),
          gender: form.gender || undefined,
          bloodGroup: form.bloodGroup || undefined,
          phone: form.phone.trim() || undefined,
          emergencyContact: form.emergencyContact.trim() || undefined,
          notes: form.notes.trim() || undefined,
          conditions,
          medications,
          allergies,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const saved = await res.json();
      setSuccess(`Profile for ${form.fullName} saved. Show the visit summary at the hospital desk.`);
      setForm(emptyForm);
      setConditions([]);
      setMedications([]);
      setAllergies([]);
      await load(auth?.token ?? null);
      // select the freshly saved record
      setSelected((prev) => patients.find((p) => p.id === saved.id) || prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  const removePatient = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/patients/${id}`, {
        method: "DELETE",
        headers: authHeaders(auth?.token ?? null),
      });
      if (selected?.id === id) setSelected(null);
      load(auth?.token ?? null);
    } catch {
      setError("Could not delete record");
    }
  };

  const printSummary = () => {
    if (!selected) return;
    const w = window.open("", "_blank", "width=600,height=700");
    if (!w) return;
    const list = (items: string[]) =>
      items.length > 0
        ? `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`
        : "<p><em>None recorded</em></p>";
    w.document.write(`<!DOCTYPE html><html><head><title>Patient Summary — ${escapeHtml(selected.full_name)}</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 24px; color: #111; }
        h1 { font-size: 20px; margin-bottom: 2px; }
        .muted { color: #666; font-size: 12px; }
        h2 { font-size: 14px; margin: 18px 0 6px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
        ul { margin: 4px 0; padding-left: 20px; } li { font-size: 13px; margin: 3px 0; }
        .box { border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin-top: 10px; }
        .alert { border-color: #fca5a5; background: #fef2f2; }
        .grid { display: flex; gap: 24px; flex-wrap: wrap; font-size: 13px; margin-top: 8px; }
      </style></head><body>
      <h1>Patient Visit Summary</h1>
      <p class="muted">Generated by HealthBot on ${new Date().toLocaleString()}</p>
      <div class="grid">
        <span><strong>Name:</strong> ${escapeHtml(selected.full_name)}</span>
        <span><strong>Age:</strong> ${selected.age}</span>
        ${selected.gender ? `<span><strong>Gender:</strong> ${escapeHtml(selected.gender)}</span>` : ""}
        ${selected.blood_group ? `<span><strong>Blood group:</strong> ${escapeHtml(selected.blood_group)}</span>` : ""}
        ${selected.phone ? `<span><strong>Phone:</strong> ${escapeHtml(selected.phone)}</span>` : ""}
      </div>
      <div class="box alert">
        <h2 style="border-color:#fca5a5; color:#b91c1c;">Allergies — check before prescribing</h2>
        ${list(parseJsonArray(selected.allergies))}
      </div>
      <h2>Current conditions</h2>
      ${list(parseJsonArray(selected.conditions))}
      <h2>Current medications</h2>
      ${list(parseJsonArray(selected.medications))}
      ${selected.emergency_contact ? `<h2>Emergency contact</h2><p>${escapeHtml(selected.emergency_contact)}</p>` : ""}
      ${selected.notes ? `<h2>Notes</h2><p>${escapeHtml(selected.notes)}</p>` : ""}
      <p class="muted">Educational/demo record — verify details with the patient.</p>
      </body></html>`);
    w.document.close();
    w.print();
  };

  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

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
              <UserRound className="h-4 w-4" />
            </div>
            <div>
              <h1 className="font-display text-sm font-semibold">Patient Info</h1>
              <p className="text-[10px] text-muted-foreground">
                Save your health profile & get a printable hospital visit summary
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl flex-1 p-4">
        {/* ── Logged out: login / signup gate ── */}
        {!auth ? (
          <div className="mx-auto max-w-sm py-10">
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex flex-col items-center gap-2 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <LockKeyhole className="h-5 w-5" />
                  </div>
                  <h2 className="font-display text-lg font-semibold">
                    {authMode === "login" ? "Welcome back" : "Create your account"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Log in so only YOU can see your health profiles —
                    nobody else can view or change them.
                  </p>
                </div>
                <form onSubmit={submitAuth} className="space-y-2.5">
                  {authMode === "signup" && (
                    <Input
                      placeholder="Your name"
                      value={authForm.name}
                      onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                      required
                    />)
                  }
                  <Input
                    type="tel"
                    placeholder="Phone number"
                    value={authForm.phone}
                    onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password (min 6 characters)"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    required
                    minLength={6}
                  />
                  {authError && (
                    <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{authError}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={authBusy}>
                    {authBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : authMode === "login" ? (
                      <LogIn className="h-4 w-4" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    {authBusy ? "Please wait…" : authMode === "login" ? "Log in" : "Create account"}
                  </Button>
                </form>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === "login" ? "signup" : "login");
                    setAuthError(null);
                  }}
                  className="mt-3 w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  {authMode === "login"
                    ? "New here? Create an account"
                    : "Already have an account? Log in"}
                </button>
              </CardContent>
            </Card>
          </div>
        ) : (
        <>
        {dbOffline && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
            Database offline — saved profiles will not persist. Start MySQL and refresh.
          </div>
        )}

        {/* ── Logged-in banner ── */}
        <div className="mb-4 flex items-center justify-between rounded-lg border bg-card px-3 py-2">
          <div className="flex items-center gap-2 text-xs">
            <UserRound className="h-3.5 w-3.5 text-primary" />
            <span>
              Logged in as <strong>{auth.user.name}</strong>
              <span className="text-muted-foreground"> ({auth.user.phone})</span>
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="h-7 gap-1.5 text-xs">
            <LogOut className="h-3.5 w-3.5" /> Log out
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* ── Profile form ── */}
          <Card>
            <CardContent className="p-4">
              <h2 className="mb-1 flex items-center gap-2 font-display text-sm font-semibold">
                <HeartPulse className="h-4 w-4 text-primary" />
                Add patient profile
              </h2>
              <p className="mb-3 text-xs text-muted-foreground">
                Fill this once — it turns into a clear summary you can show at any hospital.
              </p>
              <form onSubmit={save} className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Full name *"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Age *"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    min="0"
                    max="130"
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="rounded-md border bg-background px-2 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="">Gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                  <select
                    value={form.bloodGroup}
                    onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                    className="rounded-md border bg-background px-2 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="">Blood group</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder="Phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                {/* Conditions */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Health conditions</label>
                  <div className="mt-1 flex gap-1.5">
                    <Input
                      placeholder="e.g. diabetes, high BP"
                      value={newItem.conditions}
                      onChange={(e) => setNewItem({ ...newItem, conditions: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addToList("conditions");
                        }
                      }}
                      className="h-9 text-xs"
                    />
                    <Button type="button" size="sm" variant="outline" className="h-9 px-2" onClick={() => addToList("conditions")}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {conditions.map((c) => (
                      <Badge key={c} variant="secondary" className="gap-1 text-[10px]">
                        {c}
                        <button type="button" onClick={() => removeFromList("conditions", c)}>
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Medications */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Current medicines</label>
                  <div className="mt-1 flex gap-1.5">
                    <Input
                      placeholder="e.g. metformin 500mg"
                      value={newItem.medications}
                      onChange={(e) => setNewItem({ ...newItem, medications: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addToList("medications");
                        }
                      }}
                      className="h-9 text-xs"
                    />
                    <Button type="button" size="sm" variant="outline" className="h-9 px-2" onClick={() => addToList("medications")}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {medications.map((m) => (
                      <Badge key={m} variant="secondary" className="gap-1 text-[10px]">
                        <Pill className="h-2.5 w-2.5" />
                        {m}
                        <button type="button" onClick={() => removeFromList("medications", m)}>
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Allergies */}
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium text-red-600">
                    <TriangleAlert className="h-3 w-3" />
                    Allergies (important for doctors)
                  </label>
                  <div className="mt-1 flex gap-1.5">
                    <Input
                      placeholder="e.g. penicillin, sulfa drugs"
                      value={newItem.allergies}
                      onChange={(e) => setNewItem({ ...newItem, allergies: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addToList("allergies");
                        }
                      }}
                      className="h-9 text-xs"
                    />
                    <Button type="button" size="sm" variant="outline" className="h-9 px-2" onClick={() => addToList("allergies")}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {allergies.map((a) => (
                      <Badge key={a} className="gap-1 bg-red-100 text-[10px] text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-300">
                        <TriangleAlert className="h-2.5 w-2.5" />
                        {a}
                        <button type="button" onClick={() => removeFromList("allergies", a)}>
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <Input
                  placeholder="Emergency contact (name & number)"
                  value={form.emergencyContact}
                  onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                />
                <Input
                  placeholder="Notes for the doctor (optional)"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />

                <Button type="submit" size="sm" className="w-full gap-2" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {saving ? "Saving..." : "Save profile"}
                </Button>
                {success && (
                  <p className="rounded bg-green-50 px-2 py-1.5 text-xs text-green-700 dark:bg-green-950 dark:text-green-400">
                    {success}
                  </p>
                )}
                {error && (
                  <p className="rounded bg-destructive/10 px-2 py-1.5 text-xs text-destructive">{error}</p>
                )}
              </form>
            </CardContent>
          </Card>

          {/* ── Saved profiles + summary ── */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
                  <UserRound className="h-4 w-4 text-primary" />
                  Saved profiles ({patients.length})
                </h2>
                {loading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : patients.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    No profiles yet — add the first one.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {patients.map((p) => (
                      <div
                        key={p.id}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-2.5 transition-all ${
                          selected?.id === p.id ? "border-primary ring-1 ring-primary/20" : "hover:border-primary/40"
                        }`}
                        onClick={() => setSelected(p)}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{p.full_name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {p.age} yrs{p.blood_group ? ` · ${p.blood_group}` : ""}
                            {parseJsonArray(p.conditions).length > 0
                              ? ` · ${parseJsonArray(p.conditions).length} condition(s)`
                              : ""}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[10px] text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePatient(p.id);
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Visit summary preview */}
            {selected && (
              <Card>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-display text-sm font-semibold">Visit summary preview</h2>
                    <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={printSummary}>
                      <Printer className="h-3.5 w-3.5" />
                      Print / PDF
                    </Button>
                  </div>

                  <div className="rounded-lg border p-3">
                    <p className="font-display text-base font-bold">{selected.full_name}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{selected.age} years</span>
                      {selected.gender && <span className="capitalize">{selected.gender}</span>}
                      {selected.blood_group && (
                        <Badge variant="outline" className="text-[10px]">
                          {selected.blood_group}
                        </Badge>
                      )}
                      {selected.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {selected.phone}
                        </span>
                      )}
                    </div>

                    {parseJsonArray(selected.allergies).length > 0 && (
                      <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 dark:border-red-900/50 dark:bg-red-950/30">
                        <p className="flex items-center gap-1 text-xs font-semibold text-red-700 dark:text-red-400">
                          <TriangleAlert className="h-3.5 w-3.5" />
                          Allergies
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {parseJsonArray(selected.allergies).map((a) => (
                            <Badge key={a} className="bg-red-100 text-[10px] text-red-700 hover:bg-red-100 dark:bg-red-900 dark:text-red-200">
                              {a}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {parseJsonArray(selected.conditions).length > 0 && (
                      <p className="mt-3 text-xs">
                        <span className="font-semibold">Conditions: </span>
                        <span className="text-muted-foreground">
                          {parseJsonArray(selected.conditions).join(", ")}
                        </span>
                      </p>
                    )}
                    {parseJsonArray(selected.medications).length > 0 && (
                      <p className="mt-1.5 text-xs">
                        <span className="font-semibold">Medicines: </span>
                        <span className="text-muted-foreground">
                          {parseJsonArray(selected.medications).join(", ")}
                        </span>
                      </p>
                    )}
                    {selected.emergency_contact && (
                      <p className="mt-1.5 text-xs">
                        <span className="font-semibold">Emergency: </span>
                        <span className="text-muted-foreground">{selected.emergency_contact}</span>
                      </p>
                    )}
                    {selected.notes && (
                      <p className="mt-1.5 text-xs">
                        <span className="font-semibold">Notes: </span>
                        <span className="text-muted-foreground">{selected.notes}</span>
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                    <p className="text-[10px] text-muted-foreground">
                      Taking this patient to a hospital?
                    </p>
                    <Link to="/health-centers">
                      <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs">
                        <MapPin className="h-3.5 w-3.5" />
                        Find hospitals
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default Patient;

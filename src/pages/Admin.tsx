import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Upload,
  Check,
  X,
  FileUp,
  Database,
  Loader2,
  Building2,
  AlertTriangle,
} from "lucide-react";

interface HospitalRecord {
  id: string;
  name: string;
  city: string;
  address: string | null;
  phone: string | null;
  services: string | null; // JSON string from DB
  avg_treatment_cost_inr: number | null;
  beds: number | null;
  annual_patients: number | null;
  accreditation: string | null;
  status: "pending_review" | "approved" | "rejected";
  source: string;
  submitted_by: string;
  review_note: string | null;
}

const API_BASE = import.meta.env.VITE_API_URL || "";
const ADMIN_KEY_STORAGE = "healthbot_admin_key";

const Admin = () => {
  const [records, setRecords] = useState<HospitalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbDown, setDbDown] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Upload form state
  // Admin login state
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem(ADMIN_KEY_STORAGE));
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    // Verify the key against a protected endpoint before storing
    try {
      const res = await fetch(`${API_BASE}/api/admin/verify`, {
        headers: { "x-admin-key": adminKey },
      });
      if (res.status === 401) {
        setLoginError("Wrong key — ask the hospital board admin.");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      sessionStorage.setItem(ADMIN_KEY_STORAGE, adminKey);
      setAuthed(true);
    } catch {
      setLoginError("Could not reach the server.");
    }
  };

  const [form, setForm] = useState({
    name: "",
    city: "",
    address: "",
    phone: "",
    avgTreatmentCostInr: "",
    beds: "",
    annualPatients: "",
    accreditation: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const key = sessionStorage.getItem(ADMIN_KEY_STORAGE) || "";
      const res = await fetch(`${API_BASE}/api/hospitals`, {
        headers: { "x-admin-key": key },
      });
      if (res.status === 401) {
        setAuthed(false);
        sessionStorage.removeItem(ADMIN_KEY_STORAGE);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRecords(data);
      setDbDown(false);
    } catch (err) {
      console.warn("Could not load hospital records:", err);
      setError("Could not load records — the database may be offline.");
      setDbDown(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.city.trim()) return;
    setSubmitting(true);
    setSuccessMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/hospitals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": sessionStorage.getItem(ADMIN_KEY_STORAGE) || "",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          city: form.city.trim(),
          address: form.address.trim() || undefined,
          phone: form.phone.trim() || undefined,
          avgTreatmentCostInr: form.avgTreatmentCostInr ? Number(form.avgTreatmentCostInr) : undefined,
          beds: form.beds ? Number(form.beds) : undefined,
          annualPatients: form.annualPatients ? Number(form.annualPatients) : undefined,
          accreditation: form.accreditation.trim() || undefined,
          source: "admin_upload",
          status: "pending_review",
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setSuccessMsg(`Saved "${form.name}" for review.`);
      setForm({ name: "", city: "", address: "", phone: "", avgTreatmentCostInr: "", beds: "", annualPatients: "", accreditation: "" });
      loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  const review = async (id: string, status: "approved" | "rejected") => {
    try {
      await fetch(`${API_BASE}/api/hospitals/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": sessionStorage.getItem(ADMIN_KEY_STORAGE) || "",
        },
        body: JSON.stringify({ status }),
      });
      setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch {
      setError("Could not update record status");
    }
  };

  const parseServices = (s: string | null): string[] => {
    if (!s) return [];
    try {
      const arr = JSON.parse(s);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  const statusBadge = (status: HospitalRecord["status"]) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-600 text-[10px]">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="text-[10px]">Rejected</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">Pending review</Badge>;
    }
  };

  const pendingCount = records.filter((r) => r.status === "pending_review").length;

  // ── Login gate ──
  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-sm font-semibold">Hospital Records Admin</h1>
                <p className="text-[10px] text-muted-foreground">Restricted access</p>
              </div>
            </div>
            <form onSubmit={handleLogin} className="space-y-3">
              <Input
                type="password"
                placeholder="Admin key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                autoFocus
                required
              />
              <Button type="submit" size="sm" className="w-full">
                Sign in
              </Button>
              {loginError && (
                <p className="rounded bg-destructive/10 px-2 py-1.5 text-xs text-destructive">{loginError}</p>
              )}
            </form>
            <p className="mt-4 text-[10px] text-muted-foreground">
              Demo key: ask the project maintainer. Sessions end when the browser closes.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h1 className="font-display text-sm font-semibold">Hospital Records Admin</h1>
              <p className="text-[10px] text-muted-foreground">
                Upload and review hospital data · {pendingCount} pending
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl flex-1 p-4">
        {dbDown && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Database offline — showing demo mode. Start MySQL and restart the API server to store real records.
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Upload form */}
          <Card>
            <CardContent className="p-4">
              <h2 className="mb-1 flex items-center gap-2 font-display text-sm font-semibold">
                <FileUp className="h-4 w-4 text-primary" />
                Upload Hospital Record
              </h2>
              <p className="mb-3 text-xs text-muted-foreground">
                Records go to "pending review" until approved. All cost figures are treated as
                simulated demo data and labelled as such in the user view.
              </p>
              <form onSubmit={handleSubmit} className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Hospital name *"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="City *"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    required
                  />
                </div>
                <Input
                  placeholder="Address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                  <Input
                    placeholder="Accreditation (e.g. NABH)"
                    value={form.accreditation}
                    onChange={(e) => setForm({ ...form, accreditation: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    placeholder="Avg cost (₹)"
                    value={form.avgTreatmentCostInr}
                    onChange={(e) => setForm({ ...form, avgTreatmentCostInr: e.target.value })}
                    min="0"
                  />
                  <Input
                    type="number"
                    placeholder="Beds"
                    value={form.beds}
                    onChange={(e) => setForm({ ...form, beds: e.target.value })}
                    min="0"
                  />
                  <Input
                    type="number"
                    placeholder="Patients/yr"
                    value={form.annualPatients}
                    onChange={(e) => setForm({ ...form, annualPatients: e.target.value })}
                    min="0"
                  />
                </div>
                <Button type="submit" size="sm" className="w-full gap-2" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {submitting ? "Saving..." : "Save for review"}
                </Button>
                {successMsg && (
                  <p className="rounded bg-green-50 px-2 py-1.5 text-xs text-green-700 dark:bg-green-950 dark:text-green-400">
                    {successMsg}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Records list */}
          <Card>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-sm font-semibold">
                  <Database className="h-4 w-4 text-primary" />
                  Records ({records.length})
                </h2>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={loadRecords}>
                  Refresh
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : error && records.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">{error}</p>
              ) : records.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  No records yet — upload the first one.
                </p>
              ) : (
                <ScrollArea className="h-[380px]">
                  <div className="space-y-2 pr-2">
                    {records.map((r) => (
                      <div key={r.id} className="rounded-lg border p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{r.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {r.city} · via {r.source} · by {r.submitted_by}
                            </p>
                          </div>
                          {statusBadge(r.status)}
                        </div>

                        <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                          {r.avg_treatment_cost_inr && <span>₹{r.avg_treatment_cost_inr.toLocaleString("en-IN")}</span>}
                          {r.beds && <span>· {r.beds} beds</span>}
                          {r.annual_patients && <span>· {r.annual_patients.toLocaleString("en-IN")} patients/yr</span>}
                          {r.accreditation && <span>· {r.accreditation}</span>}
                        </div>

                        {r.status === "pending_review" && (
                          <div className="mt-2 flex gap-1.5">
                            <Button
                              size="sm"
                              className="h-6 gap-1 bg-green-600 text-[10px] hover:bg-green-700"
                              onClick={() => review(r.id, "approved")}
                            >
                              <Check className="h-3 w-3" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 gap-1 text-[10px]"
                              onClick={() => review(r.id, "rejected")}
                            >
                              <X className="h-3 w-3" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;

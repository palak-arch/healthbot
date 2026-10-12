const API_BASE = import.meta.env.VITE_API_URL || "";

/** Stable per-tab session id so the server can keep conversation memory */
function sessionId(): string {
  let id = sessionStorage.getItem("healthbot_session");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("healthbot_session", id);
  }
  return id;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "x-session-id": sessionId(),
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }

  return res.json();
}

// ─── Chat API ─────────────────────────────────────────────────

export interface ChatApiResponse {
  response: string;
}

export interface ChatHistoryEntry {
  id: number;
  user_message: string;
  bot_response: string;
  created_at: string;
}

export async function sendChatMessage(message: string): Promise<ChatApiResponse> {
  return request<ChatApiResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

// ─── NL Search API ────────────────────────────────────────────

export interface SearchParseResult {
  disease: string | null;
  location: string | null;
  budgetInr: number | null;
  priority: string | null;
  source: "gemini" | "keyword";
}

/** Convert a natural-language query into structured search filters via AI */
export async function sendSearchParse(query: string): Promise<SearchParseResult> {
  return request<SearchParseResult>("/api/search/parse", {
    method: "POST",
    body: JSON.stringify({ message: query }),
  });
}

export async function getChatHistory(limit = 50): Promise<ChatHistoryEntry[]> {
  return request<ChatHistoryEntry[]>(`/api/chat/history?limit=${limit}`);
}

// ─── Vaccinations API ─────────────────────────────────────────

export interface VaccinationRecord {
  id: string;
  vaccine_name: string;
  date_administered: string | null;
  scheduled_date: string | null;
  status: "completed" | "scheduled" | "overdue";
  notes: string | null;
  created_at: string;
}

export async function fetchVaccinations(): Promise<VaccinationRecord[]> {
  return request<VaccinationRecord[]>("/api/vaccinations");
}

export async function createVaccination(record: {
  id?: string;
  vaccine_name: string;
  scheduled_date?: string;
  date_administered?: string;
  status?: string;
  notes?: string;
}): Promise<VaccinationRecord> {
  return request<VaccinationRecord>("/api/vaccinations", {
    method: "POST",
    body: JSON.stringify(record),
  });
}

export async function updateVaccination(
  id: string,
  updates: { status?: string; date_administered?: string; notes?: string }
): Promise<VaccinationRecord> {
  return request<VaccinationRecord>(`/api/vaccinations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteVaccination(id: string): Promise<void> {
  await request(`/api/vaccinations/${id}`, { method: "DELETE" });
}

// ─── Health Check ─────────────────────────────────────────────

export async function checkHealth(): Promise<{ status: string; db: string }> {
  return request("/api/health");
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
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

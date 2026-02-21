import { PromptEntry } from "@/data/mockData";

const API_BASE = "http://localhost:3000/api";

export async function fetchHistory(): Promise<PromptEntry[]> {
  const res = await fetch(`${API_BASE}/history`);
  const data = await res.json();
  return (data.history as Array<Record<string, unknown>>).map((e) => ({
    ...e,
    timestamp: new Date(e.timestamp as string),
  })) as PromptEntry[];
}

export async function fetchPrompt(): Promise<string> {
  const res = await fetch(`${API_BASE}/prompt`);
  const data = await res.json();
  return data.content as string;
}

export async function savePrompt(content: string): Promise<void> {
  await fetch(`${API_BASE}/prompt`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
}

export async function fetchInjections(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/injections`);
  const data = await res.json();
  return data.injections as string[];
}

export async function createCheckoutSession(): Promise<string> {
  const res = await fetch(`${API_BASE}/stripe/checkout`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Request failed: ${res.status}`);
  }
  const data = await res.json();
  return data.url as string;
}

export async function sanitizeText(text: string): Promise<PromptEntry> {
  const res = await fetch(`${API_BASE}/sanitize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Request failed: ${res.status}`);
  }

  const data = await res.json();
  return { ...data, timestamp: new Date(data.timestamp) } as PromptEntry;
}

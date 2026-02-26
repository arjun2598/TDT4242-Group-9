import { AIUsageLog, AIUsageLogInput } from "@/lib/types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getLogs(): Promise<AIUsageLog[]> {
  return request<AIUsageLog[]>("/logs");
}

export function createLog(payload: AIUsageLogInput): Promise<AIUsageLog> {
  return request<AIUsageLog>("/logs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateLog(
  id: number,
  payload: AIUsageLogInput,
): Promise<AIUsageLog> {
  return request<AIUsageLog>(`/logs/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteLog(id: number): Promise<void> {
  return request<void>(`/logs/${id}`, {
    method: "DELETE",
  });
}

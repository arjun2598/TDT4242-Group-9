import { AIUsageLog } from "./types";

const STORAGE_KEY = "ai-usage-entries";

export function getEntries(): AIUsageLog[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveEntry(entry: AIUsageLog): void {
  const entries = getEntries();
  entries.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function deleteEntry(id: number): void {
  const entries = getEntries().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

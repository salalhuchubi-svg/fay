"use client";
import type { FayData } from "./types";

const KEY = "fay_data";

export function loadData(): FayData {
  if (typeof window === "undefined") return defaultData();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultData();
    return JSON.parse(raw) as FayData;
  } catch {
    return defaultData();
  }
}

export function saveData(data: FayData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function defaultData(): FayData {
  return {
    tiktokAccounts: [],
    tasks: [],
    transactions: [],
    notes: [],
    socialAccounts: [],
    contentIdeas: [],
  };
}

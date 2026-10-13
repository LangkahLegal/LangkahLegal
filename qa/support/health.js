import { env } from "./env.js";

export async function ensureBackendReady() {
  const response = await fetch(`${env.apiUrl}/health`).catch(() => null);
  const health = response?.ok ? await response.json() : null;
  if (health?.database !== "connected") {
    throw new Error(`Backend di ${env.apiUrl} belum siap atau tidak terhubung ke database.`);
  }
}

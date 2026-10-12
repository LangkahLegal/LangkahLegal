import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

export const QA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const BACKEND_DIR = path.resolve(QA_DIR, "../backend");
export const FRONTEND_DIR = path.resolve(QA_DIR, "../frontend");
export const FILES_DIR = path.join(QA_DIR, "test_data", "files");
export const STATE_DIR = path.join(QA_DIR, ".sit-state");

dotenv.config({ path: path.join(QA_DIR, ".env.sit"), quiet: true });
dotenv.config({ path: path.join(BACKEND_DIR, ".env"), quiet: true });

const required = (name) => {
  const value = (process.env[name] || "").trim();
  if (!value) throw new Error(`Variabel ${name} belum diisi. Lihat qa/.env.sit.example.`);
  return value;
};

export const env = {
  baseUrl: process.env.SIT_BASE_URL || "http://localhost:3000",
  apiUrl: process.env.SIT_API_URL || "http://127.0.0.1:8000",
  slowMo: Number(process.env.SIT_SLOWMO || 0),
  stepScreenshot: process.env.SIT_STEP_SCREENSHOT === "1",
  get accountPassword() {
    return required("SIT_ACCOUNT_PASSWORD");
  },
  get supabaseUrl() {
    return required("SUPABASE_URL");
  },
  get supabaseKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
};

export const API_PREFIX = "/api/v1";

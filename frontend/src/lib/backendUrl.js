const LOCAL_API = "http://localhost:8000/api/v1";
const PRODUCTION_API = "https://langkahlegal-production.up.railway.app/api/v1";

const normalize = (rawUrl) => {
  try {
    const parsed = new URL(rawUrl);
    const isLocalhost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    if (!isLocalhost && parsed.protocol === "http:") parsed.protocol = "https:";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
};

/** Alamat backend sungguhan; dipakai rewrite proxy dan pemanggilan dari sisi server. */
export const BACKEND_API_URL =
  normalize(process.env.NEXT_PUBLIC_API_URL || "") || (process.env.VERCEL ? PRODUCTION_API : LOCAL_API);

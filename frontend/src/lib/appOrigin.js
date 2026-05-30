export function getAppOrigin() {
  if (typeof window === "undefined") {
    return "";
  }

  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  return isLocalhost ? "http://localhost:3000" : window.location.origin;
}
import { useSyncExternalStore } from "react";

const subscribe = (callback) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", callback);
  window.addEventListener("auth-storage-change", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("auth-storage-change", callback);
  };
};

/**
 * Membaca nilai yang hanya ada di browser (mis. localStorage) tanpa membuat hasil render
 * server dan browser berbeda: server memakai `serverValue`, browser memakai hasil `read`.
 * `read` harus mengembalikan nilai primitif agar hasilnya stabil antar-render.
 */
export function useClientValue(read, serverValue) {
  return useSyncExternalStore(subscribe, read, () => serverValue);
}


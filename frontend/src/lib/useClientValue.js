import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Membaca nilai yang hanya ada di browser (mis. localStorage) tanpa membuat hasil render
 * server dan browser berbeda: server memakai `serverValue`, browser memakai hasil `read`.
 * `read` harus mengembalikan nilai primitif agar hasilnya stabil antar-render.
 */
export function useClientValue(read, serverValue) {
  return useSyncExternalStore(subscribe, read, () => serverValue);
}

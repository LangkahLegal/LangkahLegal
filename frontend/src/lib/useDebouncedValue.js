import { useEffect, useState } from "react";

/** Nilai yang baru ikut berubah setelah `delay` ms tanpa perubahan, agar API tidak dipanggil tiap ketikan. */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/** Mengisi sessionStorage sebelum aplikasi dimuat, sekali per tab. */
export async function presetSessionStorage(page, entries) {
  await page.addInitScript((items) => {
    for (const [key, value] of Object.entries(items)) {
      const marker = `__sit_preset_${key}`;
      if (sessionStorage.getItem(marker)) continue;
      sessionStorage.setItem(key, value);
      sessionStorage.setItem(marker, "1");
    }
  }, entries);
}

export const readSessionStorage = (page, key) => page.evaluate((name) => sessionStorage.getItem(name), key);

export const readLocalStorage = (page, key) => page.evaluate((name) => localStorage.getItem(name), key);

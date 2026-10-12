import { expect } from "@playwright/test";
import { Then } from "../../hooks/bdd.js";

Then("setiap kata sandi itu ditolak dengan pesan yang sesuai", async ({ world }) => {
  for (const { label, message, shown } of world.rejections) {
    expect(shown, `kata sandi ${label} seharusnya ditolak dengan pesan "${message}"`).toBe(true);
  }
});

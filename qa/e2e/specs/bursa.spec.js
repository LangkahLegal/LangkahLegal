/**
 * E2E Tests - Bursa Kasus Probono
 * @tags @bursa
 */
import { test, expect } from "@playwright/test";
import { test as authTest, expect as authExpect } from "../fixtures/index.js";
import { BursaPage } from "../pom/BursaPage.js";
import { BursaPostPage } from "../pom/BursaPostPage.js";
import { ACCOUNTS, generateUniqueCaseDescription } from "../utils/test-data.js";
import { loginViaAPI, createBursaCase } from "../utils/api-helper.js";

const toDateString = (date) => date.toISOString().slice(0, 10);

const getFutureDate = (daysAhead = 14) => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return toDateString(date);
};

const seedBursaCase = async () => {
  const session = await loginViaAPI(
    ACCOUNTS.client.email,
    ACCOUNTS.client.password,
  );
  const description = generateUniqueCaseDescription("E2E Bursa Probono");

  const payload = {
    kategori_hukum: "pidana",
    deskripsi_kasus_awam: description,
    tanggal_konsultasi: getFutureDate(21),
    jam_mulai: "09:00",
    jam_selesai: "09:30",
  };

  const data = await createBursaCase(session.access_token, payload);
  return { ...data, description };
};

// =====================================================================
// CLIENT FLOW
// =====================================================================

authTest.describe("Bursa Kasus - Client Flow @bursa", () => {
  authTest("should display bursa post form", async ({ clientPage }) => {
    const postPage = new BursaPostPage(clientPage);
    await postPage.goto();

    await authExpect(postPage.submitButton).toBeVisible();
  });

  authTest("should submit a bursa case", async ({ clientPage }) => {
    const postPage = new BursaPostPage(clientPage);
    await postPage.goto();

    await postPage.fillDescription(
      generateUniqueCaseDescription("E2E Bursa UI"),
    );
    await postPage.selectFirstAvailableDate();
    await postPage.selectFirstAvailableStartTime();

    await postPage.submit();
    await postPage.waitForSuccess();
  });
});

// =====================================================================
// CONSULTANT FLOW
// =====================================================================

authTest.describe("Bursa Kasus - Consultant Flow @bursa", () => {
  authTest("should claim a bursa case", async ({ consultantPage }) => {
    const seededCase = await seedBursaCase();

    consultantPage.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    const bursaPage = new BursaPage(consultantPage);
    await bursaPage.goto();

    await bursaPage.filterByCategory("Pidana");
    await bursaPage.waitForCase(seededCase.description);

    await bursaPage.claimCaseByDescription(seededCase.description);
    await bursaPage.confirmClaim();

    await bursaPage.waitForSuccess();
    authExpect(await bursaPage.isSuccessVisible()).toBeTruthy();
  });
});

// =====================================================================
// UNAUTHORIZED ACCESS
// =====================================================================

test.describe("Bursa Kasus - Unauthorized Access @bursa", () => {
  test("should redirect to login when accessing /bursa without session", async ({
    page,
  }) => {
    await page.goto("/bursa");
    await page.waitForURL("**/auth/login**", { timeout: 15_000 });
    expect(page.url()).toContain("/auth/login");
  });

  test("should redirect to login when accessing /bursa/post without session", async ({
    page,
  }) => {
    await page.goto("/bursa/post");
    await page.waitForURL("**/auth/login**", { timeout: 15_000 });
    expect(page.url()).toContain("/auth/login");
  });
});

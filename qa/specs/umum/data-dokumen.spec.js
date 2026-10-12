import { Given } from "../../hooks/bdd.js";
import { removeLegalDocument, seedLegalDocument } from "../../support/seed.js";
import { LEGAL_DOCUMENT } from "../../test_data/admin.data.js";

Given("basis pengetahuan berisi dokumen uji", async ({ world }) => {
  const { numberLabel, detailLabel, statusLabel, editedText, ...document } = LEGAL_DOCUMENT;
  world.legalChunks = await seedLegalDocument(document);
  world.cleanups.push(() => removeLegalDocument(LEGAL_DOCUMENT.frbr_uri));
});

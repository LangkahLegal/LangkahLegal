import { Before } from "./bdd.js";

const SCENARIO_ID = /^@([A-Z]+-\d+)$/;
const BUG_ID = /^@(BUG-\d+)$/;

/** Sebelum setiap skenario: catat ID skenario dan ID bug dari tag ke laporan. */
Before({ name: "catat identitas skenario" }, async ({ $tags, $testInfo, world }) => {
  world.startedAt = Date.now();
  for (const tag of $tags) {
    const id = tag.match(SCENARIO_ID)?.[1];
    const bug = tag.match(BUG_ID)?.[1];
    if (id) $testInfo.annotations.push({ type: "id", description: id });
    if (bug) $testInfo.annotations.push({ type: "bug", description: bug });
  }
});

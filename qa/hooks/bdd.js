import { createBdd } from "playwright-bdd";
import "../support/parameter-types.js";
import { test } from "./fixtures.js";

export const { Given, When, Then, Before, After, BeforeAll, AfterAll, BeforeStep, AfterStep } = createBdd(test);

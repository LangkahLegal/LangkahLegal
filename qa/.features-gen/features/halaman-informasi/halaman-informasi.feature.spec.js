// Generated from: features\halaman-informasi\halaman-informasi.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Halaman informasi publik', () => {

  test('Setiap halaman informasi dapat dibaca tanpa login', { tag: ['@sit', '@halaman-informasi', '@PUB-009', '@PUB-010', '@PUB-011', '@PUB-012'] }, async ({ When, Then, And, page, pageErrors, world }) => { 
    await When('pengguna membuka setiap halaman informasi', null, { page, world }); 
    await Then('setiap halaman informasi berhasil dimuat dengan judulnya', null, { page, world }); 
    await And('halaman tidak mengalami galat', null, { page, pageErrors, world }); 
  });

  test('Alamat yang tidak dikenal menampilkan halaman tidak ditemukan', { tag: ['@sit', '@halaman-informasi', '@PUB-013'] }, async ({ When, Then, page, world }) => { 
    await When('pengguna membuka alamat yang tidak dikenal', null, { page, world }); 
    await Then('halaman tidak ditemukan tampil', null, { page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\halaman-informasi\\halaman-informasi.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":6,"tags":["@sit","@halaman-informasi","@PUB-009","@PUB-010","@PUB-011","@PUB-012"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Action","textWithKeyword":"When pengguna membuka setiap halaman informasi","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Outcome","textWithKeyword":"Then setiap halaman informasi berhasil dimuat dengan judulnya","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":9,"keywordType":"Outcome","textWithKeyword":"And halaman tidak mengalami galat","stepMatchArguments":[]}]},
  {"pwTestLine":12,"pickleLine":12,"tags":["@sit","@halaman-informasi","@PUB-013"],"steps":[{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Action","textWithKeyword":"When pengguna membuka alamat yang tidak dikenal","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"Then halaman tidak ditemukan tampil","stepMatchArguments":[]}]},
]; // bdd-data-end
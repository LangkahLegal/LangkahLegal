// Generated from: features\riwayat-konsultan\riwayat-konsultan.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Riwayat sesi konsultan', () => {

  test('Riwayat konsultan tidak memuat pengajuan yang masih pending', { tag: ['@sit', '@riwayat-konsultan', '@precondition:login-konsultan', '@CHI-001'] }, async ({ Given, When, Then, page, riwayatKonsultanPage, world }) => { 
    await Given('konsultan uji punya sesi selesai, pengajuan pending, dan sesi dibatalkan', null, { page, world }); 
    await When('pengguna membuka halaman riwayat konsultan', null, { page, world }); 
    await Then('riwayat konsultan hanya menampilkan sesi yang sudah diproses beserta jumlah sesi selesai', null, { page, riwayatKonsultanPage, world }); 
  });

  test('Konsultan tanpa sesi melihat riwayat kosong', { tag: ['@sit', '@riwayat-konsultan', '@precondition:login-konsultan', '@CHI-002'] }, async ({ Given, When, Then, page, riwayatKonsultanPage, world }) => { 
    await Given('klien belum punya konsultasi', null, { page, world }); 
    await When('pengguna membuka halaman riwayat konsultan', null, { page, world }); 
    await Then('riwayat konsultan menampilkan keadaan kosong', null, { page, riwayatKonsultanPage, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\riwayat-konsultan\\riwayat-konsultan.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":6,"tags":["@sit","@riwayat-konsultan","@precondition:login-konsultan","@CHI-001"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given konsultan uji punya sesi selesai, pengajuan pending, dan sesi dibatalkan","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman riwayat konsultan","stepMatchArguments":[{"group":{"start":25,"value":"riwayat konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":9,"gherkinStepLine":9,"keywordType":"Outcome","textWithKeyword":"Then riwayat konsultan hanya menampilkan sesi yang sudah diproses beserta jumlah sesi selesai","stepMatchArguments":[]}]},
  {"pwTestLine":12,"pickleLine":12,"tags":["@sit","@riwayat-konsultan","@precondition:login-konsultan","@CHI-002"],"steps":[{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Context","textWithKeyword":"Given klien belum punya konsultasi","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman riwayat konsultan","stepMatchArguments":[{"group":{"start":25,"value":"riwayat konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"Then riwayat konsultan menampilkan keadaan kosong","stepMatchArguments":[]}]},
]; // bdd-data-end
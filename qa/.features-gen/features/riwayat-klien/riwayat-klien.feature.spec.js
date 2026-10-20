// Generated from: features\riwayat-klien\riwayat-klien.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Riwayat konsultasi klien', () => {

  test('Riwayat mendahulukan sesi aktif dan menghitung sesi selesai', { tag: ['@sit', '@riwayat-klien', '@precondition:login-klien', '@HIS-001', '@mobile'] }, async ({ Given, When, Then, And, page, riwayatKlienPage, world }) => { 
    await Given('klien punya riwayat konsultasi dengan berbagai status', null, { page, world }); 
    await When('pengguna membuka halaman riwayat klien', null, { page, world }); 
    await Then('riwayat menampilkan semua konsultasi dengan sesi aktif di urutan teratas', null, { page, riwayatKlienPage, world }); 
    await And('jumlah sesi selesai tampil di riwayat', null, { page, riwayatKlienPage, world }); 
  });

  test('Klien tanpa konsultasi melihat riwayat kosong', { tag: ['@sit', '@riwayat-klien', '@precondition:login-klien', '@HIS-002'] }, async ({ Given, When, Then, page, riwayatKlienPage, world }) => { 
    await Given('klien belum punya konsultasi', null, { page, world }); 
    await When('pengguna membuka halaman riwayat klien', null, { page, world }); 
    await Then('riwayat menampilkan keadaan kosong', null, { page, riwayatKlienPage, world }); 
  });

  test('Klien membuka detail konsultasi dari riwayat', { tag: ['@sit', '@riwayat-klien', '@precondition:login-klien', '@HIS-003'] }, async ({ Given, When, Then, And, page, riwayatKlienPage, world }) => { 
    await Given('klien punya konsultasi berstatus selesai', null, { page, world }); 
    await And('pengguna berada di halaman riwayat klien', null, { page, world }); 
    await When('pengguna membuka detail konsultasi dari riwayat', null, { page, riwayatKlienPage, world }); 
    await Then('pengguna diarahkan ke halaman detail konsultasi itu', null, { page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\riwayat-klien\\riwayat-klien.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":6,"tags":["@sit","@riwayat-klien","@precondition:login-klien","@HIS-001","@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given klien punya riwayat konsultasi dengan berbagai status","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman riwayat klien","stepMatchArguments":[{"group":{"start":25,"value":"riwayat klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":9,"gherkinStepLine":9,"keywordType":"Outcome","textWithKeyword":"Then riwayat menampilkan semua konsultasi dengan sesi aktif di urutan teratas","stepMatchArguments":[]},{"pwStepLine":10,"gherkinStepLine":10,"keywordType":"Outcome","textWithKeyword":"And jumlah sesi selesai tampil di riwayat","stepMatchArguments":[]}]},
  {"pwTestLine":13,"pickleLine":13,"tags":["@sit","@riwayat-klien","@precondition:login-klien","@HIS-002"],"steps":[{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Context","textWithKeyword":"Given klien belum punya konsultasi","stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman riwayat klien","stepMatchArguments":[{"group":{"start":25,"value":"riwayat klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":16,"gherkinStepLine":16,"keywordType":"Outcome","textWithKeyword":"Then riwayat menampilkan keadaan kosong","stepMatchArguments":[]}]},
  {"pwTestLine":19,"pickleLine":19,"tags":["@sit","@riwayat-klien","@precondition:login-klien","@HIS-003"],"steps":[{"pwStepLine":20,"gherkinStepLine":20,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus selesai","stepMatchArguments":[{"group":{"start":33,"value":"selesai"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":21,"gherkinStepLine":21,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman riwayat klien","stepMatchArguments":[{"group":{"start":27,"value":"riwayat klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":22,"gherkinStepLine":22,"keywordType":"Action","textWithKeyword":"When pengguna membuka detail konsultasi dari riwayat","stepMatchArguments":[]},{"pwStepLine":23,"gherkinStepLine":23,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman detail konsultasi itu","stepMatchArguments":[{"group":{"start":30,"value":"detail konsultasi itu"},"parameterTypeName":"halaman"}]}]},
]; // bdd-data-end
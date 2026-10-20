// Generated from: features\dashboard-admin\dashboard-admin.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Dashboard admin', () => {

  test('Dashboard admin menampilkan statistik pengguna sesuai database', { tag: ['@sit', '@dashboard-admin', '@precondition:login-admin', '@ADM-001', '@critical', '@mobile'] }, async ({ When, Then, dashboardAdminPage, page, world }) => { 
    await When('pengguna membuka halaman dashboard admin', null, { page, world }); 
    await Then('statistik pengguna di dashboard admin sama dengan isi database', null, { dashboardAdminPage, page, world }); 
  });

  test('Pengajuan verifikasi terbaru dapat dibuka dari dashboard', { tag: ['@sit', '@dashboard-admin', '@precondition:login-admin', '@ADM-002'] }, async ({ Given, When, Then, And, dashboardAdminPage, page, world }) => { 
    await Given('konsultan baru baru saja mengajukan verifikasi', null, { page, world }); 
    await And('pengguna berada di halaman dashboard admin', null, { page, world }); 
    await Then('pengajuan verifikasi konsultan baru tampil di dashboard admin', null, { page, world }); 
    await When('pengguna membuka pengajuan verifikasi itu dari dashboard', null, { dashboardAdminPage, page, world }); 
    await Then('pengguna diarahkan ke halaman verifikasi konsultan baru', null, { page, world }); 
  });

  test('Dashboard tetap tampil tanpa pengajuan dan tanpa statistik', { tag: ['@sit', '@dashboard-admin', '@precondition:login-admin', '@ADM-003', '@stub'] }, async ({ Given, When, Then, And, dashboardAdminPage, network, page, pageErrors, world }) => { 
    await Given('tidak ada pengajuan verifikasi yang menunggu', null, { network, page, world }); 
    await And('layanan statistik admin sedang mengalami gangguan', null, { network, page, world }); 
    await When('pengguna membuka halaman dashboard admin', null, { page, world }); 
    await Then('dashboard admin menampilkan bahwa semua pengajuan sudah selesai', null, { dashboardAdminPage, page, world }); 
    await And('halaman tidak mengalami galat', null, { page, pageErrors, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\dashboard-admin\\dashboard-admin.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":6,"tags":["@sit","@dashboard-admin","@precondition:login-admin","@ADM-001","@critical","@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman dashboard admin","stepMatchArguments":[{"group":{"start":25,"value":"dashboard admin"},"parameterTypeName":"halaman"}]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Outcome","textWithKeyword":"Then statistik pengguna di dashboard admin sama dengan isi database","stepMatchArguments":[]}]},
  {"pwTestLine":11,"pickleLine":11,"tags":["@sit","@dashboard-admin","@precondition:login-admin","@ADM-002"],"steps":[{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Context","textWithKeyword":"Given konsultan baru baru saja mengajukan verifikasi","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman dashboard admin","stepMatchArguments":[{"group":{"start":27,"value":"dashboard admin"},"parameterTypeName":"halaman"}]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"Then pengajuan verifikasi konsultan baru tampil di dashboard admin","stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Action","textWithKeyword":"When pengguna membuka pengajuan verifikasi itu dari dashboard","stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":16,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman verifikasi konsultan baru","stepMatchArguments":[{"group":{"start":30,"value":"verifikasi konsultan baru"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":19,"pickleLine":19,"tags":["@sit","@dashboard-admin","@precondition:login-admin","@ADM-003","@stub"],"steps":[{"pwStepLine":20,"gherkinStepLine":20,"keywordType":"Context","textWithKeyword":"Given tidak ada pengajuan verifikasi yang menunggu","stepMatchArguments":[]},{"pwStepLine":21,"gherkinStepLine":21,"keywordType":"Context","textWithKeyword":"And layanan statistik admin sedang mengalami gangguan","stepMatchArguments":[{"group":{"start":8,"value":"statistik admin"},"parameterTypeName":"layanan"}]},{"pwStepLine":22,"gherkinStepLine":22,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman dashboard admin","stepMatchArguments":[{"group":{"start":25,"value":"dashboard admin"},"parameterTypeName":"halaman"}]},{"pwStepLine":23,"gherkinStepLine":23,"keywordType":"Outcome","textWithKeyword":"Then dashboard admin menampilkan bahwa semua pengajuan sudah selesai","stepMatchArguments":[]},{"pwStepLine":24,"gherkinStepLine":24,"keywordType":"Outcome","textWithKeyword":"And halaman tidak mengalami galat","stepMatchArguments":[]}]},
]; // bdd-data-end
// Generated from: features\dashboard-konsultan\dashboard-konsultan.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Dashboard konsultan', () => {

  test('Konsultan tanpa konsultasi melihat dashboard kosong', { tag: ['@sit', '@dashboard-konsultan', '@CDB-001', '@critical', '@mobile', '@precondition:login-konsultan'] }, async ({ Given, When, Then, dashboardKonsultanPage, page, world }) => { 
    await Given('klien belum punya konsultasi', null, { page, world }); 
    await When('pengguna membuka halaman dashboard konsultan', null, { page, world }); 
    await Then('dashboard konsultan menampilkan sapaan, pendapatan nol, dan keadaan kosong', null, { dashboardKonsultanPage, page, world }); 
  });

  test('Jadwal terdekat menampilkan sesi mendatang yang paling dekat', { tag: ['@sit', '@dashboard-konsultan', '@CDB-002', '@precondition:login-konsultan'] }, async ({ Given, When, Then, dashboardKonsultanPage, page, world }) => { 
    await Given('konsultan uji punya sesi terjadwal yang dekat, yang jauh, dan yang sudah lewat', null, { page, world }); 
    await When('pengguna membuka halaman dashboard konsultan', null, { page, world }); 
    await Then('hanya sesi yang paling dekat tampil sebagai jadwal terdekat', null, { dashboardKonsultanPage, page, world }); 
  });

  test('Permintaan baru tidak menampilkan permintaan yang jadwalnya sudah lewat', { tag: ['@sit', '@dashboard-konsultan', '@CDB-003', '@precondition:login-konsultan'] }, async ({ Given, When, Then, And, dashboardKonsultanPage, page, world }) => { 
    await Given('konsultan uji menerima permintaan baru dan permintaan yang jadwalnya sudah lewat', null, { page, world }); 
    await And('pengguna berada di halaman dashboard konsultan', null, { page, world }); 
    await Then('hanya permintaan yang jadwalnya belum lewat tampil sebagai permintaan baru', null, { dashboardKonsultanPage, page, world }); 
    await When('pengguna membuka permintaan baru itu', null, { dashboardKonsultanPage, page, world }); 
    await Then('pengguna diarahkan ke halaman permintaan konsultasi itu', null, { page, world }); 
  });

  test('Konsultan yang verifikasinya ditolak diberi tahu alasannya', { tag: ['@sit', '@dashboard-konsultan', '@CDB-004'] }, async ({ Given, When, Then, And, auth, dashboardKonsultanPage, page, world }) => { 
    await Given('verifikasi konsultan baru ditolak dengan sebuah alasan', null, { page, world }); 
    await And('pengguna sudah login sebagai konsultan baru', null, { auth, page, world }); 
    await And('pengguna berada di halaman dashboard konsultan', null, { page, world }); 
    await Then('dashboard konsultan menampilkan penolakan verifikasi beserta alasannya', null, { dashboardKonsultanPage, page, world }); 
    await When('pengguna memilih pengaturan profil dari pemberitahuan penolakan', null, { dashboardKonsultanPage, page, world }); 
    await Then('pengguna diarahkan ke halaman pengaturan profil', null, { page, world }); 
  });

  test('Gangguan saat memuat statistik tidak merusak dashboard', { tag: ['@sit', '@dashboard-konsultan', '@CDB-005', '@precondition:login-konsultan'] }, async ({ Given, When, Then, And, network, page, pageErrors, world }) => { 
    await Given('layanan statistik konsultan sedang mengalami gangguan', null, { network, page, world }); 
    await When('pengguna membuka halaman dashboard konsultan', null, { page, world }); 
    await Then('dashboard konsultan tetap tampil dengan pendapatan nol', null, { page, world }); 
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
  $uri: [({}, use) => use('features\\dashboard-konsultan\\dashboard-konsultan.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":6,"tags":["@sit","@dashboard-konsultan","@CDB-001","@critical","@mobile","@precondition:login-konsultan"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given klien belum punya konsultasi","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman dashboard konsultan","stepMatchArguments":[{"group":{"start":25,"value":"dashboard konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":9,"gherkinStepLine":9,"keywordType":"Outcome","textWithKeyword":"Then dashboard konsultan menampilkan sapaan, pendapatan nol, dan keadaan kosong","stepMatchArguments":[]}]},
  {"pwTestLine":12,"pickleLine":12,"tags":["@sit","@dashboard-konsultan","@CDB-002","@precondition:login-konsultan"],"steps":[{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Context","textWithKeyword":"Given konsultan uji punya sesi terjadwal yang dekat, yang jauh, dan yang sudah lewat","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman dashboard konsultan","stepMatchArguments":[{"group":{"start":25,"value":"dashboard konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"Then hanya sesi yang paling dekat tampil sebagai jadwal terdekat","stepMatchArguments":[]}]},
  {"pwTestLine":18,"pickleLine":18,"tags":["@sit","@dashboard-konsultan","@CDB-003","@precondition:login-konsultan"],"steps":[{"pwStepLine":19,"gherkinStepLine":19,"keywordType":"Context","textWithKeyword":"Given konsultan uji menerima permintaan baru dan permintaan yang jadwalnya sudah lewat","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":20,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman dashboard konsultan","stepMatchArguments":[{"group":{"start":27,"value":"dashboard konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":21,"gherkinStepLine":21,"keywordType":"Outcome","textWithKeyword":"Then hanya permintaan yang jadwalnya belum lewat tampil sebagai permintaan baru","stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":22,"keywordType":"Action","textWithKeyword":"When pengguna membuka permintaan baru itu","stepMatchArguments":[]},{"pwStepLine":23,"gherkinStepLine":23,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman permintaan konsultasi itu","stepMatchArguments":[{"group":{"start":30,"value":"permintaan konsultasi itu"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":26,"pickleLine":26,"tags":["@sit","@dashboard-konsultan","@CDB-004"],"steps":[{"pwStepLine":27,"gherkinStepLine":27,"keywordType":"Context","textWithKeyword":"Given verifikasi konsultan baru ditolak dengan sebuah alasan","stepMatchArguments":[]},{"pwStepLine":28,"gherkinStepLine":28,"keywordType":"Context","textWithKeyword":"And pengguna sudah login sebagai konsultan baru","stepMatchArguments":[{"group":{"start":29,"value":"konsultan baru"},"parameterTypeName":"akun"}]},{"pwStepLine":29,"gherkinStepLine":29,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman dashboard konsultan","stepMatchArguments":[{"group":{"start":27,"value":"dashboard konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":30,"gherkinStepLine":30,"keywordType":"Outcome","textWithKeyword":"Then dashboard konsultan menampilkan penolakan verifikasi beserta alasannya","stepMatchArguments":[]},{"pwStepLine":31,"gherkinStepLine":31,"keywordType":"Action","textWithKeyword":"When pengguna memilih pengaturan profil dari pemberitahuan penolakan","stepMatchArguments":[]},{"pwStepLine":32,"gherkinStepLine":32,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman pengaturan profil","stepMatchArguments":[{"group":{"start":30,"value":"pengaturan profil"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":35,"pickleLine":35,"tags":["@sit","@dashboard-konsultan","@CDB-005","@precondition:login-konsultan"],"steps":[{"pwStepLine":36,"gherkinStepLine":36,"keywordType":"Context","textWithKeyword":"Given layanan statistik konsultan sedang mengalami gangguan","stepMatchArguments":[{"group":{"start":8,"value":"statistik konsultan"},"parameterTypeName":"layanan"}]},{"pwStepLine":37,"gherkinStepLine":37,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman dashboard konsultan","stepMatchArguments":[{"group":{"start":25,"value":"dashboard konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":38,"gherkinStepLine":38,"keywordType":"Outcome","textWithKeyword":"Then dashboard konsultan tetap tampil dengan pendapatan nol","stepMatchArguments":[]},{"pwStepLine":39,"gherkinStepLine":39,"keywordType":"Outcome","textWithKeyword":"And halaman tidak mengalami galat","stepMatchArguments":[]}]},
]; // bdd-data-end
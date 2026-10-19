// Generated from: features\verifikasi-konsultan\verifikasi-konsultan.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Daftar verifikasi konsultan', () => {

  test('Jumlah pengajuan per status sama dengan isi database', { tag: ['@sit', '@verifikasi-konsultan', '@precondition:login-admin', '@VER-001', '@critical'] }, async ({ When, Then, page, verifikasiKonsultanPage, world }) => { 
    await When('pengguna membuka halaman verifikasi konsultan', null, { page, world }); 
    await Then('tab status menampilkan jumlah pengajuan sesuai database', null, { page, verifikasiKonsultanPage, world }); 
  });

  test('Pengajuan dapat disaring ke status pending', { tag: ['@sit', '@verifikasi-konsultan', '@precondition:login-admin', '@VER-002'] }, async ({ Given, When, Then, And, network, page, verifikasiKonsultanPage, world }) => { 
    await Given('konsultan baru baru saja mengajukan verifikasi', null, { page, world }); 
    await And('pengguna berada di halaman verifikasi konsultan', null, { page, world }); 
    await When('pengguna menyaring pengajuan yang masih pending', null, { page, verifikasiKonsultanPage, world }); 
    await Then('pengajuan konsultan baru tampil tanpa konsultan yang sudah terverifikasi', null, { page, verifikasiKonsultanPage, world }); 
    await And('daftar pengajuan diminta ke backend dengan status pending', null, { network, page, world }); 
  });

  test('Pengajuan dapat dicari berdasarkan nama', { tag: ['@sit', '@verifikasi-konsultan', '@precondition:login-admin', '@VER-003'] }, async ({ Given, When, Then, And, page, verifikasiKonsultanPage, world }) => { 
    await Given('konsultan baru baru saja mengajukan verifikasi', null, { page, world }); 
    await And('pengguna berada di halaman verifikasi konsultan', null, { page, world }); 
    await When('pengguna mencari pengajuan berdasarkan nama konsultan baru', null, { page, verifikasiKonsultanPage, world }); 
    await Then('hanya pengajuan konsultan baru yang tampil', null, { page, verifikasiKonsultanPage, world }); 
  });

  test('Pencarian pengajuan tanpa hasil menampilkan keadaan kosong', { tag: ['@sit', '@verifikasi-konsultan', '@precondition:login-admin', '@VER-003'] }, async ({ Given, When, Then, page, verifikasiKonsultanPage, world }) => { 
    await Given('pengguna berada di halaman verifikasi konsultan', null, { page, world }); 
    await When('pengguna mencari pengajuan dengan kata yang tidak cocok', null, { page, verifikasiKonsultanPage, world }); 
    await Then('daftar pengajuan menampilkan keadaan kosong', null, { page, verifikasiKonsultanPage, world }); 
  });

  test('Pengajuan tanpa nama lengkap tidak merusak daftar', { tag: ['@sit', '@verifikasi-konsultan', '@precondition:login-admin', '@VER-009', '@stub'] }, async ({ Given, When, Then, And, network, page, pageErrors, verifikasiKonsultanPage, world }) => { 
    await Given('daftar pengajuan berisi konsultan tanpa nama lengkap', null, { network, page, world }); 
    await When('pengguna membuka halaman verifikasi konsultan', null, { page, world }); 
    await Then('pengajuan lain tetap tampil di daftar', null, { page, verifikasiKonsultanPage, world }); 
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
  $uri: [({}, use) => use('features\\verifikasi-konsultan\\verifikasi-konsultan.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":6,"tags":["@sit","@verifikasi-konsultan","@precondition:login-admin","@VER-001","@critical"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman verifikasi konsultan","stepMatchArguments":[{"group":{"start":25,"value":"verifikasi konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Outcome","textWithKeyword":"Then tab status menampilkan jumlah pengajuan sesuai database","stepMatchArguments":[]}]},
  {"pwTestLine":11,"pickleLine":11,"tags":["@sit","@verifikasi-konsultan","@precondition:login-admin","@VER-002"],"steps":[{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Context","textWithKeyword":"Given konsultan baru baru saja mengajukan verifikasi","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman verifikasi konsultan","stepMatchArguments":[{"group":{"start":27,"value":"verifikasi konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Action","textWithKeyword":"When pengguna menyaring pengajuan yang masih pending","stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"Then pengajuan konsultan baru tampil tanpa konsultan yang sudah terverifikasi","stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":16,"keywordType":"Outcome","textWithKeyword":"And daftar pengajuan diminta ke backend dengan status pending","stepMatchArguments":[]}]},
  {"pwTestLine":19,"pickleLine":19,"tags":["@sit","@verifikasi-konsultan","@precondition:login-admin","@VER-003"],"steps":[{"pwStepLine":20,"gherkinStepLine":20,"keywordType":"Context","textWithKeyword":"Given konsultan baru baru saja mengajukan verifikasi","stepMatchArguments":[]},{"pwStepLine":21,"gherkinStepLine":21,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman verifikasi konsultan","stepMatchArguments":[{"group":{"start":27,"value":"verifikasi konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":22,"gherkinStepLine":22,"keywordType":"Action","textWithKeyword":"When pengguna mencari pengajuan berdasarkan nama konsultan baru","stepMatchArguments":[]},{"pwStepLine":23,"gherkinStepLine":23,"keywordType":"Outcome","textWithKeyword":"Then hanya pengajuan konsultan baru yang tampil","stepMatchArguments":[]}]},
  {"pwTestLine":26,"pickleLine":26,"tags":["@sit","@verifikasi-konsultan","@precondition:login-admin","@VER-003"],"steps":[{"pwStepLine":27,"gherkinStepLine":27,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman verifikasi konsultan","stepMatchArguments":[{"group":{"start":27,"value":"verifikasi konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":28,"gherkinStepLine":28,"keywordType":"Action","textWithKeyword":"When pengguna mencari pengajuan dengan kata yang tidak cocok","stepMatchArguments":[]},{"pwStepLine":29,"gherkinStepLine":29,"keywordType":"Outcome","textWithKeyword":"Then daftar pengajuan menampilkan keadaan kosong","stepMatchArguments":[]}]},
  {"pwTestLine":32,"pickleLine":32,"tags":["@sit","@verifikasi-konsultan","@precondition:login-admin","@VER-009","@stub"],"steps":[{"pwStepLine":33,"gherkinStepLine":33,"keywordType":"Context","textWithKeyword":"Given daftar pengajuan berisi konsultan tanpa nama lengkap","stepMatchArguments":[]},{"pwStepLine":34,"gherkinStepLine":34,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman verifikasi konsultan","stepMatchArguments":[{"group":{"start":25,"value":"verifikasi konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":35,"gherkinStepLine":35,"keywordType":"Outcome","textWithKeyword":"Then pengajuan lain tetap tampil di daftar","stepMatchArguments":[]},{"pwStepLine":36,"gherkinStepLine":36,"keywordType":"Outcome","textWithKeyword":"And halaman tidak mengalami galat","stepMatchArguments":[]}]},
]; // bdd-data-end
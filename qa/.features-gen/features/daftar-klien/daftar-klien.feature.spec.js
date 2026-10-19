// Generated from: features\daftar-klien\daftar-klien.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Daftar klien konsultan', () => {

  test('Klien aktif dapat diurutkan menurut pengajuan dan jadwal', { tag: ['@sit', '@daftar-klien', '@precondition:login-konsultan', '@CLT-001'] }, async ({ Given, When, Then, daftarKlienPage, page, world }) => { 
    await Given('konsultan uji punya beberapa klien aktif', null, { page, world }); 
    await When('pengguna membuka halaman daftar klien', null, { page, world }); 
    await Then('daftar klien menampilkan jumlah klien aktif dengan pengajuan terbaru di atas', null, { daftarKlienPage, page, world }); 
    await When('pengguna mengurutkan klien dari pengajuan terlama', null, { daftarKlienPage, page, world }); 
    await Then('daftar klien tersusun dari pengajuan terlama', null, { daftarKlienPage, page, world }); 
    await When('pengguna mengurutkan klien dari jadwal paling dekat', null, { daftarKlienPage, page, world }); 
    await Then('daftar klien tersusun dari jadwal paling dekat', null, { daftarKlienPage, page, world }); 
  });

  test('Konsultan tanpa klien aktif melihat daftar kosong', { tag: ['@sit', '@daftar-klien', '@precondition:login-konsultan', '@CLT-002'] }, async ({ Given, When, Then, daftarKlienPage, page, world }) => { 
    await Given('klien belum punya konsultasi', null, { page, world }); 
    await When('pengguna membuka halaman daftar klien', null, { page, world }); 
    await Then('daftar klien menampilkan keadaan kosong', null, { daftarKlienPage, page, world }); 
  });

  test('Gangguan saat memuat daftar klien diberitahukan ke konsultan', { tag: ['@sit', '@daftar-klien', '@precondition:login-konsultan', '@CLT-002'] }, async ({ Given, When, Then, daftarKlienPage, network, page, world }) => { 
    await Given('layanan klien aktif konsultan sedang mengalami gangguan', null, { network, page, world }); 
    await When('pengguna membuka halaman daftar klien', null, { page, world }); 
    await Then('daftar klien menampilkan pesan gagal memuat', null, { daftarKlienPage, page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\daftar-klien\\daftar-klien.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":6,"tags":["@sit","@daftar-klien","@precondition:login-konsultan","@CLT-001"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given konsultan uji punya beberapa klien aktif","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman daftar klien","stepMatchArguments":[{"group":{"start":25,"value":"daftar klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":9,"gherkinStepLine":9,"keywordType":"Outcome","textWithKeyword":"Then daftar klien menampilkan jumlah klien aktif dengan pengajuan terbaru di atas","stepMatchArguments":[]},{"pwStepLine":10,"gherkinStepLine":10,"keywordType":"Action","textWithKeyword":"When pengguna mengurutkan klien dari pengajuan terlama","stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":11,"keywordType":"Outcome","textWithKeyword":"Then daftar klien tersusun dari pengajuan terlama","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Action","textWithKeyword":"When pengguna mengurutkan klien dari jadwal paling dekat","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"Then daftar klien tersusun dari jadwal paling dekat","stepMatchArguments":[]}]},
  {"pwTestLine":16,"pickleLine":16,"tags":["@sit","@daftar-klien","@precondition:login-konsultan","@CLT-002"],"steps":[{"pwStepLine":17,"gherkinStepLine":17,"keywordType":"Context","textWithKeyword":"Given klien belum punya konsultasi","stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman daftar klien","stepMatchArguments":[{"group":{"start":25,"value":"daftar klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":19,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then daftar klien menampilkan keadaan kosong","stepMatchArguments":[]}]},
  {"pwTestLine":22,"pickleLine":22,"tags":["@sit","@daftar-klien","@precondition:login-konsultan","@CLT-002"],"steps":[{"pwStepLine":23,"gherkinStepLine":23,"keywordType":"Context","textWithKeyword":"Given layanan klien aktif konsultan sedang mengalami gangguan","stepMatchArguments":[{"group":{"start":8,"value":"klien aktif konsultan"},"parameterTypeName":"layanan"}]},{"pwStepLine":24,"gherkinStepLine":24,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman daftar klien","stepMatchArguments":[{"group":{"start":25,"value":"daftar klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":25,"gherkinStepLine":25,"keywordType":"Outcome","textWithKeyword":"Then daftar klien menampilkan pesan gagal memuat","stepMatchArguments":[]}]},
]; // bdd-data-end
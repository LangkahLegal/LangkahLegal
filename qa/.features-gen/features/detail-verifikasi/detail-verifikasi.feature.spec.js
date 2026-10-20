// Generated from: features\detail-verifikasi\detail-verifikasi.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Keputusan verifikasi konsultan', () => {

  test('Admin menyetujui verifikasi konsultan', { tag: ['@sit', '@detail-verifikasi', '@precondition:login-admin', '@VER-004', '@critical'] }, async ({ Given, When, Then, And, detailVerifikasiPage, page, world }) => { 
    await Given('konsultan baru baru saja mengajukan verifikasi', null, { page, world }); 
    await And('pengguna berada di halaman verifikasi konsultan baru', null, { page, world }); 
    await Then('data pengajuan konsultan baru tampil lengkap', null, { page, world }); 
    await When('pengguna menyetujui verifikasi konsultan itu', null, { detailVerifikasiPage, page, world }); 
    await Then('pengguna diarahkan ke halaman verifikasi konsultan', null, { page, world }); 
    await And('konsultan baru tersimpan sebagai terverifikasi', null, { page, world }); 
  });

  test('Penolakan verifikasi tidak bisa dikirim tanpa alasan', { tag: ['@sit', '@detail-verifikasi', '@precondition:login-admin', '@VER-005'] }, async ({ Given, When, Then, And, detailVerifikasiPage, page, world }) => { 
    await Given('konsultan baru baru saja mengajukan verifikasi', null, { page, world }); 
    await And('pengguna berada di halaman verifikasi konsultan baru', null, { page, world }); 
    await When('pengguna hendak menolak verifikasi tanpa menulis alasan', null, { detailVerifikasiPage, page, world }); 
    await Then('penolakan belum dapat dikirim', null, { detailVerifikasiPage, page, world }); 
  });

  test('Admin menolak verifikasi konsultan dengan alasan', { tag: ['@sit', '@detail-verifikasi', '@precondition:login-admin', '@VER-005'] }, async ({ Given, When, Then, And, detailVerifikasiPage, page, world }) => { 
    await Given('konsultan baru baru saja mengajukan verifikasi', null, { page, world }); 
    await And('pengguna berada di halaman verifikasi konsultan baru', null, { page, world }); 
    await When('pengguna menolak verifikasi konsultan itu dengan sebuah alasan', null, { detailVerifikasiPage, page, world }); 
    await Then('pengguna diarahkan ke halaman verifikasi konsultan', null, { page, world }); 
    await And('konsultan baru tersimpan sebagai ditolak beserta alasannya', null, { page, world }); 
  });

  test('Konsultan yang sudah terverifikasi tidak bisa diputuskan ulang', { tag: ['@sit', '@detail-verifikasi', '@precondition:login-admin', '@VER-006'] }, async ({ When, Then, detailVerifikasiPage, page, world }) => { 
    await When('pengguna membuka halaman verifikasi konsultan uji', null, { page, world }); 
    await Then('data konsultan uji tampil tanpa pilihan terima atau tolak', null, { detailVerifikasiPage, page, world }); 
  });

  test('Pengajuan yang tidak ada diberitahukan ke admin', { tag: ['@sit', '@detail-verifikasi', '@precondition:login-admin', '@VER-007'] }, async ({ When, Then, detailVerifikasiPage, page, world }) => { 
    await When('pengguna membuka halaman verifikasi konsultan yang tidak ada', null, { page, world }); 
    await Then('halaman verifikasi menampilkan pesan data tidak ditemukan', null, { detailVerifikasiPage, page, world }); 
  });

  test('Kegagalan menyimpan keputusan diberitahukan ke admin', { tag: ['@sit', '@detail-verifikasi', '@precondition:login-admin', '@VER-008'] }, async ({ Given, When, Then, And, detailVerifikasiPage, dialogs, network, page, world }) => { 
    await Given('konsultan baru baru saja mengajukan verifikasi', null, { page, world }); 
    await And('layanan keputusan verifikasi sedang mengalami gangguan', null, { network, page, world }); 
    await And('pengguna berada di halaman verifikasi konsultan baru', null, { page, world }); 
    await When('pengguna menyetujui verifikasi konsultan itu', null, { detailVerifikasiPage, page, world }); 
    await Then('admin diberi tahu bahwa keputusan gagal disimpan', null, { dialogs, page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\detail-verifikasi\\detail-verifikasi.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":6,"tags":["@sit","@detail-verifikasi","@precondition:login-admin","@VER-004","@critical"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given konsultan baru baru saja mengajukan verifikasi","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman verifikasi konsultan baru","stepMatchArguments":[{"group":{"start":27,"value":"verifikasi konsultan baru"},"parameterTypeName":"halaman"}]},{"pwStepLine":9,"gherkinStepLine":9,"keywordType":"Outcome","textWithKeyword":"Then data pengajuan konsultan baru tampil lengkap","stepMatchArguments":[]},{"pwStepLine":10,"gherkinStepLine":10,"keywordType":"Action","textWithKeyword":"When pengguna menyetujui verifikasi konsultan itu","stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":11,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman verifikasi konsultan","stepMatchArguments":[{"group":{"start":30,"value":"verifikasi konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"And konsultan baru tersimpan sebagai terverifikasi","stepMatchArguments":[]}]},
  {"pwTestLine":15,"pickleLine":15,"tags":["@sit","@detail-verifikasi","@precondition:login-admin","@VER-005"],"steps":[{"pwStepLine":16,"gherkinStepLine":16,"keywordType":"Context","textWithKeyword":"Given konsultan baru baru saja mengajukan verifikasi","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":17,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman verifikasi konsultan baru","stepMatchArguments":[{"group":{"start":27,"value":"verifikasi konsultan baru"},"parameterTypeName":"halaman"}]},{"pwStepLine":18,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"When pengguna hendak menolak verifikasi tanpa menulis alasan","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then penolakan belum dapat dikirim","stepMatchArguments":[]}]},
  {"pwTestLine":22,"pickleLine":22,"tags":["@sit","@detail-verifikasi","@precondition:login-admin","@VER-005"],"steps":[{"pwStepLine":23,"gherkinStepLine":23,"keywordType":"Context","textWithKeyword":"Given konsultan baru baru saja mengajukan verifikasi","stepMatchArguments":[]},{"pwStepLine":24,"gherkinStepLine":24,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman verifikasi konsultan baru","stepMatchArguments":[{"group":{"start":27,"value":"verifikasi konsultan baru"},"parameterTypeName":"halaman"}]},{"pwStepLine":25,"gherkinStepLine":25,"keywordType":"Action","textWithKeyword":"When pengguna menolak verifikasi konsultan itu dengan sebuah alasan","stepMatchArguments":[]},{"pwStepLine":26,"gherkinStepLine":26,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman verifikasi konsultan","stepMatchArguments":[{"group":{"start":30,"value":"verifikasi konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":27,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"And konsultan baru tersimpan sebagai ditolak beserta alasannya","stepMatchArguments":[]}]},
  {"pwTestLine":30,"pickleLine":30,"tags":["@sit","@detail-verifikasi","@precondition:login-admin","@VER-006"],"steps":[{"pwStepLine":31,"gherkinStepLine":31,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman verifikasi konsultan uji","stepMatchArguments":[{"group":{"start":25,"value":"verifikasi konsultan uji"},"parameterTypeName":"halaman"}]},{"pwStepLine":32,"gherkinStepLine":32,"keywordType":"Outcome","textWithKeyword":"Then data konsultan uji tampil tanpa pilihan terima atau tolak","stepMatchArguments":[]}]},
  {"pwTestLine":35,"pickleLine":35,"tags":["@sit","@detail-verifikasi","@precondition:login-admin","@VER-007"],"steps":[{"pwStepLine":36,"gherkinStepLine":36,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman verifikasi konsultan yang tidak ada","stepMatchArguments":[{"group":{"start":25,"value":"verifikasi konsultan yang tidak ada"},"parameterTypeName":"halaman"}]},{"pwStepLine":37,"gherkinStepLine":37,"keywordType":"Outcome","textWithKeyword":"Then halaman verifikasi menampilkan pesan data tidak ditemukan","stepMatchArguments":[]}]},
  {"pwTestLine":40,"pickleLine":40,"tags":["@sit","@detail-verifikasi","@precondition:login-admin","@VER-008"],"steps":[{"pwStepLine":41,"gherkinStepLine":41,"keywordType":"Context","textWithKeyword":"Given konsultan baru baru saja mengajukan verifikasi","stepMatchArguments":[]},{"pwStepLine":42,"gherkinStepLine":42,"keywordType":"Context","textWithKeyword":"And layanan keputusan verifikasi sedang mengalami gangguan","stepMatchArguments":[{"group":{"start":8,"value":"keputusan verifikasi"},"parameterTypeName":"layanan"}]},{"pwStepLine":43,"gherkinStepLine":43,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman verifikasi konsultan baru","stepMatchArguments":[{"group":{"start":27,"value":"verifikasi konsultan baru"},"parameterTypeName":"halaman"}]},{"pwStepLine":44,"gherkinStepLine":44,"keywordType":"Action","textWithKeyword":"When pengguna menyetujui verifikasi konsultan itu","stepMatchArguments":[]},{"pwStepLine":45,"gherkinStepLine":45,"keywordType":"Outcome","textWithKeyword":"Then admin diberi tahu bahwa keputusan gagal disimpan","stepMatchArguments":[]}]},
]; // bdd-data-end
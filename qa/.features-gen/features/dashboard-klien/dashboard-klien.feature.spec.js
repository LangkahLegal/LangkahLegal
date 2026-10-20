// Generated from: features\dashboard-klien\dashboard-klien.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Dashboard klien', () => {

  test('Klien tanpa konsultasi melihat sapaan dan layanan unggulan', { tag: ['@sit', '@dashboard-klien', '@precondition:login-klien', '@CLI-001', '@critical', '@mobile'] }, async ({ Given, When, Then, And, dashboardKlienPage, page, pageErrors, world }) => { 
    await Given('klien belum punya konsultasi', null, { page, world }); 
    await When('pengguna membuka halaman dashboard klien', null, { page, world }); 
    await Then('dashboard klien menampilkan sapaan, layanan unggulan, dan kartu konsultasi kosong', null, { dashboardKlienPage, page, world }); 
    await And('halaman tidak mengalami galat', null, { page, pageErrors, world }); 
  });

  test('Klien tanpa konsultasi mencari konsultan dari dashboard', { tag: ['@sit', '@dashboard-klien', '@precondition:login-klien', '@CLI-002'] }, async ({ Given, When, Then, And, dashboardKlienPage, page, world }) => { 
    await Given('klien belum punya konsultasi', null, { page, world }); 
    await And('pengguna berada di halaman dashboard klien', null, { page, world }); 
    await When('pengguna memilih cari konsultan', null, { dashboardKlienPage, page, world }); 
    await Then('pengguna diarahkan ke halaman katalog konsultan', null, { page, world }); 
  });

  test('Dashboard menampilkan pengajuan aktif, bukan konsultasi yang sudah selesai', { tag: ['@sit', '@dashboard-klien', '@precondition:login-klien', '@CLI-003'] }, async ({ Given, When, Then, dashboardKlienPage, page, world }) => { 
    await Given('klien punya konsultasi selesai dan pengajuan baru yang masih pending', null, { page, world }); 
    await When('pengguna membuka halaman dashboard klien', null, { page, world }); 
    await Then('kartu konsultasi menampilkan konsultan uji dengan status pending', null, { dashboardKlienPage, page, world }); 
  });

  test('Klien membatalkan pengajuan yang masih pending', { tag: ['@sit', '@dashboard-klien', '@precondition:login-klien', '@CLI-004'] }, async ({ Given, When, Then, And, dashboardKlienPage, dialogs, page, world }) => { 
    await Given('klien punya konsultasi berstatus pending', null, { page, world }); 
    await And('pengguna berada di halaman dashboard klien', null, { page, world }); 
    await When('pengguna membatalkan konsultasi itu', null, { dashboardKlienPage, dialogs, page, world }); 
    await Then('muncul pemberitahuan "Konsultasi berhasil dibatalkan."', null, { dialogs, page, world }); 
    await And('konsultasi itu tersimpan dengan status dibatalkan', null, { page, world }); 
  });

  test('Klien mengurungkan pembatalan', { tag: ['@sit', '@dashboard-klien', '@precondition:login-klien', '@CLI-005'] }, async ({ Given, When, Then, And, dashboardKlienPage, dialogs, network, page, world }) => { 
    await Given('klien punya konsultasi berstatus pending', null, { page, world }); 
    await And('pengguna berada di halaman dashboard klien', null, { page, world }); 
    await When('pengguna mengurungkan pembatalan konsultasi itu', null, { dashboardKlienPage, dialogs, page, world }); 
    await Then('tidak ada permintaan ubah status konsultasi yang dikirim ke backend', null, { network, page, world }); 
    await And('konsultasi itu tersimpan dengan status pending', null, { page, world }); 
  });

  test('Klien melanjutkan ke pembayaran dari dashboard', { tag: ['@sit', '@dashboard-klien', '@precondition:login-klien', '@CLI-006'] }, async ({ Given, When, Then, And, dashboardKlienPage, page, world }) => { 
    await Given('klien punya konsultasi berstatus menunggu pembayaran', null, { page, world }); 
    await And('pengguna berada di halaman dashboard klien', null, { page, world }); 
    await When('pengguna memilih lanjut pembayaran', null, { dashboardKlienPage, page, world }); 
    await Then('pengguna diarahkan ke halaman pembayaran konsultasi itu', null, { page, world }); 
  });

  test('Konsultasi ditolak yang disembunyikan tetap tersembunyi', { tag: ['@sit', '@dashboard-klien', '@precondition:login-klien', '@CLI-007'] }, async ({ Given, When, Then, And, dashboardKlienPage, page, world }) => { 
    await Given('klien punya konsultasi berstatus ditolak', null, { page, world }); 
    await And('pengguna berada di halaman dashboard klien', null, { page, world }); 
    await When('pengguna menyembunyikan konsultasi yang ditolak itu', null, { dashboardKlienPage, page, world }); 
    await Then('kartu konsultasi kosong tampil', null, { dashboardKlienPage, page, world }); 
    await When('pengguna memuat ulang halaman', null, { page, world }); 
    await Then('kartu konsultasi kosong tampil', null, { dashboardKlienPage, page, world }); 
  });

  test('Data tersimpan yang rusak di browser tidak merusak dashboard', { tag: ['@sit', '@dashboard-klien', '@precondition:login-klien', '@CLI-008'] }, async ({ Given, When, Then, And, dashboardKlienPage, page, pageErrors, world }) => { 
    await Given('klien punya konsultasi berstatus pending', null, { page, world }); 
    await And('daftar konsultasi tersembunyi di browser rusak', null, { page, world }); 
    await When('pengguna membuka halaman dashboard klien', null, { page, world }); 
    await Then('kartu konsultasi menampilkan konsultan uji dengan status pending', null, { dashboardKlienPage, page, world }); 
    await And('halaman tidak mengalami galat', null, { page, pageErrors, world }); 
  });

  test('Gangguan saat memuat konsultasi diberitahukan ke klien', { tag: ['@sit', '@dashboard-klien', '@precondition:login-klien', '@CLI-009'] }, async ({ Given, When, Then, dashboardKlienPage, network, page, world }) => { 
    await Given('layanan daftar konsultasi sedang mengalami gangguan', null, { network, page, world }); 
    await When('pengguna membuka halaman dashboard klien', null, { page, world }); 
    await Then('dashboard klien menampilkan pesan gagal memuat', null, { dashboardKlienPage, page, world }); 
  });

  test('Klien menuju katalog konsultan dari layanan unggulan', { tag: ['@sit', '@dashboard-klien', '@precondition:login-klien', '@CLI-010'] }, async ({ Given, When, Then, dashboardKlienPage, page, world }) => { 
    await Given('pengguna berada di halaman dashboard klien', null, { page, world }); 
    await When('pengguna memilih layanan eksplorasi konsultan', null, { dashboardKlienPage, page, world }); 
    await Then('pengguna diarahkan ke halaman katalog konsultan', null, { page, world }); 
  });

  test('Klien menuju pengaturan dari dashboard', { tag: ['@sit', '@dashboard-klien', '@precondition:login-klien', '@CLI-010'] }, async ({ Given, When, Then, dashboardKlienPage, page, world }) => { 
    await Given('pengguna berada di halaman dashboard klien', null, { page, world }); 
    await When('pengguna memilih pengaturan di dashboard', null, { dashboardKlienPage, page, world }); 
    await Then('pengguna diarahkan ke halaman pengaturan', null, { page, world }); 
  });

  test('Klien berpindah ke riwayat lewat navigasi bawah', { tag: ['@sit', '@dashboard-klien', '@precondition:login-klien', '@CLI-011', '@mobile', '@khusus-mobile'] }, async ({ Given, When, Then, dashboardKlienPage, page, world }) => { 
    await Given('pengguna berada di halaman dashboard klien', null, { page, world }); 
    await When('pengguna memilih riwayat di navigasi bawah', null, { dashboardKlienPage, page, world }); 
    await Then('pengguna diarahkan ke halaman riwayat klien', null, { page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\dashboard-klien\\dashboard-klien.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":6,"tags":["@sit","@dashboard-klien","@precondition:login-klien","@CLI-001","@critical","@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given klien belum punya konsultasi","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman dashboard klien","stepMatchArguments":[{"group":{"start":25,"value":"dashboard klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":9,"gherkinStepLine":9,"keywordType":"Outcome","textWithKeyword":"Then dashboard klien menampilkan sapaan, layanan unggulan, dan kartu konsultasi kosong","stepMatchArguments":[]},{"pwStepLine":10,"gherkinStepLine":10,"keywordType":"Outcome","textWithKeyword":"And halaman tidak mengalami galat","stepMatchArguments":[]}]},
  {"pwTestLine":13,"pickleLine":13,"tags":["@sit","@dashboard-klien","@precondition:login-klien","@CLI-002"],"steps":[{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Context","textWithKeyword":"Given klien belum punya konsultasi","stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman dashboard klien","stepMatchArguments":[{"group":{"start":27,"value":"dashboard klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":16,"gherkinStepLine":16,"keywordType":"Action","textWithKeyword":"When pengguna memilih cari konsultan","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman katalog konsultan","stepMatchArguments":[{"group":{"start":30,"value":"katalog konsultan"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":20,"pickleLine":20,"tags":["@sit","@dashboard-klien","@precondition:login-klien","@CLI-003"],"steps":[{"pwStepLine":21,"gherkinStepLine":21,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi selesai dan pengajuan baru yang masih pending","stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":22,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman dashboard klien","stepMatchArguments":[{"group":{"start":25,"value":"dashboard klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":23,"gherkinStepLine":23,"keywordType":"Outcome","textWithKeyword":"Then kartu konsultasi menampilkan konsultan uji dengan status pending","stepMatchArguments":[{"group":{"start":57,"value":"pending"},"parameterTypeName":"statusKonsultasi"}]}]},
  {"pwTestLine":26,"pickleLine":26,"tags":["@sit","@dashboard-klien","@precondition:login-klien","@CLI-004"],"steps":[{"pwStepLine":27,"gherkinStepLine":27,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus pending","stepMatchArguments":[{"group":{"start":33,"value":"pending"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":28,"gherkinStepLine":28,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman dashboard klien","stepMatchArguments":[{"group":{"start":27,"value":"dashboard klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":29,"gherkinStepLine":29,"keywordType":"Action","textWithKeyword":"When pengguna membatalkan konsultasi itu","stepMatchArguments":[]},{"pwStepLine":30,"gherkinStepLine":30,"keywordType":"Outcome","textWithKeyword":"Then muncul pemberitahuan \"Konsultasi berhasil dibatalkan.\"","stepMatchArguments":[{"group":{"start":21,"value":"\"Konsultasi berhasil dibatalkan.\"","children":[{"start":22,"value":"Konsultasi berhasil dibatalkan.","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":31,"gherkinStepLine":31,"keywordType":"Outcome","textWithKeyword":"And konsultasi itu tersimpan dengan status dibatalkan","stepMatchArguments":[{"group":{"start":39,"value":"dibatalkan"},"parameterTypeName":"statusKonsultasi"}]}]},
  {"pwTestLine":34,"pickleLine":34,"tags":["@sit","@dashboard-klien","@precondition:login-klien","@CLI-005"],"steps":[{"pwStepLine":35,"gherkinStepLine":35,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus pending","stepMatchArguments":[{"group":{"start":33,"value":"pending"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":36,"gherkinStepLine":36,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman dashboard klien","stepMatchArguments":[{"group":{"start":27,"value":"dashboard klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":37,"gherkinStepLine":37,"keywordType":"Action","textWithKeyword":"When pengguna mengurungkan pembatalan konsultasi itu","stepMatchArguments":[]},{"pwStepLine":38,"gherkinStepLine":38,"keywordType":"Outcome","textWithKeyword":"Then tidak ada permintaan ubah status konsultasi yang dikirim ke backend","stepMatchArguments":[{"group":{"start":21,"value":"ubah status konsultasi"},"parameterTypeName":"layanan"}]},{"pwStepLine":39,"gherkinStepLine":39,"keywordType":"Outcome","textWithKeyword":"And konsultasi itu tersimpan dengan status pending","stepMatchArguments":[{"group":{"start":39,"value":"pending"},"parameterTypeName":"statusKonsultasi"}]}]},
  {"pwTestLine":42,"pickleLine":42,"tags":["@sit","@dashboard-klien","@precondition:login-klien","@CLI-006"],"steps":[{"pwStepLine":43,"gherkinStepLine":43,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus menunggu pembayaran","stepMatchArguments":[{"group":{"start":33,"value":"menunggu pembayaran"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":44,"gherkinStepLine":44,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman dashboard klien","stepMatchArguments":[{"group":{"start":27,"value":"dashboard klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":45,"gherkinStepLine":45,"keywordType":"Action","textWithKeyword":"When pengguna memilih lanjut pembayaran","stepMatchArguments":[]},{"pwStepLine":46,"gherkinStepLine":46,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman pembayaran konsultasi itu","stepMatchArguments":[{"group":{"start":30,"value":"pembayaran konsultasi itu"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":49,"pickleLine":49,"tags":["@sit","@dashboard-klien","@precondition:login-klien","@CLI-007"],"steps":[{"pwStepLine":50,"gherkinStepLine":50,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus ditolak","stepMatchArguments":[{"group":{"start":33,"value":"ditolak"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":51,"gherkinStepLine":51,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman dashboard klien","stepMatchArguments":[{"group":{"start":27,"value":"dashboard klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":52,"gherkinStepLine":52,"keywordType":"Action","textWithKeyword":"When pengguna menyembunyikan konsultasi yang ditolak itu","stepMatchArguments":[]},{"pwStepLine":53,"gherkinStepLine":53,"keywordType":"Outcome","textWithKeyword":"Then kartu konsultasi kosong tampil","stepMatchArguments":[]},{"pwStepLine":54,"gherkinStepLine":54,"keywordType":"Action","textWithKeyword":"When pengguna memuat ulang halaman","stepMatchArguments":[]},{"pwStepLine":55,"gherkinStepLine":55,"keywordType":"Outcome","textWithKeyword":"Then kartu konsultasi kosong tampil","stepMatchArguments":[]}]},
  {"pwTestLine":58,"pickleLine":58,"tags":["@sit","@dashboard-klien","@precondition:login-klien","@CLI-008"],"steps":[{"pwStepLine":59,"gherkinStepLine":59,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus pending","stepMatchArguments":[{"group":{"start":33,"value":"pending"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":60,"gherkinStepLine":60,"keywordType":"Context","textWithKeyword":"And daftar konsultasi tersembunyi di browser rusak","stepMatchArguments":[]},{"pwStepLine":61,"gherkinStepLine":61,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman dashboard klien","stepMatchArguments":[{"group":{"start":25,"value":"dashboard klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":62,"gherkinStepLine":62,"keywordType":"Outcome","textWithKeyword":"Then kartu konsultasi menampilkan konsultan uji dengan status pending","stepMatchArguments":[{"group":{"start":57,"value":"pending"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":63,"gherkinStepLine":63,"keywordType":"Outcome","textWithKeyword":"And halaman tidak mengalami galat","stepMatchArguments":[]}]},
  {"pwTestLine":66,"pickleLine":66,"tags":["@sit","@dashboard-klien","@precondition:login-klien","@CLI-009"],"steps":[{"pwStepLine":67,"gherkinStepLine":67,"keywordType":"Context","textWithKeyword":"Given layanan daftar konsultasi sedang mengalami gangguan","stepMatchArguments":[{"group":{"start":8,"value":"daftar konsultasi"},"parameterTypeName":"layanan"}]},{"pwStepLine":68,"gherkinStepLine":68,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman dashboard klien","stepMatchArguments":[{"group":{"start":25,"value":"dashboard klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":69,"gherkinStepLine":69,"keywordType":"Outcome","textWithKeyword":"Then dashboard klien menampilkan pesan gagal memuat","stepMatchArguments":[]}]},
  {"pwTestLine":72,"pickleLine":72,"tags":["@sit","@dashboard-klien","@precondition:login-klien","@CLI-010"],"steps":[{"pwStepLine":73,"gherkinStepLine":73,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman dashboard klien","stepMatchArguments":[{"group":{"start":27,"value":"dashboard klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":74,"gherkinStepLine":74,"keywordType":"Action","textWithKeyword":"When pengguna memilih layanan eksplorasi konsultan","stepMatchArguments":[]},{"pwStepLine":75,"gherkinStepLine":75,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman katalog konsultan","stepMatchArguments":[{"group":{"start":30,"value":"katalog konsultan"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":78,"pickleLine":78,"tags":["@sit","@dashboard-klien","@precondition:login-klien","@CLI-010"],"steps":[{"pwStepLine":79,"gherkinStepLine":79,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman dashboard klien","stepMatchArguments":[{"group":{"start":27,"value":"dashboard klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":80,"gherkinStepLine":80,"keywordType":"Action","textWithKeyword":"When pengguna memilih pengaturan di dashboard","stepMatchArguments":[]},{"pwStepLine":81,"gherkinStepLine":81,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman pengaturan","stepMatchArguments":[{"group":{"start":30,"value":"pengaturan"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":84,"pickleLine":84,"tags":["@sit","@dashboard-klien","@precondition:login-klien","@CLI-011","@mobile","@khusus-mobile"],"steps":[{"pwStepLine":85,"gherkinStepLine":85,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman dashboard klien","stepMatchArguments":[{"group":{"start":27,"value":"dashboard klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":86,"gherkinStepLine":86,"keywordType":"Action","textWithKeyword":"When pengguna memilih riwayat di navigasi bawah","stepMatchArguments":[]},{"pwStepLine":87,"gherkinStepLine":87,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman riwayat klien","stepMatchArguments":[{"group":{"start":30,"value":"riwayat klien"},"parameterTypeName":"halaman"}]}]},
]; // bdd-data-end
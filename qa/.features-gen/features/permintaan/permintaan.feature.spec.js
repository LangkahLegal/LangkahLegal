// Generated from: features\permintaan\permintaan.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Permintaan konsultasi', () => {

  test('Konsultan menerima permintaan klien', { tag: ['@sit', '@permintaan', '@precondition:login-konsultan', '@REQ-001', '@critical'] }, async ({ Given, When, Then, And, page, permintaanPage, world }) => { 
    await Given('klien punya konsultasi berstatus pending', null, { page, world }); 
    await And('konsultasi itu punya tautan Zoom dan dokumen pendukung', null, { page, world }); 
    await And('pengguna berada di halaman permintaan konsultasi itu', null, { page, world }); 
    await Then('permintaan menampilkan klien, deskripsi kasus, dan dokumennya', null, { page, world }); 
    await When('pengguna menerima permintaan itu', null, { page, permintaanPage, world }); 
    await Then('permintaan dikonfirmasi diterima', null, { page, world }); 
    await And('konsultasi itu tersimpan dengan status menunggu pembayaran', null, { page, world }); 
    await When('pengguna kembali ke dashboard dari konfirmasi permintaan', null, { page, permintaanPage, world }); 
    await Then('pengguna diarahkan ke halaman dashboard konsultan', null, { page, world }); 
  });

  test('Konsultan menolak permintaan klien', { tag: ['@sit', '@permintaan', '@precondition:login-konsultan', '@REQ-002'] }, async ({ Given, When, Then, And, page, permintaanPage, world }) => { 
    await Given('klien punya konsultasi berstatus pending', null, { page, world }); 
    await And('pengguna berada di halaman permintaan konsultasi itu', null, { page, world }); 
    await When('pengguna menolak permintaan itu', null, { page, permintaanPage, world }); 
    await Then('permintaan dikonfirmasi ditolak', null, { page, world }); 
    await And('konsultasi itu tersimpan dengan status ditolak', null, { page, world }); 
  });

  test('Permintaan yang sedang diproses tidak bisa diterima dua kali', { tag: ['@sit', '@permintaan', '@precondition:login-konsultan', '@REQ-003'] }, async ({ Given, When, Then, And, network, page, permintaanPage, world }) => { 
    await Given('klien punya konsultasi berstatus pending', null, { page, world }); 
    await And('layanan ubah status konsultasi merespons lambat', null, { network, page, world }); 
    await And('pengguna berada di halaman permintaan konsultasi itu', null, { page, world }); 
    await When('pengguna menerima permintaan itu lalu menekan tombol terima sekali lagi', null, { page, permintaanPage, world }); 
    await Then('permintaan dikonfirmasi diterima', null, { page, world }); 
    await And('hanya ada 1 permintaan ubah status konsultasi yang dikirim ke backend', null, { network, page, world }); 
  });

  test('Kegagalan memproses permintaan diberitahukan ke konsultan', { tag: ['@sit', '@permintaan', '@precondition:login-konsultan', '@REQ-004', '@stub'] }, async ({ Given, When, Then, And, dialogs, network, page, permintaanPage, world }) => { 
    await Given('klien punya konsultasi berstatus pending', null, { page, world }); 
    await And('layanan ubah status konsultasi menolak dengan pesan "Akses ditolak: Pengajuan ini bukan milik Anda"', null, { network, page, world }); 
    await And('pengguna berada di halaman permintaan konsultasi itu', null, { page, world }); 
    await When('pengguna menerima permintaan itu', null, { page, permintaanPage, world }); 
    await Then('muncul pemberitahuan "Gagal memproses permintaan."', null, { dialogs, page, world }); 
    await And('permintaan tetap terbuka untuk ditinjau', null, { page, permintaanPage, world }); 
  });

  test('Konsultan menjadwalkan kasus yang diambil dari bursa', { tag: ['@sit', '@permintaan', '@precondition:login-konsultan', '@REQ-005'] }, async ({ Given, When, Then, And, page, permintaanPage, world }) => { 
    await Given('konsultan uji mengambil kasus dari bursa dan punya jadwal praktik', null, { page, world }); 
    await And('pengguna berada di halaman permintaan konsultasi itu', null, { page, world }); 
    await Then('permintaan dari bursa belum bisa diterima sebelum dijadwalkan', null, { page, permintaanPage, world }); 
    await When('pengguna menjadwalkan kasus itu pada jadwal praktiknya', null, { page, permintaanPage, world }); 
    await Then('permintaan dikonfirmasi diterima dan dijadwalkan', null, { page, world }); 
    await And('jadwal kasus itu tersimpan sesuai pilihan konsultan', null, { page, world }); 
  });

  test('Kasus dari bursa tidak bisa dijadwalkan tanpa jadwal praktik', { tag: ['@sit', '@permintaan', '@precondition:login-konsultan', '@REQ-006'] }, async ({ Given, When, Then, And, page, permintaanPage, world }) => { 
    await Given('konsultan uji mengambil kasus dari bursa tanpa punya jadwal praktik', null, { page, world }); 
    await And('pengguna berada di halaman permintaan konsultasi itu', null, { page, world }); 
    await Then('permintaan menjelaskan bahwa belum ada jadwal praktik', null, { page, permintaanPage, world }); 
    await When('pengguna memilih menambah jadwal dari permintaan', null, { page, permintaanPage, world }); 
    await Then('pengguna diarahkan ke halaman jadwal', null, { page, world }); 
  });

  test('Permintaan yang tidak ada diberitahukan ke konsultan', { tag: ['@sit', '@permintaan', '@precondition:login-konsultan', '@REQ-007'] }, async ({ When, Then, page, permintaanPage, world }) => { 
    await When('pengguna membuka halaman permintaan yang tidak ada', null, { page, world }); 
    await Then('permintaan menampilkan pesan data tidak ditemukan', null, { page, permintaanPage, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\permintaan\\permintaan.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":6,"tags":["@sit","@permintaan","@precondition:login-konsultan","@REQ-001","@critical"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus pending","stepMatchArguments":[{"group":{"start":33,"value":"pending"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"And konsultasi itu punya tautan Zoom dan dokumen pendukung","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman permintaan konsultasi itu","stepMatchArguments":[{"group":{"start":27,"value":"permintaan konsultasi itu"},"parameterTypeName":"halaman"}]},{"pwStepLine":10,"gherkinStepLine":10,"keywordType":"Outcome","textWithKeyword":"Then permintaan menampilkan klien, deskripsi kasus, dan dokumennya","stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":11,"keywordType":"Action","textWithKeyword":"When pengguna menerima permintaan itu","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"Then permintaan dikonfirmasi diterima","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"And konsultasi itu tersimpan dengan status menunggu pembayaran","stepMatchArguments":[{"group":{"start":39,"value":"menunggu pembayaran"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Action","textWithKeyword":"When pengguna kembali ke dashboard dari konfirmasi permintaan","stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman dashboard konsultan","stepMatchArguments":[{"group":{"start":30,"value":"dashboard konsultan"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":18,"pickleLine":18,"tags":["@sit","@permintaan","@precondition:login-konsultan","@REQ-002"],"steps":[{"pwStepLine":19,"gherkinStepLine":19,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus pending","stepMatchArguments":[{"group":{"start":33,"value":"pending"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":20,"gherkinStepLine":20,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman permintaan konsultasi itu","stepMatchArguments":[{"group":{"start":27,"value":"permintaan konsultasi itu"},"parameterTypeName":"halaman"}]},{"pwStepLine":21,"gherkinStepLine":21,"keywordType":"Action","textWithKeyword":"When pengguna menolak permintaan itu","stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":22,"keywordType":"Outcome","textWithKeyword":"Then permintaan dikonfirmasi ditolak","stepMatchArguments":[]},{"pwStepLine":23,"gherkinStepLine":23,"keywordType":"Outcome","textWithKeyword":"And konsultasi itu tersimpan dengan status ditolak","stepMatchArguments":[{"group":{"start":39,"value":"ditolak"},"parameterTypeName":"statusKonsultasi"}]}]},
  {"pwTestLine":26,"pickleLine":26,"tags":["@sit","@permintaan","@precondition:login-konsultan","@REQ-003"],"steps":[{"pwStepLine":27,"gherkinStepLine":27,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus pending","stepMatchArguments":[{"group":{"start":33,"value":"pending"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":28,"gherkinStepLine":28,"keywordType":"Context","textWithKeyword":"And layanan ubah status konsultasi merespons lambat","stepMatchArguments":[{"group":{"start":8,"value":"ubah status konsultasi"},"parameterTypeName":"layanan"}]},{"pwStepLine":29,"gherkinStepLine":29,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman permintaan konsultasi itu","stepMatchArguments":[{"group":{"start":27,"value":"permintaan konsultasi itu"},"parameterTypeName":"halaman"}]},{"pwStepLine":30,"gherkinStepLine":30,"keywordType":"Action","textWithKeyword":"When pengguna menerima permintaan itu lalu menekan tombol terima sekali lagi","stepMatchArguments":[]},{"pwStepLine":31,"gherkinStepLine":31,"keywordType":"Outcome","textWithKeyword":"Then permintaan dikonfirmasi diterima","stepMatchArguments":[]},{"pwStepLine":32,"gherkinStepLine":32,"keywordType":"Outcome","textWithKeyword":"And hanya ada 1 permintaan ubah status konsultasi yang dikirim ke backend","stepMatchArguments":[{"group":{"start":10,"value":"1"},"parameterTypeName":"int"},{"group":{"start":23,"value":"ubah status konsultasi"},"parameterTypeName":"layanan"}]}]},
  {"pwTestLine":35,"pickleLine":35,"tags":["@sit","@permintaan","@precondition:login-konsultan","@REQ-004","@stub"],"steps":[{"pwStepLine":36,"gherkinStepLine":36,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus pending","stepMatchArguments":[{"group":{"start":33,"value":"pending"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":37,"gherkinStepLine":37,"keywordType":"Context","textWithKeyword":"And layanan ubah status konsultasi menolak dengan pesan \"Akses ditolak: Pengajuan ini bukan milik Anda\"","stepMatchArguments":[{"group":{"start":8,"value":"ubah status konsultasi"},"parameterTypeName":"layanan"},{"group":{"start":52,"value":"\"Akses ditolak: Pengajuan ini bukan milik Anda\"","children":[{"start":53,"value":"Akses ditolak: Pengajuan ini bukan milik Anda","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":38,"gherkinStepLine":38,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman permintaan konsultasi itu","stepMatchArguments":[{"group":{"start":27,"value":"permintaan konsultasi itu"},"parameterTypeName":"halaman"}]},{"pwStepLine":39,"gherkinStepLine":39,"keywordType":"Action","textWithKeyword":"When pengguna menerima permintaan itu","stepMatchArguments":[]},{"pwStepLine":40,"gherkinStepLine":40,"keywordType":"Outcome","textWithKeyword":"Then muncul pemberitahuan \"Gagal memproses permintaan.\"","stepMatchArguments":[{"group":{"start":21,"value":"\"Gagal memproses permintaan.\"","children":[{"start":22,"value":"Gagal memproses permintaan.","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":41,"gherkinStepLine":41,"keywordType":"Outcome","textWithKeyword":"And permintaan tetap terbuka untuk ditinjau","stepMatchArguments":[]}]},
  {"pwTestLine":44,"pickleLine":44,"tags":["@sit","@permintaan","@precondition:login-konsultan","@REQ-005"],"steps":[{"pwStepLine":45,"gherkinStepLine":45,"keywordType":"Context","textWithKeyword":"Given konsultan uji mengambil kasus dari bursa dan punya jadwal praktik","stepMatchArguments":[]},{"pwStepLine":46,"gherkinStepLine":46,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman permintaan konsultasi itu","stepMatchArguments":[{"group":{"start":27,"value":"permintaan konsultasi itu"},"parameterTypeName":"halaman"}]},{"pwStepLine":47,"gherkinStepLine":47,"keywordType":"Outcome","textWithKeyword":"Then permintaan dari bursa belum bisa diterima sebelum dijadwalkan","stepMatchArguments":[]},{"pwStepLine":48,"gherkinStepLine":48,"keywordType":"Action","textWithKeyword":"When pengguna menjadwalkan kasus itu pada jadwal praktiknya","stepMatchArguments":[]},{"pwStepLine":49,"gherkinStepLine":49,"keywordType":"Outcome","textWithKeyword":"Then permintaan dikonfirmasi diterima dan dijadwalkan","stepMatchArguments":[]},{"pwStepLine":50,"gherkinStepLine":50,"keywordType":"Outcome","textWithKeyword":"And jadwal kasus itu tersimpan sesuai pilihan konsultan","stepMatchArguments":[]}]},
  {"pwTestLine":53,"pickleLine":53,"tags":["@sit","@permintaan","@precondition:login-konsultan","@REQ-006"],"steps":[{"pwStepLine":54,"gherkinStepLine":54,"keywordType":"Context","textWithKeyword":"Given konsultan uji mengambil kasus dari bursa tanpa punya jadwal praktik","stepMatchArguments":[]},{"pwStepLine":55,"gherkinStepLine":55,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman permintaan konsultasi itu","stepMatchArguments":[{"group":{"start":27,"value":"permintaan konsultasi itu"},"parameterTypeName":"halaman"}]},{"pwStepLine":56,"gherkinStepLine":56,"keywordType":"Outcome","textWithKeyword":"Then permintaan menjelaskan bahwa belum ada jadwal praktik","stepMatchArguments":[]},{"pwStepLine":57,"gherkinStepLine":57,"keywordType":"Action","textWithKeyword":"When pengguna memilih menambah jadwal dari permintaan","stepMatchArguments":[]},{"pwStepLine":58,"gherkinStepLine":58,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman jadwal","stepMatchArguments":[{"group":{"start":30,"value":"jadwal"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":61,"pickleLine":61,"tags":["@sit","@permintaan","@precondition:login-konsultan","@REQ-007"],"steps":[{"pwStepLine":62,"gherkinStepLine":62,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman permintaan yang tidak ada","stepMatchArguments":[{"group":{"start":25,"value":"permintaan yang tidak ada"},"parameterTypeName":"halaman"}]},{"pwStepLine":63,"gherkinStepLine":63,"keywordType":"Outcome","textWithKeyword":"Then permintaan menampilkan pesan data tidak ditemukan","stepMatchArguments":[]}]},
]; // bdd-data-end
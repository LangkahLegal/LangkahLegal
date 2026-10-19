// Generated from: features\detail-konsultasi\detail-konsultasi.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Detail konsultasi', () => {

  test('Klien melihat detail sesi terjadwal dan bergabung lewat Zoom', { tag: ['@sit', '@detail-konsultasi', '@CON-001', '@critical', '@precondition:login-klien'] }, async ({ Given, When, Then, And, context, detailKonsultasiPage, page, world }) => { 
    await Given('klien punya konsultasi berstatus terjadwal', null, { page, world }); 
    await And('konsultasi itu punya tautan Zoom dan dokumen pendukung', null, { page, world }); 
    await And('pengguna berada di halaman detail konsultasi itu', null, { page, world }); 
    await Then('detail konsultasi menampilkan status, deskripsi kasus, dokumen, dan tautan Zoom', null, { detailKonsultasiPage, page, world }); 
    await When('pengguna bergabung ke sesi konsultasi', null, { context, detailKonsultasiPage, page, world }); 
    await Then('tautan Zoom terbuka di tab baru', null, { page, world }); 
  });

  test('Klien menyalin tautan Zoom', { tag: ['@sit', '@detail-konsultasi', '@CON-002', '@precondition:login-klien'] }, async ({ Given, When, Then, And, context, detailKonsultasiPage, page, world }) => { 
    await Given('klien punya konsultasi berstatus terjadwal', null, { page, world }); 
    await And('konsultasi itu punya tautan Zoom dan dokumen pendukung', null, { page, world }); 
    await And('pengguna berada di halaman detail konsultasi itu', null, { page, world }); 
    await When('pengguna menyalin tautan Zoom', null, { context, detailKonsultasiPage, page, world }); 
    await Then('tautan Zoom tersalin ke papan klip', null, { detailKonsultasiPage, page, world }); 
  });

  test('Klien menutup sesi dengan rating dan ulasan', { tag: ['@sit', '@detail-konsultasi', '@CON-003', '@precondition:login-klien'] }, async ({ Given, When, Then, And, detailKonsultasiPage, page, world }) => { 
    await Given('klien punya konsultasi berstatus terjadwal', null, { page, world }); 
    await And('pengguna berada di halaman detail konsultasi itu', null, { page, world }); 
    await When('pengguna memberi rating dan ulasan untuk sesi itu', null, { detailKonsultasiPage, page, world }); 
    await Then('formulir ulasan tertutup', null, { detailKonsultasiPage, page, world }); 
    await And('ulasan tersimpan di database untuk konsultasi itu', null, { page, world }); 
  });

  test('Ulasan tidak dapat dikirim sebelum rating dipilih', { tag: ['@sit', '@detail-konsultasi', '@CON-003', '@precondition:login-klien'] }, async ({ Given, When, Then, And, detailKonsultasiPage, page, world }) => { 
    await Given('klien punya konsultasi berstatus terjadwal', null, { page, world }); 
    await And('pengguna berada di halaman detail konsultasi itu', null, { page, world }); 
    await When('pengguna membuka formulir ulasan', null, { detailKonsultasiPage, page, world }); 
    await Then('ulasan belum dapat dikirim', null, { detailKonsultasiPage, page, world }); 
  });

  test('Ulasan dibatasi panjangnya', { tag: ['@sit', '@detail-konsultasi', '@CON-004', '@precondition:login-klien'] }, async ({ Given, When, Then, And, detailKonsultasiPage, page, world }) => { 
    await Given('klien punya konsultasi berstatus terjadwal', null, { page, world }); 
    await And('pengguna berada di halaman detail konsultasi itu', null, { page, world }); 
    await When('pengguna menulis ulasan yang melebihi batas panjang', null, { detailKonsultasiPage, page, world }); 
    await Then('ulasan dipotong sesuai batas panjangnya', null, { detailKonsultasiPage, page, world }); 
  });

  test('Ulasan kedua untuk sesi yang sama ditolak', { tag: ['@sit', '@detail-konsultasi', '@CON-005', '@precondition:login-klien'] }, async ({ Given, When, Then, And, detailKonsultasiPage, dialogs, page, world }) => { 
    await Given('klien punya konsultasi berstatus terjadwal', null, { page, world }); 
    await And('konsultasi itu sudah pernah diberi ulasan', null, { page, world }); 
    await And('pengguna berada di halaman detail konsultasi itu', null, { page, world }); 
    await When('pengguna memberi rating dan ulasan untuk sesi itu', null, { detailKonsultasiPage, page, world }); 
    await Then('muncul pemberitahuan "Anda sudah memberikan ulasan untuk sesi konsultasi ini."', null, { dialogs, page, world }); 
    await And('formulir ulasan tetap terbuka', null, { detailKonsultasiPage, page, world }); 
  });

  test('Konsultasi yang dibatalkan tidak menawarkan Zoom maupun ulasan', { tag: ['@sit', '@detail-konsultasi', '@CON-006', '@precondition:login-klien'] }, async ({ Given, When, Then, detailKonsultasiPage, page, world }) => { 
    await Given('klien punya konsultasi berstatus dibatalkan', null, { page, world }); 
    await When('pengguna membuka halaman detail konsultasi itu', null, { page, world }); 
    await Then('detail konsultasi menampilkan status dibatalkan tanpa Zoom dan ulasan', null, { detailKonsultasiPage, page, world }); 
  });

  test('Konsultasi yang tidak ada menampilkan gagal memuat', { tag: ['@sit', '@detail-konsultasi', '@CON-007', '@precondition:login-klien'] }, async ({ When, Then, detailKonsultasiPage, page, world }) => { 
    await When('pengguna membuka halaman detail konsultasi yang tidak ada', null, { page, world }); 
    await Then('detail konsultasi menampilkan gagal memuat dengan pilihan coba lagi', null, { detailKonsultasiPage, page, world }); 
  });

  test('Konsultan menambahkan tautan Zoom untuk sesi terjadwal', { tag: ['@sit', '@detail-konsultasi', '@CON-008', '@precondition:login-konsultan'] }, async ({ Given, When, Then, And, detailKonsultasiPage, page, world }) => { 
    await Given('klien punya konsultasi berstatus terjadwal', null, { page, world }); 
    await And('pengguna berada di halaman detail konsultasi itu', null, { page, world }); 
    await When('pengguna menyimpan tautan Zoom untuk sesi itu', null, { detailKonsultasiPage, page, world }); 
    await Then('tautan Zoom tersimpan di database untuk konsultasi itu', null, { detailKonsultasiPage, page, world }); 
  });

  test('Tautan Zoom yang bukan alamat web ditolak', { tag: ['@sit', '@detail-konsultasi', '@CON-009', '@precondition:login-konsultan'] }, async ({ Given, When, Then, And, detailKonsultasiPage, network, page, world }) => { 
    await Given('klien punya konsultasi berstatus terjadwal', null, { page, world }); 
    await And('pengguna berada di halaman detail konsultasi itu', null, { page, world }); 
    await When('pengguna menyimpan tautan Zoom yang bukan alamat web', null, { detailKonsultasiPage, page, world }); 
    await Then('tidak ada permintaan simpan tautan Zoom yang dikirim ke backend', null, { network, page, world }); 
  });

  test('Konsultan tidak ditawari ulasan dan dapat mengurungkan pengisian tautan', { tag: ['@sit', '@detail-konsultasi', '@CON-010', '@precondition:login-konsultan'] }, async ({ Given, When, Then, And, detailKonsultasiPage, page, world }) => { 
    await Given('klien punya konsultasi berstatus terjadwal', null, { page, world }); 
    await And('pengguna berada di halaman detail konsultasi itu', null, { page, world }); 
    await When('pengguna mengurungkan pengisian tautan Zoom', null, { detailKonsultasiPage, page, world }); 
    await Then('tautan Zoom tetap belum tersedia', null, { detailKonsultasiPage, page, world }); 
    await And('konsultan tidak ditawari memberi ulasan', null, { detailKonsultasiPage, page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\detail-konsultasi\\detail-konsultasi.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":6,"tags":["@sit","@detail-konsultasi","@CON-001","@critical","@precondition:login-klien"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus terjadwal","stepMatchArguments":[{"group":{"start":33,"value":"terjadwal"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"And konsultasi itu punya tautan Zoom dan dokumen pendukung","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman detail konsultasi itu","stepMatchArguments":[{"group":{"start":27,"value":"detail konsultasi itu"},"parameterTypeName":"halaman"}]},{"pwStepLine":10,"gherkinStepLine":10,"keywordType":"Outcome","textWithKeyword":"Then detail konsultasi menampilkan status, deskripsi kasus, dokumen, dan tautan Zoom","stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":11,"keywordType":"Action","textWithKeyword":"When pengguna bergabung ke sesi konsultasi","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"Then tautan Zoom terbuka di tab baru","stepMatchArguments":[]}]},
  {"pwTestLine":15,"pickleLine":15,"tags":["@sit","@detail-konsultasi","@CON-002","@precondition:login-klien"],"steps":[{"pwStepLine":16,"gherkinStepLine":16,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus terjadwal","stepMatchArguments":[{"group":{"start":33,"value":"terjadwal"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":17,"gherkinStepLine":17,"keywordType":"Context","textWithKeyword":"And konsultasi itu punya tautan Zoom dan dokumen pendukung","stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":18,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman detail konsultasi itu","stepMatchArguments":[{"group":{"start":27,"value":"detail konsultasi itu"},"parameterTypeName":"halaman"}]},{"pwStepLine":19,"gherkinStepLine":19,"keywordType":"Action","textWithKeyword":"When pengguna menyalin tautan Zoom","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"Then tautan Zoom tersalin ke papan klip","stepMatchArguments":[]}]},
  {"pwTestLine":23,"pickleLine":23,"tags":["@sit","@detail-konsultasi","@CON-003","@precondition:login-klien"],"steps":[{"pwStepLine":24,"gherkinStepLine":24,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus terjadwal","stepMatchArguments":[{"group":{"start":33,"value":"terjadwal"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":25,"gherkinStepLine":25,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman detail konsultasi itu","stepMatchArguments":[{"group":{"start":27,"value":"detail konsultasi itu"},"parameterTypeName":"halaman"}]},{"pwStepLine":26,"gherkinStepLine":26,"keywordType":"Action","textWithKeyword":"When pengguna memberi rating dan ulasan untuk sesi itu","stepMatchArguments":[]},{"pwStepLine":27,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"Then formulir ulasan tertutup","stepMatchArguments":[]},{"pwStepLine":28,"gherkinStepLine":28,"keywordType":"Outcome","textWithKeyword":"And ulasan tersimpan di database untuk konsultasi itu","stepMatchArguments":[]}]},
  {"pwTestLine":31,"pickleLine":31,"tags":["@sit","@detail-konsultasi","@CON-003","@precondition:login-klien"],"steps":[{"pwStepLine":32,"gherkinStepLine":32,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus terjadwal","stepMatchArguments":[{"group":{"start":33,"value":"terjadwal"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":33,"gherkinStepLine":33,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman detail konsultasi itu","stepMatchArguments":[{"group":{"start":27,"value":"detail konsultasi itu"},"parameterTypeName":"halaman"}]},{"pwStepLine":34,"gherkinStepLine":34,"keywordType":"Action","textWithKeyword":"When pengguna membuka formulir ulasan","stepMatchArguments":[]},{"pwStepLine":35,"gherkinStepLine":35,"keywordType":"Outcome","textWithKeyword":"Then ulasan belum dapat dikirim","stepMatchArguments":[]}]},
  {"pwTestLine":38,"pickleLine":38,"tags":["@sit","@detail-konsultasi","@CON-004","@precondition:login-klien"],"steps":[{"pwStepLine":39,"gherkinStepLine":39,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus terjadwal","stepMatchArguments":[{"group":{"start":33,"value":"terjadwal"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":40,"gherkinStepLine":40,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman detail konsultasi itu","stepMatchArguments":[{"group":{"start":27,"value":"detail konsultasi itu"},"parameterTypeName":"halaman"}]},{"pwStepLine":41,"gherkinStepLine":41,"keywordType":"Action","textWithKeyword":"When pengguna menulis ulasan yang melebihi batas panjang","stepMatchArguments":[]},{"pwStepLine":42,"gherkinStepLine":42,"keywordType":"Outcome","textWithKeyword":"Then ulasan dipotong sesuai batas panjangnya","stepMatchArguments":[]}]},
  {"pwTestLine":45,"pickleLine":45,"tags":["@sit","@detail-konsultasi","@CON-005","@precondition:login-klien"],"steps":[{"pwStepLine":46,"gherkinStepLine":46,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus terjadwal","stepMatchArguments":[{"group":{"start":33,"value":"terjadwal"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":47,"gherkinStepLine":47,"keywordType":"Context","textWithKeyword":"And konsultasi itu sudah pernah diberi ulasan","stepMatchArguments":[]},{"pwStepLine":48,"gherkinStepLine":48,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman detail konsultasi itu","stepMatchArguments":[{"group":{"start":27,"value":"detail konsultasi itu"},"parameterTypeName":"halaman"}]},{"pwStepLine":49,"gherkinStepLine":49,"keywordType":"Action","textWithKeyword":"When pengguna memberi rating dan ulasan untuk sesi itu","stepMatchArguments":[]},{"pwStepLine":50,"gherkinStepLine":50,"keywordType":"Outcome","textWithKeyword":"Then muncul pemberitahuan \"Anda sudah memberikan ulasan untuk sesi konsultasi ini.\"","stepMatchArguments":[{"group":{"start":21,"value":"\"Anda sudah memberikan ulasan untuk sesi konsultasi ini.\"","children":[{"start":22,"value":"Anda sudah memberikan ulasan untuk sesi konsultasi ini.","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":51,"gherkinStepLine":51,"keywordType":"Outcome","textWithKeyword":"And formulir ulasan tetap terbuka","stepMatchArguments":[]}]},
  {"pwTestLine":54,"pickleLine":54,"tags":["@sit","@detail-konsultasi","@CON-006","@precondition:login-klien"],"steps":[{"pwStepLine":55,"gherkinStepLine":55,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus dibatalkan","stepMatchArguments":[{"group":{"start":33,"value":"dibatalkan"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":56,"gherkinStepLine":56,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman detail konsultasi itu","stepMatchArguments":[{"group":{"start":25,"value":"detail konsultasi itu"},"parameterTypeName":"halaman"}]},{"pwStepLine":57,"gherkinStepLine":57,"keywordType":"Outcome","textWithKeyword":"Then detail konsultasi menampilkan status dibatalkan tanpa Zoom dan ulasan","stepMatchArguments":[]}]},
  {"pwTestLine":60,"pickleLine":60,"tags":["@sit","@detail-konsultasi","@CON-007","@precondition:login-klien"],"steps":[{"pwStepLine":61,"gherkinStepLine":61,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman detail konsultasi yang tidak ada","stepMatchArguments":[{"group":{"start":25,"value":"detail konsultasi yang tidak ada"},"parameterTypeName":"halaman"}]},{"pwStepLine":62,"gherkinStepLine":62,"keywordType":"Outcome","textWithKeyword":"Then detail konsultasi menampilkan gagal memuat dengan pilihan coba lagi","stepMatchArguments":[]}]},
  {"pwTestLine":65,"pickleLine":65,"tags":["@sit","@detail-konsultasi","@CON-008","@precondition:login-konsultan"],"steps":[{"pwStepLine":66,"gherkinStepLine":66,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus terjadwal","stepMatchArguments":[{"group":{"start":33,"value":"terjadwal"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":67,"gherkinStepLine":67,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman detail konsultasi itu","stepMatchArguments":[{"group":{"start":27,"value":"detail konsultasi itu"},"parameterTypeName":"halaman"}]},{"pwStepLine":68,"gherkinStepLine":68,"keywordType":"Action","textWithKeyword":"When pengguna menyimpan tautan Zoom untuk sesi itu","stepMatchArguments":[]},{"pwStepLine":69,"gherkinStepLine":69,"keywordType":"Outcome","textWithKeyword":"Then tautan Zoom tersimpan di database untuk konsultasi itu","stepMatchArguments":[]}]},
  {"pwTestLine":72,"pickleLine":72,"tags":["@sit","@detail-konsultasi","@CON-009","@precondition:login-konsultan"],"steps":[{"pwStepLine":73,"gherkinStepLine":73,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus terjadwal","stepMatchArguments":[{"group":{"start":33,"value":"terjadwal"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":74,"gherkinStepLine":74,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman detail konsultasi itu","stepMatchArguments":[{"group":{"start":27,"value":"detail konsultasi itu"},"parameterTypeName":"halaman"}]},{"pwStepLine":75,"gherkinStepLine":75,"keywordType":"Action","textWithKeyword":"When pengguna menyimpan tautan Zoom yang bukan alamat web","stepMatchArguments":[]},{"pwStepLine":76,"gherkinStepLine":76,"keywordType":"Outcome","textWithKeyword":"Then tidak ada permintaan simpan tautan Zoom yang dikirim ke backend","stepMatchArguments":[{"group":{"start":21,"value":"simpan tautan Zoom"},"parameterTypeName":"layanan"}]}]},
  {"pwTestLine":79,"pickleLine":79,"tags":["@sit","@detail-konsultasi","@CON-010","@precondition:login-konsultan"],"steps":[{"pwStepLine":80,"gherkinStepLine":80,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus terjadwal","stepMatchArguments":[{"group":{"start":33,"value":"terjadwal"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":81,"gherkinStepLine":81,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman detail konsultasi itu","stepMatchArguments":[{"group":{"start":27,"value":"detail konsultasi itu"},"parameterTypeName":"halaman"}]},{"pwStepLine":82,"gherkinStepLine":82,"keywordType":"Action","textWithKeyword":"When pengguna mengurungkan pengisian tautan Zoom","stepMatchArguments":[]},{"pwStepLine":83,"gherkinStepLine":83,"keywordType":"Outcome","textWithKeyword":"Then tautan Zoom tetap belum tersedia","stepMatchArguments":[]},{"pwStepLine":84,"gherkinStepLine":84,"keywordType":"Outcome","textWithKeyword":"And konsultan tidak ditawari memberi ulasan","stepMatchArguments":[]}]},
]; // bdd-data-end
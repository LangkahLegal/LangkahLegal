// Generated from: features\jadwal\jadwal.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Jadwal praktik konsultan', () => {

  test('Halaman jadwal menampilkan status ketersediaan dan kalender bulan ini', { tag: ['@sit', '@jadwal', '@precondition:login-konsultan', '@SCH-001', '@mobile'] }, async ({ Given, When, Then, jadwalPage, page, world }) => { 
    await Given('konsultan uji belum membuka jadwal praktik', null, { page, world }); 
    await When('pengguna membuka halaman jadwal', null, { page, world }); 
    await Then('halaman jadwal menampilkan status menerima konsultasi dan kalender bulan ini', null, { jadwalPage, page, world }); 
  });

  test('Konsultan menambah slot jadwal baru', { tag: ['@sit', '@jadwal', '@precondition:login-konsultan', '@SCH-002', '@critical'] }, async ({ Given, When, Then, And, dialogs, jadwalPage, page, world }) => { 
    await Given('konsultan uji belum membuka jadwal praktik', null, { page, world }); 
    await And('pengguna berada di halaman jadwal', null, { page, world }); 
    await When('pengguna menambah slot jadwal pada bulan depan', null, { jadwalPage, page, world }); 
    await Then('muncul pemberitahuan "Jadwal baru berhasil ditambahkan!"', null, { dialogs, page, world }); 
    await And('slot jadwal baru tersimpan di database', null, { page, world }); 
  });

  test('Konsultan meliburkan slot yang sudah ada', { tag: ['@sit', '@jadwal', '@precondition:login-konsultan', '@SCH-003'] }, async ({ Given, When, Then, And, dialogs, jadwalPage, page, world }) => { 
    await Given('konsultan uji punya slot jadwal pada bulan depan', null, { page, world }); 
    await And('pengguna berada di halaman jadwal', null, { page, world }); 
    await When('pengguna meliburkan slot jadwal itu', null, { jadwalPage, page, world }); 
    await Then('muncul pemberitahuan "Jadwal berhasil diperbarui!"', null, { dialogs, page, world }); 
    await And('slot jadwal itu tersimpan sebagai libur', null, { page, world }); 
  });

  test('Slot yang sudah dipesan klien tidak dapat diubah', { tag: ['@sit', '@jadwal', '@precondition:login-konsultan', '@SCH-004'] }, async ({ Given, When, Then, And, jadwalPage, page, world }) => { 
    await Given('konsultan uji punya slot jadwal bulan depan yang sudah dipesan klien', null, { page, world }); 
    await And('pengguna berada di halaman jadwal', null, { page, world }); 
    await When('pengguna membuka slot jadwal yang sudah dipesan itu', null, { jadwalPage, page, world }); 
    await Then('slot jadwal itu hanya bisa dilihat', null, { jadwalPage, page, world }); 
  });

  test('Slot dengan jam selesai sebelum jam mulai ditolak', { tag: ['@sit', '@jadwal', '@precondition:login-konsultan', '@SCH-005'] }, async ({ Given, When, Then, And, jadwalPage, network, page, world }) => { 
    await Given('konsultan uji belum membuka jadwal praktik', null, { page, world }); 
    await And('pengguna berada di halaman jadwal', null, { page, world }); 
    await When('pengguna menambah slot dengan jam selesai sebelum jam mulai', null, { jadwalPage, page, world }); 
    await Then('tidak ada permintaan tambah jadwal yang dikirim ke backend', null, { network, page, world }); 
  });

  test('Slot tidak dapat ditambah pada tanggal yang sudah lewat', { tag: ['@sit', '@jadwal', '@precondition:login-konsultan', '@SCH-006'] }, async ({ Given, When, Then, jadwalPage, page, world }) => { 
    await Given('pengguna berada di halaman jadwal', null, { page, world }); 
    await When('pengguna memilih tanggal pada bulan lalu', null, { jadwalPage, page, world }); 
    await Then('formulir slot jadwal tidak terbuka', null, { jadwalPage, page, world }); 
  });

  test('Status tidak menerima konsultasi tersimpan', { tag: ['@sit', '@jadwal', '@precondition:login-konsultan', '@SCH-007'] }, async ({ Given, When, Then, jadwalPage, page, world }) => { 
    await Given('pengguna berada di halaman jadwal', null, { page, world }); 
    await When('pengguna menonaktifkan penerimaan konsultasi', null, { jadwalPage, page, world }); 
    await Then('status tidak menerima konsultasi tersimpan ke backend', null, { page, world }); 
  });

  test('Slot yang bentrok diberitahukan ke konsultan', { tag: ['@sit', '@jadwal', '@precondition:login-konsultan', '@SCH-008', '@stub'] }, async ({ Given, When, Then, And, dialogs, jadwalPage, network, page, world }) => { 
    await Given('layanan tambah jadwal menolak dengan pesan "bentrok"', null, { network, page, world }); 
    await And('pengguna berada di halaman jadwal', null, { page, world }); 
    await When('pengguna menambah slot jadwal yang bentrok', null, { jadwalPage, page, world }); 
    await Then('muncul pemberitahuan "Gagal menambah jadwal. Pastikan jam tidak bertabrakan."', null, { dialogs, page, world }); 
  });

  test('Berpindah bulan dari tanggal 31 tidak melompati bulan', { tag: ['@sit', '@jadwal', '@precondition:login-konsultan', '@SCH-009'] }, async ({ Given, When, Then, And, jadwalPage, page, world }) => { 
    await Given('hari ini di browser adalah tanggal 31 Januari', null, { page, world }); 
    await And('pengguna berada di halaman jadwal', null, { page, world }); 
    await When('pengguna berpindah ke bulan berikutnya di kalender', null, { jadwalPage, page, world }); 
    await Then('kalender menampilkan bulan Februari', null, { jadwalPage, page, world }); 
  });

  test('Formulir slot jadwal dapat ditutup tanpa menyimpan', { tag: ['@sit', '@jadwal', '@precondition:login-konsultan', '@SCH-010'] }, async ({ Given, When, Then, And, jadwalPage, network, page, world }) => { 
    await Given('konsultan uji belum membuka jadwal praktik', null, { page, world }); 
    await And('pengguna berada di halaman jadwal', null, { page, world }); 
    await When('pengguna membuka lalu menutup formulir slot jadwal', null, { jadwalPage, page, world }); 
    await Then('formulir slot jadwal tidak terbuka', null, { jadwalPage, page, world }); 
    await And('tidak ada permintaan tambah jadwal yang dikirim ke backend', null, { network, page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\jadwal\\jadwal.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":6,"tags":["@sit","@jadwal","@precondition:login-konsultan","@SCH-001","@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given konsultan uji belum membuka jadwal praktik","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman jadwal","stepMatchArguments":[{"group":{"start":25,"value":"jadwal"},"parameterTypeName":"halaman"}]},{"pwStepLine":9,"gherkinStepLine":9,"keywordType":"Outcome","textWithKeyword":"Then halaman jadwal menampilkan status menerima konsultasi dan kalender bulan ini","stepMatchArguments":[]}]},
  {"pwTestLine":12,"pickleLine":12,"tags":["@sit","@jadwal","@precondition:login-konsultan","@SCH-002","@critical"],"steps":[{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Context","textWithKeyword":"Given konsultan uji belum membuka jadwal praktik","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman jadwal","stepMatchArguments":[{"group":{"start":27,"value":"jadwal"},"parameterTypeName":"halaman"}]},{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Action","textWithKeyword":"When pengguna menambah slot jadwal pada bulan depan","stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":16,"keywordType":"Outcome","textWithKeyword":"Then muncul pemberitahuan \"Jadwal baru berhasil ditambahkan!\"","stepMatchArguments":[{"group":{"start":21,"value":"\"Jadwal baru berhasil ditambahkan!\"","children":[{"start":22,"value":"Jadwal baru berhasil ditambahkan!","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":17,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"And slot jadwal baru tersimpan di database","stepMatchArguments":[]}]},
  {"pwTestLine":20,"pickleLine":20,"tags":["@sit","@jadwal","@precondition:login-konsultan","@SCH-003"],"steps":[{"pwStepLine":21,"gherkinStepLine":21,"keywordType":"Context","textWithKeyword":"Given konsultan uji punya slot jadwal pada bulan depan","stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":22,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman jadwal","stepMatchArguments":[{"group":{"start":27,"value":"jadwal"},"parameterTypeName":"halaman"}]},{"pwStepLine":23,"gherkinStepLine":23,"keywordType":"Action","textWithKeyword":"When pengguna meliburkan slot jadwal itu","stepMatchArguments":[]},{"pwStepLine":24,"gherkinStepLine":24,"keywordType":"Outcome","textWithKeyword":"Then muncul pemberitahuan \"Jadwal berhasil diperbarui!\"","stepMatchArguments":[{"group":{"start":21,"value":"\"Jadwal berhasil diperbarui!\"","children":[{"start":22,"value":"Jadwal berhasil diperbarui!","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":25,"gherkinStepLine":25,"keywordType":"Outcome","textWithKeyword":"And slot jadwal itu tersimpan sebagai libur","stepMatchArguments":[]}]},
  {"pwTestLine":28,"pickleLine":28,"tags":["@sit","@jadwal","@precondition:login-konsultan","@SCH-004"],"steps":[{"pwStepLine":29,"gherkinStepLine":29,"keywordType":"Context","textWithKeyword":"Given konsultan uji punya slot jadwal bulan depan yang sudah dipesan klien","stepMatchArguments":[]},{"pwStepLine":30,"gherkinStepLine":30,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman jadwal","stepMatchArguments":[{"group":{"start":27,"value":"jadwal"},"parameterTypeName":"halaman"}]},{"pwStepLine":31,"gherkinStepLine":31,"keywordType":"Action","textWithKeyword":"When pengguna membuka slot jadwal yang sudah dipesan itu","stepMatchArguments":[]},{"pwStepLine":32,"gherkinStepLine":32,"keywordType":"Outcome","textWithKeyword":"Then slot jadwal itu hanya bisa dilihat","stepMatchArguments":[]}]},
  {"pwTestLine":35,"pickleLine":35,"tags":["@sit","@jadwal","@precondition:login-konsultan","@SCH-005"],"steps":[{"pwStepLine":36,"gherkinStepLine":36,"keywordType":"Context","textWithKeyword":"Given konsultan uji belum membuka jadwal praktik","stepMatchArguments":[]},{"pwStepLine":37,"gherkinStepLine":37,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman jadwal","stepMatchArguments":[{"group":{"start":27,"value":"jadwal"},"parameterTypeName":"halaman"}]},{"pwStepLine":38,"gherkinStepLine":38,"keywordType":"Action","textWithKeyword":"When pengguna menambah slot dengan jam selesai sebelum jam mulai","stepMatchArguments":[]},{"pwStepLine":39,"gherkinStepLine":39,"keywordType":"Outcome","textWithKeyword":"Then tidak ada permintaan tambah jadwal yang dikirim ke backend","stepMatchArguments":[{"group":{"start":21,"value":"tambah jadwal"},"parameterTypeName":"layanan"}]}]},
  {"pwTestLine":42,"pickleLine":42,"tags":["@sit","@jadwal","@precondition:login-konsultan","@SCH-006"],"steps":[{"pwStepLine":43,"gherkinStepLine":43,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman jadwal","stepMatchArguments":[{"group":{"start":27,"value":"jadwal"},"parameterTypeName":"halaman"}]},{"pwStepLine":44,"gherkinStepLine":44,"keywordType":"Action","textWithKeyword":"When pengguna memilih tanggal pada bulan lalu","stepMatchArguments":[]},{"pwStepLine":45,"gherkinStepLine":45,"keywordType":"Outcome","textWithKeyword":"Then formulir slot jadwal tidak terbuka","stepMatchArguments":[]}]},
  {"pwTestLine":48,"pickleLine":48,"tags":["@sit","@jadwal","@precondition:login-konsultan","@SCH-007"],"steps":[{"pwStepLine":49,"gherkinStepLine":49,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman jadwal","stepMatchArguments":[{"group":{"start":27,"value":"jadwal"},"parameterTypeName":"halaman"}]},{"pwStepLine":50,"gherkinStepLine":50,"keywordType":"Action","textWithKeyword":"When pengguna menonaktifkan penerimaan konsultasi","stepMatchArguments":[]},{"pwStepLine":51,"gherkinStepLine":51,"keywordType":"Outcome","textWithKeyword":"Then status tidak menerima konsultasi tersimpan ke backend","stepMatchArguments":[]}]},
  {"pwTestLine":54,"pickleLine":54,"tags":["@sit","@jadwal","@precondition:login-konsultan","@SCH-008","@stub"],"steps":[{"pwStepLine":55,"gherkinStepLine":55,"keywordType":"Context","textWithKeyword":"Given layanan tambah jadwal menolak dengan pesan \"bentrok\"","stepMatchArguments":[{"group":{"start":8,"value":"tambah jadwal"},"parameterTypeName":"layanan"},{"group":{"start":43,"value":"\"bentrok\"","children":[{"start":44,"value":"bentrok","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":56,"gherkinStepLine":56,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman jadwal","stepMatchArguments":[{"group":{"start":27,"value":"jadwal"},"parameterTypeName":"halaman"}]},{"pwStepLine":57,"gherkinStepLine":57,"keywordType":"Action","textWithKeyword":"When pengguna menambah slot jadwal yang bentrok","stepMatchArguments":[]},{"pwStepLine":58,"gherkinStepLine":58,"keywordType":"Outcome","textWithKeyword":"Then muncul pemberitahuan \"Gagal menambah jadwal. Pastikan jam tidak bertabrakan.\"","stepMatchArguments":[{"group":{"start":21,"value":"\"Gagal menambah jadwal. Pastikan jam tidak bertabrakan.\"","children":[{"start":22,"value":"Gagal menambah jadwal. Pastikan jam tidak bertabrakan.","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":61,"pickleLine":61,"tags":["@sit","@jadwal","@precondition:login-konsultan","@SCH-009"],"steps":[{"pwStepLine":62,"gherkinStepLine":62,"keywordType":"Context","textWithKeyword":"Given hari ini di browser adalah tanggal 31 Januari","stepMatchArguments":[]},{"pwStepLine":63,"gherkinStepLine":63,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman jadwal","stepMatchArguments":[{"group":{"start":27,"value":"jadwal"},"parameterTypeName":"halaman"}]},{"pwStepLine":64,"gherkinStepLine":64,"keywordType":"Action","textWithKeyword":"When pengguna berpindah ke bulan berikutnya di kalender","stepMatchArguments":[]},{"pwStepLine":65,"gherkinStepLine":65,"keywordType":"Outcome","textWithKeyword":"Then kalender menampilkan bulan Februari","stepMatchArguments":[]}]},
  {"pwTestLine":68,"pickleLine":68,"tags":["@sit","@jadwal","@precondition:login-konsultan","@SCH-010"],"steps":[{"pwStepLine":69,"gherkinStepLine":69,"keywordType":"Context","textWithKeyword":"Given konsultan uji belum membuka jadwal praktik","stepMatchArguments":[]},{"pwStepLine":70,"gherkinStepLine":70,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman jadwal","stepMatchArguments":[{"group":{"start":27,"value":"jadwal"},"parameterTypeName":"halaman"}]},{"pwStepLine":71,"gherkinStepLine":71,"keywordType":"Action","textWithKeyword":"When pengguna membuka lalu menutup formulir slot jadwal","stepMatchArguments":[]},{"pwStepLine":72,"gherkinStepLine":72,"keywordType":"Outcome","textWithKeyword":"Then formulir slot jadwal tidak terbuka","stepMatchArguments":[]},{"pwStepLine":73,"gherkinStepLine":73,"keywordType":"Outcome","textWithKeyword":"And tidak ada permintaan tambah jadwal yang dikirim ke backend","stepMatchArguments":[{"group":{"start":21,"value":"tambah jadwal"},"parameterTypeName":"layanan"}]}]},
]; // bdd-data-end
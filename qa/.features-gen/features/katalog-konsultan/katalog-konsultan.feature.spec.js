// Generated from: features\katalog-konsultan\katalog-konsultan.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Katalog konsultan', () => {

  test('Konsultan aktif tampil di katalog beserta tarifnya', { tag: ['@sit', '@katalog-konsultan', '@precondition:login-klien', '@EXP-001', '@critical', '@mobile'] }, async ({ Given, When, Then, katalogKonsultanPage, page, world }) => { 
    await Given('pengguna berada di halaman katalog konsultan', null, { page, world }); 
    await When('pengguna mencari konsultan uji berdasarkan namanya', null, { katalogKonsultanPage, page, world }); 
    await Then('konsultan uji tampil di katalog beserta tarifnya', null, { katalogKonsultanPage, page, world }); 
  });

  test('Pencarian nama tidak membedakan huruf besar dan kecil', { tag: ['@sit', '@katalog-konsultan', '@precondition:login-klien', '@EXP-002'] }, async ({ Given, When, Then, katalogKonsultanPage, page, world }) => { 
    await Given('pengguna berada di halaman katalog konsultan', null, { page, world }); 
    await When('pengguna mencari konsultan uji dengan kapitalisasi yang berbeda', null, { katalogKonsultanPage, page, world }); 
    await Then('konsultan uji tampil di katalog', null, { katalogKonsultanPage, page, world }); 
  });

  test('Konsultan dapat dicari berdasarkan keahlian', { tag: ['@sit', '@katalog-konsultan', '@precondition:login-klien', '@EXP-003'] }, async ({ Given, When, Then, katalogKonsultanPage, page, world }) => { 
    await Given('pengguna berada di halaman katalog konsultan', null, { page, world }); 
    await When('pengguna mencari berdasarkan keahlian konsultan uji', null, { katalogKonsultanPage, page, world }); 
    await Then('setiap konsultan yang tampil cocok dengan keahlian itu', null, { katalogKonsultanPage, page, world }); 
  });

  test('Pencarian tanpa hasil menampilkan keadaan kosong', { tag: ['@sit', '@katalog-konsultan', '@precondition:login-klien', '@EXP-004'] }, async ({ Given, When, Then, katalogKonsultanPage, page, world }) => { 
    await Given('pengguna berada di halaman katalog konsultan', null, { page, world }); 
    await When('pengguna mencari kata yang tidak cocok dengan konsultan mana pun', null, { katalogKonsultanPage, page, world }); 
    await Then('katalog menampilkan keadaan kosong', null, { katalogKonsultanPage, page, world }); 
  });

  test('Kata pencarian yang tidak wajar tidak merusak katalog', { tag: ['@sit', '@katalog-konsultan', '@precondition:login-klien', '@EXP-005'] }, async ({ Given, When, Then, And, dialogs, katalogKonsultanPage, page, pageErrors, world }) => { 
    await Given('pengguna berada di halaman katalog konsultan', null, { page, world }); 
    await When('pengguna mencari dengan kata yang sangat panjang, berisi skrip, perintah SQL, dan emoji', null, { katalogKonsultanPage, page, world }); 
    await Then('setiap pencarian itu berakhir dengan keadaan kosong', null, { page, world }); 
    await And('tidak ada dialog yang muncul', null, { dialogs, page, world }); 
    await And('halaman tidak mengalami galat', null, { page, pageErrors, world }); 
  });

  test('Katalog dapat disaring berdasarkan kategori hukum', { tag: ['@sit', '@katalog-konsultan', '@precondition:login-klien', '@EXP-006'] }, async ({ Given, When, Then, And, katalogKonsultanPage, network, page, world }) => { 
    await Given('pengguna berada di halaman katalog konsultan', null, { page, world }); 
    await When('pengguna menyaring katalog berdasarkan kategori konsultan uji', null, { katalogKonsultanPage, page, world }); 
    await Then('katalog diminta ke backend dengan kategori itu', null, { network, page, world }); 
    await And('setiap konsultan yang tampil cocok dengan keahlian itu', null, { katalogKonsultanPage, page, world }); 
  });

  test('Saringan verifikasi dan tarif dapat dipakai lalu diatur ulang', { tag: ['@sit', '@katalog-konsultan', '@precondition:login-klien', '@EXP-007'] }, async ({ Given, When, Then, katalogKonsultanPage, page, world }) => { 
    await Given('pengguna berada di halaman katalog konsultan', null, { page, world }); 
    await When('pengguna menyaring konsultan terverifikasi pada rentang tarif konsultan uji', null, { katalogKonsultanPage, page, world }); 
    await Then('konsultan uji tampil di katalog', null, { katalogKonsultanPage, page, world }); 
    await When('pengguna mengatur ulang saringan katalog', null, { katalogKonsultanPage, page, world }); 
    await Then('saringan katalog kembali ke keadaan awal', null, { katalogKonsultanPage, page, world }); 
  });

  test('Rentang tarif yang terbalik tidak menghasilkan konsultan', { tag: ['@sit', '@katalog-konsultan', '@precondition:login-klien', '@EXP-008'] }, async ({ Given, When, Then, katalogKonsultanPage, page, world }) => { 
    await Given('pengguna berada di halaman katalog konsultan', null, { page, world }); 
    await When('pengguna menyaring dengan tarif minimum di atas tarif maksimum', null, { katalogKonsultanPage, page, world }); 
    await Then('katalog menampilkan keadaan kosong', null, { katalogKonsultanPage, page, world }); 
  });

  test('Foto profil dengan alamat berbahaya tidak dipakai', { tag: ['@sit', '@katalog-konsultan', '@precondition:login-klien', '@EXP-009', '@stub'] }, async ({ Given, When, Then, katalogKonsultanPage, network, page, world }) => { 
    await Given('katalog berisi konsultan dengan foto profil berbahaya', null, { network, page, world }); 
    await When('pengguna membuka halaman katalog konsultan', null, { page, world }); 
    await Then('foto konsultan itu diganti gambar bawaan', null, { katalogKonsultanPage, page, world }); 
  });

  test('Konsultan tanpa nama tidak merusak katalog', { tag: ['@sit', '@katalog-konsultan', '@precondition:login-klien', '@EXP-010', '@stub'] }, async ({ Given, When, Then, And, katalogKonsultanPage, network, page, pageErrors, world }) => { 
    await Given('katalog berisi konsultan dengan nama yang kosong', null, { network, page, world }); 
    await When('pengguna membuka halaman katalog konsultan', null, { page, world }); 
    await Then('konsultan lain tetap tampil di katalog', null, { katalogKonsultanPage, page, world }); 
    await And('halaman tidak mengalami galat', null, { page, pageErrors, world }); 
  });

  test('Gangguan saat memuat katalog diberitahukan ke klien', { tag: ['@sit', '@katalog-konsultan', '@precondition:login-klien', '@EXP-011'] }, async ({ Given, When, Then, katalogKonsultanPage, network, page, world }) => { 
    await Given('layanan katalog konsultan sedang mengalami gangguan', null, { network, page, world }); 
    await When('pengguna membuka halaman katalog konsultan', null, { page, world }); 
    await Then('katalog menampilkan pesan gagal memuat', null, { katalogKonsultanPage, page, world }); 
  });

  test('Klien membuka profil konsultan dari katalog', { tag: ['@sit', '@katalog-konsultan', '@precondition:login-klien', '@EXP-012'] }, async ({ Given, When, Then, And, katalogKonsultanPage, page, world }) => { 
    await Given('pengguna berada di halaman katalog konsultan', null, { page, world }); 
    await When('pengguna mencari konsultan uji berdasarkan namanya', null, { katalogKonsultanPage, page, world }); 
    await And('pengguna membuka profil konsultan uji dari katalog', null, { katalogKonsultanPage, page, world }); 
    await Then('pengguna diarahkan ke halaman profil konsultan uji', null, { page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\katalog-konsultan\\katalog-konsultan.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":9,"tags":["@sit","@katalog-konsultan","@precondition:login-klien","@EXP-001","@critical","@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":10,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman katalog konsultan","stepMatchArguments":[{"group":{"start":27,"value":"katalog konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":8,"gherkinStepLine":11,"keywordType":"Action","textWithKeyword":"When pengguna mencari konsultan uji berdasarkan namanya","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"Then konsultan uji tampil di katalog beserta tarifnya","stepMatchArguments":[]}]},
  {"pwTestLine":12,"pickleLine":15,"tags":["@sit","@katalog-konsultan","@precondition:login-klien","@EXP-002"],"steps":[{"pwStepLine":13,"gherkinStepLine":16,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman katalog konsultan","stepMatchArguments":[{"group":{"start":27,"value":"katalog konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":14,"gherkinStepLine":17,"keywordType":"Action","textWithKeyword":"When pengguna mencari konsultan uji dengan kapitalisasi yang berbeda","stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":18,"keywordType":"Outcome","textWithKeyword":"Then konsultan uji tampil di katalog","stepMatchArguments":[]}]},
  {"pwTestLine":18,"pickleLine":21,"tags":["@sit","@katalog-konsultan","@precondition:login-klien","@EXP-003"],"steps":[{"pwStepLine":19,"gherkinStepLine":22,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman katalog konsultan","stepMatchArguments":[{"group":{"start":27,"value":"katalog konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":20,"gherkinStepLine":23,"keywordType":"Action","textWithKeyword":"When pengguna mencari berdasarkan keahlian konsultan uji","stepMatchArguments":[]},{"pwStepLine":21,"gherkinStepLine":24,"keywordType":"Outcome","textWithKeyword":"Then setiap konsultan yang tampil cocok dengan keahlian itu","stepMatchArguments":[]}]},
  {"pwTestLine":24,"pickleLine":27,"tags":["@sit","@katalog-konsultan","@precondition:login-klien","@EXP-004"],"steps":[{"pwStepLine":25,"gherkinStepLine":28,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman katalog konsultan","stepMatchArguments":[{"group":{"start":27,"value":"katalog konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":26,"gherkinStepLine":29,"keywordType":"Action","textWithKeyword":"When pengguna mencari kata yang tidak cocok dengan konsultan mana pun","stepMatchArguments":[]},{"pwStepLine":27,"gherkinStepLine":30,"keywordType":"Outcome","textWithKeyword":"Then katalog menampilkan keadaan kosong","stepMatchArguments":[]}]},
  {"pwTestLine":30,"pickleLine":33,"tags":["@sit","@katalog-konsultan","@precondition:login-klien","@EXP-005"],"steps":[{"pwStepLine":31,"gherkinStepLine":34,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman katalog konsultan","stepMatchArguments":[{"group":{"start":27,"value":"katalog konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":32,"gherkinStepLine":35,"keywordType":"Action","textWithKeyword":"When pengguna mencari dengan kata yang sangat panjang, berisi skrip, perintah SQL, dan emoji","stepMatchArguments":[]},{"pwStepLine":33,"gherkinStepLine":36,"keywordType":"Outcome","textWithKeyword":"Then setiap pencarian itu berakhir dengan keadaan kosong","stepMatchArguments":[]},{"pwStepLine":34,"gherkinStepLine":37,"keywordType":"Outcome","textWithKeyword":"And tidak ada dialog yang muncul","stepMatchArguments":[]},{"pwStepLine":35,"gherkinStepLine":38,"keywordType":"Outcome","textWithKeyword":"And halaman tidak mengalami galat","stepMatchArguments":[]}]},
  {"pwTestLine":38,"pickleLine":41,"tags":["@sit","@katalog-konsultan","@precondition:login-klien","@EXP-006"],"steps":[{"pwStepLine":39,"gherkinStepLine":42,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman katalog konsultan","stepMatchArguments":[{"group":{"start":27,"value":"katalog konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":40,"gherkinStepLine":43,"keywordType":"Action","textWithKeyword":"When pengguna menyaring katalog berdasarkan kategori konsultan uji","stepMatchArguments":[]},{"pwStepLine":41,"gherkinStepLine":44,"keywordType":"Outcome","textWithKeyword":"Then katalog diminta ke backend dengan kategori itu","stepMatchArguments":[]},{"pwStepLine":42,"gherkinStepLine":45,"keywordType":"Outcome","textWithKeyword":"And setiap konsultan yang tampil cocok dengan keahlian itu","stepMatchArguments":[]}]},
  {"pwTestLine":45,"pickleLine":48,"tags":["@sit","@katalog-konsultan","@precondition:login-klien","@EXP-007"],"steps":[{"pwStepLine":46,"gherkinStepLine":49,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman katalog konsultan","stepMatchArguments":[{"group":{"start":27,"value":"katalog konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":47,"gherkinStepLine":50,"keywordType":"Action","textWithKeyword":"When pengguna menyaring konsultan terverifikasi pada rentang tarif konsultan uji","stepMatchArguments":[]},{"pwStepLine":48,"gherkinStepLine":51,"keywordType":"Outcome","textWithKeyword":"Then konsultan uji tampil di katalog","stepMatchArguments":[]},{"pwStepLine":49,"gherkinStepLine":52,"keywordType":"Action","textWithKeyword":"When pengguna mengatur ulang saringan katalog","stepMatchArguments":[]},{"pwStepLine":50,"gherkinStepLine":53,"keywordType":"Outcome","textWithKeyword":"Then saringan katalog kembali ke keadaan awal","stepMatchArguments":[]}]},
  {"pwTestLine":53,"pickleLine":56,"tags":["@sit","@katalog-konsultan","@precondition:login-klien","@EXP-008"],"steps":[{"pwStepLine":54,"gherkinStepLine":57,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman katalog konsultan","stepMatchArguments":[{"group":{"start":27,"value":"katalog konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":55,"gherkinStepLine":58,"keywordType":"Action","textWithKeyword":"When pengguna menyaring dengan tarif minimum di atas tarif maksimum","stepMatchArguments":[]},{"pwStepLine":56,"gherkinStepLine":59,"keywordType":"Outcome","textWithKeyword":"Then katalog menampilkan keadaan kosong","stepMatchArguments":[]}]},
  {"pwTestLine":59,"pickleLine":62,"tags":["@sit","@katalog-konsultan","@precondition:login-klien","@EXP-009","@stub"],"steps":[{"pwStepLine":60,"gherkinStepLine":63,"keywordType":"Context","textWithKeyword":"Given katalog berisi konsultan dengan foto profil berbahaya","stepMatchArguments":[{"group":{"start":32,"value":"foto profil berbahaya"},"parameterTypeName":"katalogTiruan"}]},{"pwStepLine":61,"gherkinStepLine":64,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman katalog konsultan","stepMatchArguments":[{"group":{"start":25,"value":"katalog konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":62,"gherkinStepLine":65,"keywordType":"Outcome","textWithKeyword":"Then foto konsultan itu diganti gambar bawaan","stepMatchArguments":[]}]},
  {"pwTestLine":65,"pickleLine":68,"tags":["@sit","@katalog-konsultan","@precondition:login-klien","@EXP-010","@stub"],"steps":[{"pwStepLine":66,"gherkinStepLine":69,"keywordType":"Context","textWithKeyword":"Given katalog berisi konsultan dengan nama yang kosong","stepMatchArguments":[{"group":{"start":32,"value":"nama yang kosong"},"parameterTypeName":"katalogTiruan"}]},{"pwStepLine":67,"gherkinStepLine":70,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman katalog konsultan","stepMatchArguments":[{"group":{"start":25,"value":"katalog konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":68,"gherkinStepLine":71,"keywordType":"Outcome","textWithKeyword":"Then konsultan lain tetap tampil di katalog","stepMatchArguments":[]},{"pwStepLine":69,"gherkinStepLine":72,"keywordType":"Outcome","textWithKeyword":"And halaman tidak mengalami galat","stepMatchArguments":[]}]},
  {"pwTestLine":72,"pickleLine":75,"tags":["@sit","@katalog-konsultan","@precondition:login-klien","@EXP-011"],"steps":[{"pwStepLine":73,"gherkinStepLine":76,"keywordType":"Context","textWithKeyword":"Given layanan katalog konsultan sedang mengalami gangguan","stepMatchArguments":[{"group":{"start":8,"value":"katalog konsultan"},"parameterTypeName":"layanan"}]},{"pwStepLine":74,"gherkinStepLine":77,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman katalog konsultan","stepMatchArguments":[{"group":{"start":25,"value":"katalog konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":75,"gherkinStepLine":78,"keywordType":"Outcome","textWithKeyword":"Then katalog menampilkan pesan gagal memuat","stepMatchArguments":[]}]},
  {"pwTestLine":78,"pickleLine":81,"tags":["@sit","@katalog-konsultan","@precondition:login-klien","@EXP-012"],"steps":[{"pwStepLine":79,"gherkinStepLine":82,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman katalog konsultan","stepMatchArguments":[{"group":{"start":27,"value":"katalog konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":80,"gherkinStepLine":83,"keywordType":"Action","textWithKeyword":"When pengguna mencari konsultan uji berdasarkan namanya","stepMatchArguments":[]},{"pwStepLine":81,"gherkinStepLine":84,"keywordType":"Action","textWithKeyword":"And pengguna membuka profil konsultan uji dari katalog","stepMatchArguments":[]},{"pwStepLine":82,"gherkinStepLine":85,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman profil konsultan uji","stepMatchArguments":[{"group":{"start":30,"value":"profil konsultan uji"},"parameterTypeName":"halaman"}]}]},
]; // bdd-data-end
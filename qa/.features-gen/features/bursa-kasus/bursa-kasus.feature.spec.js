// Generated from: features\bursa-kasus\bursa-kasus.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Bursa kasus', () => {

  test('Kasus terbuka tampil anonim beserta dokumennya', { tag: ['@sit', '@bursa-kasus', '@BUR-001', '@critical', '@mobile', '@precondition:login-konsultan'] }, async ({ Given, When, Then, bursaKasusPage, page, world }) => { 
    await Given('klien uji memposting beberapa kasus ke bursa', null, { page, world }); 
    await When('pengguna membuka halaman bursa kasus', null, { page, world }); 
    await Then('kasus klien uji tampil anonim di bursa beserta tautan dokumennya', null, { bursaKasusPage, page, world }); 
  });

  test('Bursa dapat disaring berdasarkan kategori', { tag: ['@sit', '@bursa-kasus', '@BUR-002', '@precondition:login-konsultan'] }, async ({ Given, When, Then, And, bursaKasusPage, page, world }) => { 
    await Given('klien uji memposting beberapa kasus ke bursa', null, { page, world }); 
    await And('pengguna berada di halaman bursa kasus', null, { page, world }); 
    await When('pengguna menyaring bursa berdasarkan kategori pidana', null, { bursaKasusPage, page, world }); 
    await Then('hanya kasus pidana milik klien uji yang tampil', null, { bursaKasusPage, page, world }); 
  });

  test('Bursa dapat disaring ke kategori umum', { tag: ['@sit', '@bursa-kasus', '@BUR-002', '@precondition:login-konsultan'] }, async ({ Given, When, Then, And, bursaKasusPage, page, world }) => { 
    await Given('klien uji memposting beberapa kasus ke bursa', null, { page, world }); 
    await And('pengguna berada di halaman bursa kasus', null, { page, world }); 
    await When('pengguna menyaring bursa berdasarkan kategori umum', null, { bursaKasusPage, page, world }); 
    await Then('hanya kasus umum milik klien uji yang tampil', null, { bursaKasusPage, page, world }); 
  });

  test('Deskripsi kasus yang panjang dapat diperluas dan diciutkan', { tag: ['@sit', '@bursa-kasus', '@BUR-003', '@precondition:login-konsultan'] }, async ({ Given, When, Then, And, bursaKasusPage, page, world }) => { 
    await Given('klien uji memposting beberapa kasus ke bursa', null, { page, world }); 
    await And('pengguna berada di halaman bursa kasus', null, { page, world }); 
    await Then('deskripsi kasus yang panjang tampil terpotong', null, { bursaKasusPage, page, world }); 
    await When('pengguna memperluas deskripsi kasus itu', null, { bursaKasusPage, page, world }); 
    await Then('deskripsi kasus itu tampil utuh', null, { bursaKasusPage, page, world }); 
    await When('pengguna menciutkan deskripsi kasus itu', null, { bursaKasusPage, page, world }); 
    await Then('deskripsi kasus yang panjang tampil terpotong', null, { bursaKasusPage, page, world }); 
  });

  test('Deskripsi kasus berisi skrip ditampilkan sebagai teks biasa', { tag: ['@sit', '@bursa-kasus', '@BUR-004', '@precondition:login-konsultan'] }, async ({ Given, When, Then, And, bursaKasusPage, dialogs, page, world }) => { 
    await Given('klien uji memposting beberapa kasus ke bursa', null, { page, world }); 
    await When('pengguna membuka halaman bursa kasus', null, { page, world }); 
    await Then('deskripsi berisi skrip tampil sebagai teks biasa', null, { bursaKasusPage, page, world }); 
    await And('tidak ada dialog yang muncul', null, { dialogs, page, world }); 
  });

  test('Konsultan mengurungkan klaim kasus', { tag: ['@sit', '@bursa-kasus', '@BUR-005', '@precondition:login-konsultan'] }, async ({ Given, When, Then, And, bursaKasusPage, network, page, world }) => { 
    await Given('klien uji memposting beberapa kasus ke bursa', null, { page, world }); 
    await And('pengguna berada di halaman bursa kasus', null, { page, world }); 
    await When('pengguna mengurungkan klaim sebuah kasus', null, { bursaKasusPage, page, world }); 
    await Then('kasus itu tetap terbuka di bursa', null, { page, world }); 
    await And('tidak ada permintaan klaim kasus yang dikirim ke backend', null, { network, page, world }); 
  });

  test('Konsultan mengklaim kasus dan membuka konsultasinya', { tag: ['@sit', '@bursa-kasus', '@BUR-006', '@critical', '@precondition:login-konsultan'] }, async ({ Given, When, Then, And, bursaKasusPage, page, world }) => { 
    await Given('klien uji memposting beberapa kasus ke bursa', null, { page, world }); 
    await And('pengguna berada di halaman bursa kasus', null, { page, world }); 
    await When('pengguna mengklaim sebuah kasus', null, { bursaKasusPage, page, world }); 
    await Then('klaim kasus dikonfirmasi berhasil', null, { bursaKasusPage, page, world }); 
    await And('kasus itu tertutup dan menjadi konsultasi konsultan uji', null, { page, world }); 
    await When('pengguna membuka konsultasi hasil klaim', null, { bursaKasusPage, page, world }); 
    await Then('pengguna diarahkan ke halaman detail konsultasi itu', null, { page, world }); 
  });

  test('Konsultan kembali ke bursa setelah mengklaim kasus', { tag: ['@sit', '@bursa-kasus', '@BUR-007', '@precondition:login-konsultan'] }, async ({ Given, When, Then, And, bursaKasusPage, page, world }) => { 
    await Given('klien uji memposting beberapa kasus ke bursa', null, { page, world }); 
    await And('pengguna berada di halaman bursa kasus', null, { page, world }); 
    await When('pengguna mengklaim sebuah kasus', null, { bursaKasusPage, page, world }); 
    await And('pengguna kembali ke bursa dari konfirmasi klaim', null, { bursaKasusPage, page, world }); 
    await Then('daftar bursa tampil kembali', null, { bursaKasusPage, page, world }); 
  });

  test('Kasus yang sudah diambil konsultan lain tidak bisa diklaim', { tag: ['@sit', '@bursa-kasus', '@BUR-008', '@precondition:login-konsultan'] }, async ({ Given, When, Then, And, bursaKasusPage, dialogs, page, world }) => { 
    await Given('klien uji memposting beberapa kasus ke bursa', null, { page, world }); 
    await And('pengguna berada di halaman bursa kasus', null, { page, world }); 
    await When('konsultan lain lebih dulu mengambil kasus yang hendak diklaim pengguna', null, { bursaKasusPage, page, world }); 
    await Then('muncul pemberitahuan "Kasus ini sudah diklaim oleh konsultan lain"', null, { dialogs, page, world }); 
    await And('jendela konfirmasi klaim tertutup', null, { bursaKasusPage, page, world }); 
  });

  test('Gangguan saat memuat bursa diberitahukan ke konsultan', { tag: ['@sit', '@bursa-kasus', '@BUR-009', '@precondition:login-konsultan'] }, async ({ Given, When, Then, bursaKasusPage, network, page, world }) => { 
    await Given('layanan daftar bursa sedang mengalami gangguan', null, { network, page, world }); 
    await When('pengguna membuka halaman bursa kasus', null, { page, world }); 
    await Then('bursa menampilkan pesan gagal memuat', null, { bursaKasusPage, page, world }); 
  });

  test('Bursa tanpa kasus menampilkan keadaan kosong', { tag: ['@sit', '@bursa-kasus', '@BUR-010', '@stub', '@precondition:login-konsultan'] }, async ({ Given, When, Then, bursaKasusPage, network, page, world }) => { 
    await Given('bursa sedang tidak punya kasus terbuka', null, { network, page, world }); 
    await When('pengguna membuka halaman bursa kasus', null, { page, world }); 
    await Then('bursa menampilkan keadaan kosong', null, { bursaKasusPage, page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\bursa-kasus\\bursa-kasus.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":8,"tags":["@sit","@bursa-kasus","@BUR-001","@critical","@mobile","@precondition:login-konsultan"],"steps":[{"pwStepLine":7,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"Given klien uji memposting beberapa kasus ke bursa","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":10,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman bursa kasus","stepMatchArguments":[{"group":{"start":25,"value":"bursa kasus"},"parameterTypeName":"halaman"}]},{"pwStepLine":9,"gherkinStepLine":11,"keywordType":"Outcome","textWithKeyword":"Then kasus klien uji tampil anonim di bursa beserta tautan dokumennya","stepMatchArguments":[]}]},
  {"pwTestLine":12,"pickleLine":14,"tags":["@sit","@bursa-kasus","@BUR-002","@precondition:login-konsultan"],"steps":[{"pwStepLine":13,"gherkinStepLine":15,"keywordType":"Context","textWithKeyword":"Given klien uji memposting beberapa kasus ke bursa","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":16,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman bursa kasus","stepMatchArguments":[{"group":{"start":27,"value":"bursa kasus"},"parameterTypeName":"halaman"}]},{"pwStepLine":15,"gherkinStepLine":17,"keywordType":"Action","textWithKeyword":"When pengguna menyaring bursa berdasarkan kategori pidana","stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":18,"keywordType":"Outcome","textWithKeyword":"Then hanya kasus pidana milik klien uji yang tampil","stepMatchArguments":[]}]},
  {"pwTestLine":19,"pickleLine":21,"tags":["@sit","@bursa-kasus","@BUR-002","@precondition:login-konsultan"],"steps":[{"pwStepLine":20,"gherkinStepLine":22,"keywordType":"Context","textWithKeyword":"Given klien uji memposting beberapa kasus ke bursa","stepMatchArguments":[]},{"pwStepLine":21,"gherkinStepLine":23,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman bursa kasus","stepMatchArguments":[{"group":{"start":27,"value":"bursa kasus"},"parameterTypeName":"halaman"}]},{"pwStepLine":22,"gherkinStepLine":24,"keywordType":"Action","textWithKeyword":"When pengguna menyaring bursa berdasarkan kategori umum","stepMatchArguments":[]},{"pwStepLine":23,"gherkinStepLine":25,"keywordType":"Outcome","textWithKeyword":"Then hanya kasus umum milik klien uji yang tampil","stepMatchArguments":[]}]},
  {"pwTestLine":26,"pickleLine":28,"tags":["@sit","@bursa-kasus","@BUR-003","@precondition:login-konsultan"],"steps":[{"pwStepLine":27,"gherkinStepLine":29,"keywordType":"Context","textWithKeyword":"Given klien uji memposting beberapa kasus ke bursa","stepMatchArguments":[]},{"pwStepLine":28,"gherkinStepLine":30,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman bursa kasus","stepMatchArguments":[{"group":{"start":27,"value":"bursa kasus"},"parameterTypeName":"halaman"}]},{"pwStepLine":29,"gherkinStepLine":31,"keywordType":"Outcome","textWithKeyword":"Then deskripsi kasus yang panjang tampil terpotong","stepMatchArguments":[]},{"pwStepLine":30,"gherkinStepLine":32,"keywordType":"Action","textWithKeyword":"When pengguna memperluas deskripsi kasus itu","stepMatchArguments":[]},{"pwStepLine":31,"gherkinStepLine":33,"keywordType":"Outcome","textWithKeyword":"Then deskripsi kasus itu tampil utuh","stepMatchArguments":[]},{"pwStepLine":32,"gherkinStepLine":34,"keywordType":"Action","textWithKeyword":"When pengguna menciutkan deskripsi kasus itu","stepMatchArguments":[]},{"pwStepLine":33,"gherkinStepLine":35,"keywordType":"Outcome","textWithKeyword":"Then deskripsi kasus yang panjang tampil terpotong","stepMatchArguments":[]}]},
  {"pwTestLine":36,"pickleLine":38,"tags":["@sit","@bursa-kasus","@BUR-004","@precondition:login-konsultan"],"steps":[{"pwStepLine":37,"gherkinStepLine":39,"keywordType":"Context","textWithKeyword":"Given klien uji memposting beberapa kasus ke bursa","stepMatchArguments":[]},{"pwStepLine":38,"gherkinStepLine":40,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman bursa kasus","stepMatchArguments":[{"group":{"start":25,"value":"bursa kasus"},"parameterTypeName":"halaman"}]},{"pwStepLine":39,"gherkinStepLine":41,"keywordType":"Outcome","textWithKeyword":"Then deskripsi berisi skrip tampil sebagai teks biasa","stepMatchArguments":[]},{"pwStepLine":40,"gherkinStepLine":42,"keywordType":"Outcome","textWithKeyword":"And tidak ada dialog yang muncul","stepMatchArguments":[]}]},
  {"pwTestLine":43,"pickleLine":45,"tags":["@sit","@bursa-kasus","@BUR-005","@precondition:login-konsultan"],"steps":[{"pwStepLine":44,"gherkinStepLine":46,"keywordType":"Context","textWithKeyword":"Given klien uji memposting beberapa kasus ke bursa","stepMatchArguments":[]},{"pwStepLine":45,"gherkinStepLine":47,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman bursa kasus","stepMatchArguments":[{"group":{"start":27,"value":"bursa kasus"},"parameterTypeName":"halaman"}]},{"pwStepLine":46,"gherkinStepLine":48,"keywordType":"Action","textWithKeyword":"When pengguna mengurungkan klaim sebuah kasus","stepMatchArguments":[]},{"pwStepLine":47,"gherkinStepLine":49,"keywordType":"Outcome","textWithKeyword":"Then kasus itu tetap terbuka di bursa","stepMatchArguments":[]},{"pwStepLine":48,"gherkinStepLine":50,"keywordType":"Outcome","textWithKeyword":"And tidak ada permintaan klaim kasus yang dikirim ke backend","stepMatchArguments":[{"group":{"start":21,"value":"klaim kasus"},"parameterTypeName":"layanan"}]}]},
  {"pwTestLine":51,"pickleLine":53,"tags":["@sit","@bursa-kasus","@BUR-006","@critical","@precondition:login-konsultan"],"steps":[{"pwStepLine":52,"gherkinStepLine":54,"keywordType":"Context","textWithKeyword":"Given klien uji memposting beberapa kasus ke bursa","stepMatchArguments":[]},{"pwStepLine":53,"gherkinStepLine":55,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman bursa kasus","stepMatchArguments":[{"group":{"start":27,"value":"bursa kasus"},"parameterTypeName":"halaman"}]},{"pwStepLine":54,"gherkinStepLine":56,"keywordType":"Action","textWithKeyword":"When pengguna mengklaim sebuah kasus","stepMatchArguments":[]},{"pwStepLine":55,"gherkinStepLine":57,"keywordType":"Outcome","textWithKeyword":"Then klaim kasus dikonfirmasi berhasil","stepMatchArguments":[]},{"pwStepLine":56,"gherkinStepLine":58,"keywordType":"Outcome","textWithKeyword":"And kasus itu tertutup dan menjadi konsultasi konsultan uji","stepMatchArguments":[]},{"pwStepLine":57,"gherkinStepLine":59,"keywordType":"Action","textWithKeyword":"When pengguna membuka konsultasi hasil klaim","stepMatchArguments":[]},{"pwStepLine":58,"gherkinStepLine":60,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman detail konsultasi itu","stepMatchArguments":[{"group":{"start":30,"value":"detail konsultasi itu"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":61,"pickleLine":63,"tags":["@sit","@bursa-kasus","@BUR-007","@precondition:login-konsultan"],"steps":[{"pwStepLine":62,"gherkinStepLine":64,"keywordType":"Context","textWithKeyword":"Given klien uji memposting beberapa kasus ke bursa","stepMatchArguments":[]},{"pwStepLine":63,"gherkinStepLine":65,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman bursa kasus","stepMatchArguments":[{"group":{"start":27,"value":"bursa kasus"},"parameterTypeName":"halaman"}]},{"pwStepLine":64,"gherkinStepLine":66,"keywordType":"Action","textWithKeyword":"When pengguna mengklaim sebuah kasus","stepMatchArguments":[]},{"pwStepLine":65,"gherkinStepLine":67,"keywordType":"Action","textWithKeyword":"And pengguna kembali ke bursa dari konfirmasi klaim","stepMatchArguments":[]},{"pwStepLine":66,"gherkinStepLine":68,"keywordType":"Outcome","textWithKeyword":"Then daftar bursa tampil kembali","stepMatchArguments":[]}]},
  {"pwTestLine":69,"pickleLine":71,"tags":["@sit","@bursa-kasus","@BUR-008","@precondition:login-konsultan"],"steps":[{"pwStepLine":70,"gherkinStepLine":72,"keywordType":"Context","textWithKeyword":"Given klien uji memposting beberapa kasus ke bursa","stepMatchArguments":[]},{"pwStepLine":71,"gherkinStepLine":73,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman bursa kasus","stepMatchArguments":[{"group":{"start":27,"value":"bursa kasus"},"parameterTypeName":"halaman"}]},{"pwStepLine":72,"gherkinStepLine":74,"keywordType":"Action","textWithKeyword":"When konsultan lain lebih dulu mengambil kasus yang hendak diklaim pengguna","stepMatchArguments":[]},{"pwStepLine":73,"gherkinStepLine":75,"keywordType":"Outcome","textWithKeyword":"Then muncul pemberitahuan \"Kasus ini sudah diklaim oleh konsultan lain\"","stepMatchArguments":[{"group":{"start":21,"value":"\"Kasus ini sudah diklaim oleh konsultan lain\"","children":[{"start":22,"value":"Kasus ini sudah diklaim oleh konsultan lain","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":74,"gherkinStepLine":76,"keywordType":"Outcome","textWithKeyword":"And jendela konfirmasi klaim tertutup","stepMatchArguments":[]}]},
  {"pwTestLine":77,"pickleLine":79,"tags":["@sit","@bursa-kasus","@BUR-009","@precondition:login-konsultan"],"steps":[{"pwStepLine":78,"gherkinStepLine":80,"keywordType":"Context","textWithKeyword":"Given layanan daftar bursa sedang mengalami gangguan","stepMatchArguments":[{"group":{"start":8,"value":"daftar bursa"},"parameterTypeName":"layanan"}]},{"pwStepLine":79,"gherkinStepLine":81,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman bursa kasus","stepMatchArguments":[{"group":{"start":25,"value":"bursa kasus"},"parameterTypeName":"halaman"}]},{"pwStepLine":80,"gherkinStepLine":82,"keywordType":"Outcome","textWithKeyword":"Then bursa menampilkan pesan gagal memuat","stepMatchArguments":[]}]},
  {"pwTestLine":83,"pickleLine":85,"tags":["@sit","@bursa-kasus","@BUR-010","@stub","@precondition:login-konsultan"],"steps":[{"pwStepLine":84,"gherkinStepLine":86,"keywordType":"Context","textWithKeyword":"Given bursa sedang tidak punya kasus terbuka","stepMatchArguments":[]},{"pwStepLine":85,"gherkinStepLine":87,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman bursa kasus","stepMatchArguments":[{"group":{"start":25,"value":"bursa kasus"},"parameterTypeName":"halaman"}]},{"pwStepLine":86,"gherkinStepLine":88,"keywordType":"Outcome","textWithKeyword":"Then bursa menampilkan keadaan kosong","stepMatchArguments":[]}]},
]; // bdd-data-end
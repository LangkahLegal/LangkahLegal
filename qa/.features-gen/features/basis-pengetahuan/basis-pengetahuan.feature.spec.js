// Generated from: features\basis-pengetahuan\basis-pengetahuan.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Basis pengetahuan dokumen hukum', () => {

  test('Daftar dokumen hukum menampilkan nomor, jumlah pasal, dan statusnya', { tag: ['@sit', '@basis-pengetahuan', '@precondition:login-admin', '@KNW-001', '@critical'] }, async ({ Given, When, Then, And, basisPengetahuanPage, page, world }) => { 
    await Given('basis pengetahuan berisi dokumen uji', null, { page, world }); 
    await And('pengguna berada di halaman basis pengetahuan', null, { page, world }); 
    await When('pengguna mencari dokumen uji di basis pengetahuan', null, { basisPengetahuanPage, page, world }); 
    await Then('dokumen uji tampil dengan nomor, jumlah pasal, dan status hukumnya', null, { basisPengetahuanPage, page, world }); 
  });

  test('Pencarian dokumen menunggu admin selesai mengetik', { tag: ['@sit', '@basis-pengetahuan', '@precondition:login-admin', '@KNW-002'] }, async ({ Given, When, Then, basisPengetahuanPage, network, page, world }) => { 
    await Given('pengguna berada di halaman basis pengetahuan', null, { page, world }); 
    await When('pengguna mengetik kata pencarian dokumen huruf demi huruf', null, { basisPengetahuanPage, page, world }); 
    await Then('hanya satu pencarian dokumen yang dikirim ke backend', null, { network, page, world }); 
  });

  test('Dokumen dapat disaring berdasarkan kategori', { tag: ['@sit', '@basis-pengetahuan', '@precondition:login-admin', '@KNW-003'] }, async ({ Given, When, Then, basisPengetahuanPage, network, page, world }) => { 
    await Given('pengguna berada di halaman basis pengetahuan', null, { page, world }); 
    await When('pengguna menyaring dokumen berdasarkan kategori pidana', null, { basisPengetahuanPage, page, world }); 
    await Then('daftar dokumen diminta ke backend dengan kategori itu', null, { network, page, world }); 
  });

  test('Nomor halaman di luar jangkauan dikembalikan ke halaman aktif', { tag: ['@sit', '@basis-pengetahuan', '@precondition:login-admin', '@KNW-003'] }, async ({ Given, When, Then, basisPengetahuanPage, network, page, world }) => { 
    await Given('pengguna berada di halaman basis pengetahuan', null, { page, world }); 
    await When('pengguna berpindah ke halaman dokumen berikutnya lalu mengetik nomor halaman yang tidak ada', null, { basisPengetahuanPage, network, page, world }); 
    await Then('daftar dokumen tetap berada di halaman kedua', null, { basisPengetahuanPage, page, world }); 
  });

  test('Berpindah halaman segera setelah daftar dimuat tidak kembali ke halaman pertama', { tag: ['@sit', '@basis-pengetahuan', '@precondition:login-admin', '@KNW-011'] }, async ({ Given, When, Then, basisPengetahuanPage, page, world }) => { 
    await Given('pengguna berada di halaman basis pengetahuan', null, { page, world }); 
    await When('pengguna langsung berpindah ke halaman dokumen berikutnya', null, { basisPengetahuanPage, page, world }); 
    await Then('daftar dokumen tetap berada di halaman kedua', null, { basisPengetahuanPage, page, world }); 
  });

  test('Admin mengunggah dokumen hukum baru', { tag: ['@sit', '@basis-pengetahuan', '@precondition:login-admin', '@KNW-004', '@stub'] }, async ({ Given, When, Then, And, basisPengetahuanPage, network, page, world }) => { 
    await Given('unggahan dokumen akan diproses sampai selesai', null, { network, page, world }); 
    await And('pengguna berada di halaman basis pengetahuan', null, { page, world }); 
    await When('pengguna mengunggah dokumen hukum baru', null, { basisPengetahuanPage, page, world }); 
    await Then('proses dokumen berjalan lalu dinyatakan selesai', null, { basisPengetahuanPage, page, world }); 
    await And('data dokumen dikirim lengkap ke backend', null, { network, page, world }); 
  });

  test('Formulir unggah belum bisa dikirim sebelum lengkap', { tag: ['@sit', '@basis-pengetahuan', '@precondition:login-admin', '@KNW-004'] }, async ({ Given, When, Then, basisPengetahuanPage, page, world }) => { 
    await Given('pengguna berada di halaman basis pengetahuan', null, { page, world }); 
    await When('pengguna membuka formulir unggah dokumen', null, { basisPengetahuanPage, page, world }); 
    await Then('dokumen belum dapat diunggah', null, { basisPengetahuanPage, page, world }); 
  });

  test('Proses dokumen yang gagal diberitahukan ke admin', { tag: ['@sit', '@basis-pengetahuan', '@precondition:login-admin', '@KNW-005', '@stub'] }, async ({ Given, When, Then, basisPengetahuanPage, network, page, world }) => { 
    await Given('ada proses dokumen yang berakhir gagal', null, { network, page, world }); 
    await When('pengguna membuka halaman basis pengetahuan', null, { page, world }); 
    await Then('kegagalan proses dokumen diberitahukan beserta penyebabnya', null, { basisPengetahuanPage, page, world }); 
  });

  test('Admin menghapus dokumen beserta seluruh pasalnya', { tag: ['@sit', '@basis-pengetahuan', '@precondition:login-admin', '@KNW-006'] }, async ({ Given, When, Then, And, basisPengetahuanPage, page, world }) => { 
    await Given('basis pengetahuan berisi dokumen uji', null, { page, world }); 
    await And('pengguna berada di halaman basis pengetahuan', null, { page, world }); 
    await When('pengguna mencari dokumen uji di basis pengetahuan', null, { basisPengetahuanPage, page, world }); 
    await And('pengguna menghapus dokumen uji itu', null, { basisPengetahuanPage, page, world }); 
    await Then('muncul keterangan dokumen berhasil dihapus', null, { page, world }); 
    await And('dokumen uji beserta pasalnya hilang dari database', null, { page, world }); 
  });

  test('Admin mengganti berkas dokumen yang sudah ada', { tag: ['@sit', '@basis-pengetahuan', '@precondition:login-admin', '@KNW-007', '@stub'] }, async ({ Given, When, Then, And, basisPengetahuanPage, network, page, world }) => { 
    await Given('basis pengetahuan berisi dokumen uji', null, { page, world }); 
    await And('penggantian dokumen akan diproses sampai selesai', null, { network, page, world }); 
    await And('pengguna berada di halaman basis pengetahuan', null, { page, world }); 
    await When('pengguna mencari dokumen uji di basis pengetahuan', null, { basisPengetahuanPage, page, world }); 
    await And('pengguna mengganti berkas dokumen uji itu', null, { basisPengetahuanPage, page, world }); 
    await Then('formulir ganti dokumen terisi data dokumen uji', null, { page, world }); 
    await And('penggantian dikirim ke backend untuk dokumen uji', null, { network, page, world }); 
  });

  test('Tahun undang-undang di luar rentang ditolak', { tag: ['@sit', '@basis-pengetahuan', '@precondition:login-admin', '@KNW-010', '@stub'] }, async ({ Given, When, Then, And, basisPengetahuanPage, network, page, world }) => { 
    await Given('unggahan dokumen akan diproses sampai selesai', null, { network, page, world }); 
    await And('pengguna berada di halaman basis pengetahuan', null, { page, world }); 
    await When('pengguna mengunggah dokumen dengan tahun yang tidak masuk akal', null, { basisPengetahuanPage, page, world }); 
    await Then('tidak ada permintaan unggah dokumen yang dikirim ke backend', null, { network, page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\basis-pengetahuan\\basis-pengetahuan.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":9,"tags":["@sit","@basis-pengetahuan","@precondition:login-admin","@KNW-001","@critical"],"steps":[{"pwStepLine":7,"gherkinStepLine":10,"keywordType":"Context","textWithKeyword":"Given basis pengetahuan berisi dokumen uji","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":11,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman basis pengetahuan","stepMatchArguments":[{"group":{"start":27,"value":"basis pengetahuan"},"parameterTypeName":"halaman"}]},{"pwStepLine":9,"gherkinStepLine":12,"keywordType":"Action","textWithKeyword":"When pengguna mencari dokumen uji di basis pengetahuan","stepMatchArguments":[]},{"pwStepLine":10,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"Then dokumen uji tampil dengan nomor, jumlah pasal, dan status hukumnya","stepMatchArguments":[]}]},
  {"pwTestLine":13,"pickleLine":16,"tags":["@sit","@basis-pengetahuan","@precondition:login-admin","@KNW-002"],"steps":[{"pwStepLine":14,"gherkinStepLine":17,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman basis pengetahuan","stepMatchArguments":[{"group":{"start":27,"value":"basis pengetahuan"},"parameterTypeName":"halaman"}]},{"pwStepLine":15,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"When pengguna mengetik kata pencarian dokumen huruf demi huruf","stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then hanya satu pencarian dokumen yang dikirim ke backend","stepMatchArguments":[]}]},
  {"pwTestLine":19,"pickleLine":22,"tags":["@sit","@basis-pengetahuan","@precondition:login-admin","@KNW-003"],"steps":[{"pwStepLine":20,"gherkinStepLine":23,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman basis pengetahuan","stepMatchArguments":[{"group":{"start":27,"value":"basis pengetahuan"},"parameterTypeName":"halaman"}]},{"pwStepLine":21,"gherkinStepLine":24,"keywordType":"Action","textWithKeyword":"When pengguna menyaring dokumen berdasarkan kategori pidana","stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":25,"keywordType":"Outcome","textWithKeyword":"Then daftar dokumen diminta ke backend dengan kategori itu","stepMatchArguments":[]}]},
  {"pwTestLine":25,"pickleLine":28,"tags":["@sit","@basis-pengetahuan","@precondition:login-admin","@KNW-003"],"steps":[{"pwStepLine":26,"gherkinStepLine":29,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman basis pengetahuan","stepMatchArguments":[{"group":{"start":27,"value":"basis pengetahuan"},"parameterTypeName":"halaman"}]},{"pwStepLine":27,"gherkinStepLine":30,"keywordType":"Action","textWithKeyword":"When pengguna berpindah ke halaman dokumen berikutnya lalu mengetik nomor halaman yang tidak ada","stepMatchArguments":[]},{"pwStepLine":28,"gherkinStepLine":31,"keywordType":"Outcome","textWithKeyword":"Then daftar dokumen tetap berada di halaman kedua","stepMatchArguments":[]}]},
  {"pwTestLine":31,"pickleLine":34,"tags":["@sit","@basis-pengetahuan","@precondition:login-admin","@KNW-011"],"steps":[{"pwStepLine":32,"gherkinStepLine":35,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman basis pengetahuan","stepMatchArguments":[{"group":{"start":27,"value":"basis pengetahuan"},"parameterTypeName":"halaman"}]},{"pwStepLine":33,"gherkinStepLine":36,"keywordType":"Action","textWithKeyword":"When pengguna langsung berpindah ke halaman dokumen berikutnya","stepMatchArguments":[]},{"pwStepLine":34,"gherkinStepLine":37,"keywordType":"Outcome","textWithKeyword":"Then daftar dokumen tetap berada di halaman kedua","stepMatchArguments":[]}]},
  {"pwTestLine":37,"pickleLine":40,"tags":["@sit","@basis-pengetahuan","@precondition:login-admin","@KNW-004","@stub"],"steps":[{"pwStepLine":38,"gherkinStepLine":41,"keywordType":"Context","textWithKeyword":"Given unggahan dokumen akan diproses sampai selesai","stepMatchArguments":[]},{"pwStepLine":39,"gherkinStepLine":42,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman basis pengetahuan","stepMatchArguments":[{"group":{"start":27,"value":"basis pengetahuan"},"parameterTypeName":"halaman"}]},{"pwStepLine":40,"gherkinStepLine":43,"keywordType":"Action","textWithKeyword":"When pengguna mengunggah dokumen hukum baru","stepMatchArguments":[]},{"pwStepLine":41,"gherkinStepLine":44,"keywordType":"Outcome","textWithKeyword":"Then proses dokumen berjalan lalu dinyatakan selesai","stepMatchArguments":[]},{"pwStepLine":42,"gherkinStepLine":45,"keywordType":"Outcome","textWithKeyword":"And data dokumen dikirim lengkap ke backend","stepMatchArguments":[]}]},
  {"pwTestLine":45,"pickleLine":48,"tags":["@sit","@basis-pengetahuan","@precondition:login-admin","@KNW-004"],"steps":[{"pwStepLine":46,"gherkinStepLine":49,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman basis pengetahuan","stepMatchArguments":[{"group":{"start":27,"value":"basis pengetahuan"},"parameterTypeName":"halaman"}]},{"pwStepLine":47,"gherkinStepLine":50,"keywordType":"Action","textWithKeyword":"When pengguna membuka formulir unggah dokumen","stepMatchArguments":[]},{"pwStepLine":48,"gherkinStepLine":51,"keywordType":"Outcome","textWithKeyword":"Then dokumen belum dapat diunggah","stepMatchArguments":[]}]},
  {"pwTestLine":51,"pickleLine":54,"tags":["@sit","@basis-pengetahuan","@precondition:login-admin","@KNW-005","@stub"],"steps":[{"pwStepLine":52,"gherkinStepLine":55,"keywordType":"Context","textWithKeyword":"Given ada proses dokumen yang berakhir gagal","stepMatchArguments":[]},{"pwStepLine":53,"gherkinStepLine":56,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman basis pengetahuan","stepMatchArguments":[{"group":{"start":25,"value":"basis pengetahuan"},"parameterTypeName":"halaman"}]},{"pwStepLine":54,"gherkinStepLine":57,"keywordType":"Outcome","textWithKeyword":"Then kegagalan proses dokumen diberitahukan beserta penyebabnya","stepMatchArguments":[]}]},
  {"pwTestLine":57,"pickleLine":60,"tags":["@sit","@basis-pengetahuan","@precondition:login-admin","@KNW-006"],"steps":[{"pwStepLine":58,"gherkinStepLine":61,"keywordType":"Context","textWithKeyword":"Given basis pengetahuan berisi dokumen uji","stepMatchArguments":[]},{"pwStepLine":59,"gherkinStepLine":62,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman basis pengetahuan","stepMatchArguments":[{"group":{"start":27,"value":"basis pengetahuan"},"parameterTypeName":"halaman"}]},{"pwStepLine":60,"gherkinStepLine":63,"keywordType":"Action","textWithKeyword":"When pengguna mencari dokumen uji di basis pengetahuan","stepMatchArguments":[]},{"pwStepLine":61,"gherkinStepLine":64,"keywordType":"Action","textWithKeyword":"And pengguna menghapus dokumen uji itu","stepMatchArguments":[]},{"pwStepLine":62,"gherkinStepLine":65,"keywordType":"Outcome","textWithKeyword":"Then muncul keterangan dokumen berhasil dihapus","stepMatchArguments":[]},{"pwStepLine":63,"gherkinStepLine":66,"keywordType":"Outcome","textWithKeyword":"And dokumen uji beserta pasalnya hilang dari database","stepMatchArguments":[]}]},
  {"pwTestLine":66,"pickleLine":69,"tags":["@sit","@basis-pengetahuan","@precondition:login-admin","@KNW-007","@stub"],"steps":[{"pwStepLine":67,"gherkinStepLine":70,"keywordType":"Context","textWithKeyword":"Given basis pengetahuan berisi dokumen uji","stepMatchArguments":[]},{"pwStepLine":68,"gherkinStepLine":71,"keywordType":"Context","textWithKeyword":"And penggantian dokumen akan diproses sampai selesai","stepMatchArguments":[]},{"pwStepLine":69,"gherkinStepLine":72,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman basis pengetahuan","stepMatchArguments":[{"group":{"start":27,"value":"basis pengetahuan"},"parameterTypeName":"halaman"}]},{"pwStepLine":70,"gherkinStepLine":73,"keywordType":"Action","textWithKeyword":"When pengguna mencari dokumen uji di basis pengetahuan","stepMatchArguments":[]},{"pwStepLine":71,"gherkinStepLine":74,"keywordType":"Action","textWithKeyword":"And pengguna mengganti berkas dokumen uji itu","stepMatchArguments":[]},{"pwStepLine":72,"gherkinStepLine":75,"keywordType":"Outcome","textWithKeyword":"Then formulir ganti dokumen terisi data dokumen uji","stepMatchArguments":[]},{"pwStepLine":73,"gherkinStepLine":76,"keywordType":"Outcome","textWithKeyword":"And penggantian dikirim ke backend untuk dokumen uji","stepMatchArguments":[]}]},
  {"pwTestLine":76,"pickleLine":79,"tags":["@sit","@basis-pengetahuan","@precondition:login-admin","@KNW-010","@stub"],"steps":[{"pwStepLine":77,"gherkinStepLine":80,"keywordType":"Context","textWithKeyword":"Given unggahan dokumen akan diproses sampai selesai","stepMatchArguments":[]},{"pwStepLine":78,"gherkinStepLine":81,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman basis pengetahuan","stepMatchArguments":[{"group":{"start":27,"value":"basis pengetahuan"},"parameterTypeName":"halaman"}]},{"pwStepLine":79,"gherkinStepLine":82,"keywordType":"Action","textWithKeyword":"When pengguna mengunggah dokumen dengan tahun yang tidak masuk akal","stepMatchArguments":[]},{"pwStepLine":80,"gherkinStepLine":83,"keywordType":"Outcome","textWithKeyword":"Then tidak ada permintaan unggah dokumen yang dikirim ke backend","stepMatchArguments":[{"group":{"start":21,"value":"unggah dokumen"},"parameterTypeName":"layanan"}]}]},
]; // bdd-data-end
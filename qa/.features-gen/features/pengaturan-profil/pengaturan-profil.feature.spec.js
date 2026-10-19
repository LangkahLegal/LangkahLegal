// Generated from: features\pengaturan-profil\pengaturan-profil.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Pengaturan profil', () => {

  test('Klien mengubah namanya', { tag: ['@sit', '@pengaturan-profil', '@PRF-001', '@critical', '@precondition:login-klien'] }, async ({ Given, When, Then, And, page, pengaturanProfilPage, world }) => { 
    await Given('pengguna berada di halaman pengaturan profil', null, { page, world }); 
    await When('pengguna mengganti namanya lalu menyimpan profil', null, { page, pengaturanProfilPage, world }); 
    await Then('pengguna diarahkan ke halaman pengaturan', null, { page, world }); 
    await And('nama baru klien tersimpan di database', null, { page, world }); 
  });

  test('Formulir profil klien tidak memuat kredensial konsultan', { tag: ['@sit', '@pengaturan-profil', '@PRF-001', '@precondition:login-klien'] }, async ({ When, Then, page, pengaturanProfilPage, world }) => { 
    await When('pengguna membuka halaman pengaturan profil', null, { page, world }); 
    await Then('formulir profil terisi data klien tanpa bagian kredensial profesional', null, { page, pengaturanProfilPage, world }); 
  });

  test('Email tidak dapat diubah dari formulir profil', { tag: ['@sit', '@pengaturan-profil', '@PRF-002', '@precondition:login-klien'] }, async ({ When, Then, page, pengaturanProfilPage, world }) => { 
    await When('pengguna membuka halaman pengaturan profil', null, { page, world }); 
    await Then('kolom email profil hanya bisa dibaca', null, { page, pengaturanProfilPage, world }); 
  });

  test('Konsultan memperbarui kredensial profesional dan portofolionya', { tag: ['@sit', '@pengaturan-profil', '@PRF-003'] }, async ({ Given, When, Then, And, auth, page, pengaturanProfilPage, world }) => { 
    await Given('pengguna sudah login sebagai konsultan baru', null, { auth, page, world }); 
    await And('pengguna berada di halaman pengaturan profil', null, { page, world }); 
    await When('pengguna memperbarui kredensial profesional dan portofolionya', null, { page, pengaturanProfilPage, world }); 
    await Then('pengguna diarahkan ke halaman pengaturan', null, { page, world }); 
    await And('kredensial profesional konsultan tersimpan di database beserta portofolionya', null, { page, world }); 
  });

  test('Tarif dan pengalaman bernilai negatif tidak tersimpan', { tag: ['@sit', '@pengaturan-profil', '@PRF-004'] }, async ({ Given, When, Then, And, auth, page, pengaturanProfilPage, world }) => { 
    await Given('pengguna sudah login sebagai konsultan baru', null, { auth, page, world }); 
    await And('pengguna berada di halaman pengaturan profil', null, { page, world }); 
    await When('pengguna mengisi tarif dan pengalaman dengan nilai negatif lalu menyimpan profil', null, { page, pengaturanProfilPage, world }); 
    await Then('nilai negatif tidak tersimpan di database', null, { page, world }); 
  });

  test('Kegagalan menyimpan profil diberitahukan ke pengguna', { tag: ['@sit', '@pengaturan-profil', '@PRF-005', '@precondition:login-klien'] }, async ({ Given, When, Then, And, dialogs, network, page, pengaturanProfilPage, world }) => { 
    await Given('layanan simpan profil sedang mengalami gangguan', null, { network, page, world }); 
    await And('pengguna berada di halaman pengaturan profil', null, { page, world }); 
    await When('pengguna menyimpan profil tanpa perubahan', null, { page, pengaturanProfilPage, world }); 
    await Then('muncul pemberitahuan "Gagal menyimpan perubahan."', null, { dialogs, page, world }); 
    await And('pengguna tetap berada di halaman pengaturan profil', null, { page, world }); 
  });

  test('Foto profil yang terlalu besar ditolak', { tag: ['@sit', '@pengaturan-profil', '@PRF-006', '@precondition:login-klien'] }, async ({ Given, When, Then, dialogs, page, pengaturanProfilPage, world }) => { 
    await Given('pengguna berada di halaman pengaturan profil', null, { page, world }); 
    await When('pengguna mengunggah foto profil yang terlalu besar', null, { page, pengaturanProfilPage, world }); 
    await Then('muncul pemberitahuan "File terlalu besar (max 2MB)"', null, { dialogs, page, world }); 
  });

  test('Foto profil baru tersimpan dan tampil', { tag: ['@sit', '@pengaturan-profil', '@PRF-006', '@stub', '@precondition:login-klien'] }, async ({ Given, When, Then, And, page, pengaturanProfilPage, world }) => { 
    await Given('layanan unggah foto menerima foto profil', null, { page, world }); 
    await And('pengguna berada di halaman pengaturan profil', null, { page, world }); 
    await When('pengguna mengunggah foto profil baru', null, { page, pengaturanProfilPage, world }); 
    await Then('foto profil baru tampil di halaman', null, { page, pengaturanProfilPage, world }); 
    await And('alamat foto baru tersimpan di database', null, { page, world }); 
  });

  test('Kegagalan mengunggah foto diberitahukan ke pengguna', { tag: ['@sit', '@pengaturan-profil', '@PRF-007', '@stub', '@precondition:login-klien'] }, async ({ Given, When, Then, And, dialogs, network, page, pengaturanProfilPage, world }) => { 
    await Given('layanan unggah foto menolak foto profil', null, { page, world }); 
    await And('pengguna berada di halaman pengaturan profil', null, { page, world }); 
    await When('pengguna mengunggah foto profil baru', null, { page, pengaturanProfilPage, world }); 
    await Then('muncul pemberitahuan "Gagal sinkronisasi foto."', null, { dialogs, page, world }); 
    await And('tidak ada permintaan simpan profil yang dikirim ke backend', null, { network, page, world }); 
  });

  test('Konsultan yang ditolak melihat alasan penolakan di profilnya', { tag: ['@sit', '@pengaturan-profil', '@PRF-008'] }, async ({ Given, When, Then, And, auth, page, pengaturanProfilPage, world }) => { 
    await Given('verifikasi konsultan baru ditolak dengan sebuah alasan', null, { page, world }); 
    await And('pengguna sudah login sebagai konsultan baru', null, { auth, page, world }); 
    await When('pengguna membuka halaman pengaturan profil', null, { page, world }); 
    await Then('profil menampilkan penolakan verifikasi beserta alasannya', null, { page, pengaturanProfilPage, world }); 
  });

  test('Label kolom profil terhubung ke kolomnya', { tag: ['@sit', '@pengaturan-profil', '@PRF-009', '@precondition:login-klien'] }, async ({ When, Then, page, world }) => { 
    await When('pengguna membuka halaman pengaturan profil', null, { page, world }); 
    await Then('kolom nama dan email dapat ditemukan lewat labelnya', null, { page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\pengaturan-profil\\pengaturan-profil.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":8,"tags":["@sit","@pengaturan-profil","@PRF-001","@critical","@precondition:login-klien"],"steps":[{"pwStepLine":7,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman pengaturan profil","stepMatchArguments":[{"group":{"start":27,"value":"pengaturan profil"},"parameterTypeName":"halaman"}]},{"pwStepLine":8,"gherkinStepLine":10,"keywordType":"Action","textWithKeyword":"When pengguna mengganti namanya lalu menyimpan profil","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":11,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman pengaturan","stepMatchArguments":[{"group":{"start":30,"value":"pengaturan"},"parameterTypeName":"halaman"}]},{"pwStepLine":10,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"And nama baru klien tersimpan di database","stepMatchArguments":[]}]},
  {"pwTestLine":13,"pickleLine":15,"tags":["@sit","@pengaturan-profil","@PRF-001","@precondition:login-klien"],"steps":[{"pwStepLine":14,"gherkinStepLine":16,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman pengaturan profil","stepMatchArguments":[{"group":{"start":25,"value":"pengaturan profil"},"parameterTypeName":"halaman"}]},{"pwStepLine":15,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"Then formulir profil terisi data klien tanpa bagian kredensial profesional","stepMatchArguments":[]}]},
  {"pwTestLine":18,"pickleLine":20,"tags":["@sit","@pengaturan-profil","@PRF-002","@precondition:login-klien"],"steps":[{"pwStepLine":19,"gherkinStepLine":21,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman pengaturan profil","stepMatchArguments":[{"group":{"start":25,"value":"pengaturan profil"},"parameterTypeName":"halaman"}]},{"pwStepLine":20,"gherkinStepLine":22,"keywordType":"Outcome","textWithKeyword":"Then kolom email profil hanya bisa dibaca","stepMatchArguments":[]}]},
  {"pwTestLine":23,"pickleLine":25,"tags":["@sit","@pengaturan-profil","@PRF-003"],"steps":[{"pwStepLine":24,"gherkinStepLine":26,"keywordType":"Context","textWithKeyword":"Given pengguna sudah login sebagai konsultan baru","stepMatchArguments":[{"group":{"start":29,"value":"konsultan baru"},"parameterTypeName":"akun"}]},{"pwStepLine":25,"gherkinStepLine":27,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman pengaturan profil","stepMatchArguments":[{"group":{"start":27,"value":"pengaturan profil"},"parameterTypeName":"halaman"}]},{"pwStepLine":26,"gherkinStepLine":28,"keywordType":"Action","textWithKeyword":"When pengguna memperbarui kredensial profesional dan portofolionya","stepMatchArguments":[]},{"pwStepLine":27,"gherkinStepLine":29,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman pengaturan","stepMatchArguments":[{"group":{"start":30,"value":"pengaturan"},"parameterTypeName":"halaman"}]},{"pwStepLine":28,"gherkinStepLine":30,"keywordType":"Outcome","textWithKeyword":"And kredensial profesional konsultan tersimpan di database beserta portofolionya","stepMatchArguments":[]}]},
  {"pwTestLine":31,"pickleLine":33,"tags":["@sit","@pengaturan-profil","@PRF-004"],"steps":[{"pwStepLine":32,"gherkinStepLine":34,"keywordType":"Context","textWithKeyword":"Given pengguna sudah login sebagai konsultan baru","stepMatchArguments":[{"group":{"start":29,"value":"konsultan baru"},"parameterTypeName":"akun"}]},{"pwStepLine":33,"gherkinStepLine":35,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman pengaturan profil","stepMatchArguments":[{"group":{"start":27,"value":"pengaturan profil"},"parameterTypeName":"halaman"}]},{"pwStepLine":34,"gherkinStepLine":36,"keywordType":"Action","textWithKeyword":"When pengguna mengisi tarif dan pengalaman dengan nilai negatif lalu menyimpan profil","stepMatchArguments":[]},{"pwStepLine":35,"gherkinStepLine":37,"keywordType":"Outcome","textWithKeyword":"Then nilai negatif tidak tersimpan di database","stepMatchArguments":[]}]},
  {"pwTestLine":38,"pickleLine":40,"tags":["@sit","@pengaturan-profil","@PRF-005","@precondition:login-klien"],"steps":[{"pwStepLine":39,"gherkinStepLine":41,"keywordType":"Context","textWithKeyword":"Given layanan simpan profil sedang mengalami gangguan","stepMatchArguments":[{"group":{"start":8,"value":"simpan profil"},"parameterTypeName":"layanan"}]},{"pwStepLine":40,"gherkinStepLine":42,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman pengaturan profil","stepMatchArguments":[{"group":{"start":27,"value":"pengaturan profil"},"parameterTypeName":"halaman"}]},{"pwStepLine":41,"gherkinStepLine":43,"keywordType":"Action","textWithKeyword":"When pengguna menyimpan profil tanpa perubahan","stepMatchArguments":[]},{"pwStepLine":42,"gherkinStepLine":44,"keywordType":"Outcome","textWithKeyword":"Then muncul pemberitahuan \"Gagal menyimpan perubahan.\"","stepMatchArguments":[{"group":{"start":21,"value":"\"Gagal menyimpan perubahan.\"","children":[{"start":22,"value":"Gagal menyimpan perubahan.","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":43,"gherkinStepLine":45,"keywordType":"Outcome","textWithKeyword":"And pengguna tetap berada di halaman pengaturan profil","stepMatchArguments":[{"group":{"start":33,"value":"pengaturan profil"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":46,"pickleLine":48,"tags":["@sit","@pengaturan-profil","@PRF-006","@precondition:login-klien"],"steps":[{"pwStepLine":47,"gherkinStepLine":49,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman pengaturan profil","stepMatchArguments":[{"group":{"start":27,"value":"pengaturan profil"},"parameterTypeName":"halaman"}]},{"pwStepLine":48,"gherkinStepLine":50,"keywordType":"Action","textWithKeyword":"When pengguna mengunggah foto profil yang terlalu besar","stepMatchArguments":[]},{"pwStepLine":49,"gherkinStepLine":51,"keywordType":"Outcome","textWithKeyword":"Then muncul pemberitahuan \"File terlalu besar (max 2MB)\"","stepMatchArguments":[{"group":{"start":21,"value":"\"File terlalu besar (max 2MB)\"","children":[{"start":22,"value":"File terlalu besar (max 2MB)","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":52,"pickleLine":54,"tags":["@sit","@pengaturan-profil","@PRF-006","@stub","@precondition:login-klien"],"steps":[{"pwStepLine":53,"gherkinStepLine":55,"keywordType":"Context","textWithKeyword":"Given layanan unggah foto menerima foto profil","stepMatchArguments":[]},{"pwStepLine":54,"gherkinStepLine":56,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman pengaturan profil","stepMatchArguments":[{"group":{"start":27,"value":"pengaturan profil"},"parameterTypeName":"halaman"}]},{"pwStepLine":55,"gherkinStepLine":57,"keywordType":"Action","textWithKeyword":"When pengguna mengunggah foto profil baru","stepMatchArguments":[]},{"pwStepLine":56,"gherkinStepLine":58,"keywordType":"Outcome","textWithKeyword":"Then foto profil baru tampil di halaman","stepMatchArguments":[]},{"pwStepLine":57,"gherkinStepLine":59,"keywordType":"Outcome","textWithKeyword":"And alamat foto baru tersimpan di database","stepMatchArguments":[]}]},
  {"pwTestLine":60,"pickleLine":62,"tags":["@sit","@pengaturan-profil","@PRF-007","@stub","@precondition:login-klien"],"steps":[{"pwStepLine":61,"gherkinStepLine":63,"keywordType":"Context","textWithKeyword":"Given layanan unggah foto menolak foto profil","stepMatchArguments":[]},{"pwStepLine":62,"gherkinStepLine":64,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman pengaturan profil","stepMatchArguments":[{"group":{"start":27,"value":"pengaturan profil"},"parameterTypeName":"halaman"}]},{"pwStepLine":63,"gherkinStepLine":65,"keywordType":"Action","textWithKeyword":"When pengguna mengunggah foto profil baru","stepMatchArguments":[]},{"pwStepLine":64,"gherkinStepLine":66,"keywordType":"Outcome","textWithKeyword":"Then muncul pemberitahuan \"Gagal sinkronisasi foto.\"","stepMatchArguments":[{"group":{"start":21,"value":"\"Gagal sinkronisasi foto.\"","children":[{"start":22,"value":"Gagal sinkronisasi foto.","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":65,"gherkinStepLine":67,"keywordType":"Outcome","textWithKeyword":"And tidak ada permintaan simpan profil yang dikirim ke backend","stepMatchArguments":[{"group":{"start":21,"value":"simpan profil"},"parameterTypeName":"layanan"}]}]},
  {"pwTestLine":68,"pickleLine":70,"tags":["@sit","@pengaturan-profil","@PRF-008"],"steps":[{"pwStepLine":69,"gherkinStepLine":71,"keywordType":"Context","textWithKeyword":"Given verifikasi konsultan baru ditolak dengan sebuah alasan","stepMatchArguments":[]},{"pwStepLine":70,"gherkinStepLine":72,"keywordType":"Context","textWithKeyword":"And pengguna sudah login sebagai konsultan baru","stepMatchArguments":[{"group":{"start":29,"value":"konsultan baru"},"parameterTypeName":"akun"}]},{"pwStepLine":71,"gherkinStepLine":73,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman pengaturan profil","stepMatchArguments":[{"group":{"start":25,"value":"pengaturan profil"},"parameterTypeName":"halaman"}]},{"pwStepLine":72,"gherkinStepLine":74,"keywordType":"Outcome","textWithKeyword":"Then profil menampilkan penolakan verifikasi beserta alasannya","stepMatchArguments":[]}]},
  {"pwTestLine":75,"pickleLine":77,"tags":["@sit","@pengaturan-profil","@PRF-009","@precondition:login-klien"],"steps":[{"pwStepLine":76,"gherkinStepLine":78,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman pengaturan profil","stepMatchArguments":[{"group":{"start":25,"value":"pengaturan profil"},"parameterTypeName":"halaman"}]},{"pwStepLine":77,"gherkinStepLine":79,"keywordType":"Outcome","textWithKeyword":"Then kolom nama dan email dapat ditemukan lewat labelnya","stepMatchArguments":[]}]},
]; // bdd-data-end
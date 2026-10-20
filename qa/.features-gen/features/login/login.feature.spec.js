// Generated from: features\login\login.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Login', () => {

  test('Klien berhasil login', { tag: ['@sit', '@login', '@AUTH-001', '@critical', '@mobile'] }, async ({ When, Then, And, loginPage, page, world }) => { 
    await When('pengguna login sebagai klien', null, { loginPage, page, world }); 
    await Then('pengguna diarahkan ke halaman dashboard klien', null, { page, world }); 
    await And('sesi klien tersimpan di browser', null, { page, world }); 
  });

  test('Konsultan berhasil login', { tag: ['@sit', '@login', '@AUTH-002', '@critical'] }, async ({ When, Then, And, loginPage, page, world }) => { 
    await When('pengguna login sebagai konsultan', null, { loginPage, page, world }); 
    await Then('pengguna diarahkan ke halaman dashboard konsultan', null, { page, world }); 
    await And('sesi konsultan tersimpan di browser', null, { page, world }); 
  });

  test('Admin berhasil login', { tag: ['@sit', '@login', '@AUTH-003', '@critical'] }, async ({ When, Then, And, loginPage, page, world }) => { 
    await When('pengguna login sebagai admin', null, { loginPage, page, world }); 
    await Then('pengguna diarahkan ke halaman dashboard admin', null, { page, world }); 
    await And('sesi admin tersimpan di browser', null, { page, world }); 
  });

  test('Akun yang belum punya peran diminta memilih peran', { tag: ['@sit', '@login', '@AUTH-004'] }, async ({ When, Then, loginPage, page, world }) => { 
    await When('pengguna login sebagai akun tanpa peran', null, { loginPage, page, world }); 
    await Then('pengguna diarahkan ke halaman pemilihan peran', null, { page, world }); 
  });

  test('Kata sandi yang salah ditolak', { tag: ['@sit', '@login', '@AUTH-005', '@critical'] }, async ({ When, Then, And, loginPage, page, world }) => { 
    await When('pengguna login dengan kata sandi yang salah', null, { loginPage, page, world }); 
    await Then('pesan galat login adalah "Invalid login credentials"', null, { loginPage, page, world }); 
    await And('pengguna tetap berada di halaman login', null, { page, world }); 
    await And('tidak ada sesi yang tersimpan di browser', null, { page, world }); 
    await And('pengguna dapat mencoba login kembali', null, { loginPage, page, world }); 
  });

  test('Login tanpa kata sandi ditolak sebelum dikirim', { tag: ['@sit', '@login', '@AUTH-006'] }, async ({ When, Then, And, loginPage, network, page, world }) => { 
    await When('pengguna login tanpa mengisi kata sandi', null, { loginPage, page, world }); 
    await Then('pesan galat login adalah "Password wajib diisi."', null, { loginPage, page, world }); 
    await And('tidak ada permintaan login yang dikirim ke backend', null, { network, page, world }); 
  });

  test('Login tanpa email ditolak peramban', { tag: ['@sit', '@login', '@AUTH-007'] }, async ({ When, Then, And, loginPage, network, page, world }) => { 
    await When('pengguna login dengan email yang kosong', null, { loginPage, page, world }); 
    await Then('kolom email login ditandai kosong', null, { loginPage, page, world }); 
    await And('tidak ada permintaan login yang dikirim ke backend', null, { network, page, world }); 
  });

  test('Login dengan email salah format ditolak peramban', { tag: ['@sit', '@login', '@AUTH-007'] }, async ({ When, Then, And, loginPage, network, page, world }) => { 
    await When('pengguna login dengan email yang salah format', null, { loginPage, page, world }); 
    await Then('kolom email login ditandai salah format', null, { loginPage, page, world }); 
    await And('tidak ada permintaan login yang dikirim ke backend', null, { network, page, world }); 
  });

  test('Gangguan server saat login diberitahukan ke pengguna', { tag: ['@sit', '@login', '@AUTH-008'] }, async ({ Given, When, Then, And, loginPage, network, page, pageErrors, world }) => { 
    await Given('layanan login sedang mengalami gangguan', null, { network, page, world }); 
    await When('pengguna login sebagai klien', null, { loginPage, page, world }); 
    await Then('pesan galat login tampil', null, { loginPage, page, world }); 
    await And('pengguna dapat mencoba login kembali', null, { loginPage, page, world }); 
    await And('halaman tidak mengalami galat', null, { page, pageErrors, world }); 
  });

  test('Koneksi terputus saat login diberitahukan ke pengguna', { tag: ['@sit', '@login', '@AUTH-008'] }, async ({ Given, When, Then, And, loginPage, network, page, pageErrors, world }) => { 
    await Given('layanan login tidak dapat dihubungi', null, { network, page, world }); 
    await When('pengguna login sebagai klien', null, { loginPage, page, world }); 
    await Then('pesan galat login memuat "Network Error"', null, { loginPage, page, world }); 
    await And('halaman tidak mengalami galat', null, { page, pageErrors, world }); 
  });

  test('Login yang sedang diproses tidak bisa dikirim dua kali', { tag: ['@sit', '@login', '@AUTH-009'] }, async ({ Given, When, Then, And, loginPage, network, page, world }) => { 
    await Given('layanan login merespons lambat', null, { network, page, world }); 
    await When('pengguna login sebagai klien', null, { loginPage, page, world }); 
    await Then('tombol masuk terkunci selama login diproses', null, { loginPage, page, world }); 
    await When('pengguna menekan tombol masuk sekali lagi', null, { loginPage, page, world }); 
    await Then('pengguna diarahkan ke halaman dashboard klien', null, { page, world }); 
    await And('hanya ada 1 permintaan login yang dikirim ke backend', null, { network, page, world }); 
  });

  test('Kata sandi dapat ditampilkan dan disembunyikan', { tag: ['@sit', '@login', '@AUTH-010'] }, async ({ Given, When, Then, loginPage, page, world }) => { 
    await Given('pengguna berada di halaman login', null, { page, world }); 
    await When('pengguna mengetik kata sandi login', null, { loginPage, page, world }); 
    await Then('kata sandi login tersembunyi', null, { loginPage, page, world }); 
    await When('pengguna memilih menampilkan kata sandi', null, { loginPage, page, world }); 
    await Then('kata sandi login terlihat', null, { loginPage, page, world }); 
    await When('pengguna memilih menyembunyikan kata sandi', null, { loginPage, page, world }); 
    await Then('kata sandi login tersembunyi', null, { loginPage, page, world }); 
  });

  test('Pesan galat berisi skrip tidak dijalankan browser', { tag: ['@sit', '@login', '@AUTH-011', '@stub'] }, async ({ Given, When, Then, And, dialogs, loginPage, network, page, world }) => { 
    await Given('layanan login menolak dengan pesan berisi skrip', null, { network, page, world }); 
    await When('pengguna login dengan kata sandi berisi perintah SQL', null, { loginPage, page, world }); 
    await Then('pesan galat login menampilkan skrip itu sebagai teks biasa', null, { loginPage, page, world }); 
    await And('tidak ada dialog yang muncul', null, { dialogs, page, world }); 
  });

  test('Pengguna yang lupa kata sandi menuju halaman pemulihan dari login', { tag: ['@sit', '@login', '@AUTH-012'] }, async ({ Given, When, Then, loginPage, page, world }) => { 
    await Given('pengguna berada di halaman login', null, { page, world }); 
    await When('pengguna memilih tautan lupa kata sandi', null, { loginPage, page, world }); 
    await Then('pengguna diarahkan ke halaman lupa kata sandi', null, { page, world }); 
  });

  test('Pengunjung yang belum punya akun menuju pendaftaran dari login', { tag: ['@sit', '@login', '@AUTH-012'] }, async ({ Given, When, Then, loginPage, page, world }) => { 
    await Given('pengguna berada di halaman login', null, { page, world }); 
    await When('pengguna memilih tautan daftar', null, { loginPage, page, world }); 
    await Then('pengguna diarahkan ke halaman pemilihan peran', null, { page, world }); 
  });

  test('Pengguna yang sudah login tidak perlu melihat halaman login lagi', { tag: ['@sit', '@login', '@AUTH-013', '@precondition:login-klien'] }, async ({ When, Then, page, world }) => { 
    await When('pengguna membuka halaman login', null, { page, world }); 
    await Then('pengguna diarahkan ke halaman dashboard klien', null, { page, world }); 
  });

  test('Login Google membawa pengguna ke halaman persetujuan Google', { tag: ['@sit', '@login', '@AUTH-014'] }, async ({ Given, When, Then, And, loginPage, network, page, world }) => { 
    await Given('pengguna berada di halaman login', null, { page, world }); 
    await When('pengguna memilih masuk dengan Google', null, { loginPage, page, world }); 
    await Then('browser berpindah ke penyedia login Google', null, { page, world }); 
    await And('Google diminta mengembalikan pengguna ke halaman callback', null, { network, page, world }); 
    await And('kode verifikasi OAuth tersimpan di browser', null, { loginPage, page, world }); 
  });

  test('Login Google yang gagal disiapkan diberitahukan ke pengguna', { tag: ['@sit', '@login', '@AUTH-015', '@stub'] }, async ({ Given, When, Then, And, loginPage, network, page, world }) => { 
    await Given('layanan login Google tidak memberikan alamat tujuan', null, { network, page, world }); 
    await And('pengguna berada di halaman login', null, { page, world }); 
    await When('pengguna memilih masuk dengan Google', null, { loginPage, page, world }); 
    await Then('pesan galat login adalah "Gagal menyiapkan login Google."', null, { loginPage, page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\login\\login.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":6,"tags":["@sit","@login","@AUTH-001","@critical","@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Action","textWithKeyword":"When pengguna login sebagai klien","stepMatchArguments":[{"group":{"start":23,"value":"klien"},"parameterTypeName":"akun"}]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman dashboard klien","stepMatchArguments":[{"group":{"start":30,"value":"dashboard klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":9,"gherkinStepLine":9,"keywordType":"Outcome","textWithKeyword":"And sesi klien tersimpan di browser","stepMatchArguments":[{"group":{"start":5,"value":"klien"},"parameterTypeName":"akun"}]}]},
  {"pwTestLine":12,"pickleLine":12,"tags":["@sit","@login","@AUTH-002","@critical"],"steps":[{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Action","textWithKeyword":"When pengguna login sebagai konsultan","stepMatchArguments":[{"group":{"start":23,"value":"konsultan"},"parameterTypeName":"akun"}]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman dashboard konsultan","stepMatchArguments":[{"group":{"start":30,"value":"dashboard konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"And sesi konsultan tersimpan di browser","stepMatchArguments":[{"group":{"start":5,"value":"konsultan"},"parameterTypeName":"akun"}]}]},
  {"pwTestLine":18,"pickleLine":18,"tags":["@sit","@login","@AUTH-003","@critical"],"steps":[{"pwStepLine":19,"gherkinStepLine":19,"keywordType":"Action","textWithKeyword":"When pengguna login sebagai admin","stepMatchArguments":[{"group":{"start":23,"value":"admin"},"parameterTypeName":"akun"}]},{"pwStepLine":20,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman dashboard admin","stepMatchArguments":[{"group":{"start":30,"value":"dashboard admin"},"parameterTypeName":"halaman"}]},{"pwStepLine":21,"gherkinStepLine":21,"keywordType":"Outcome","textWithKeyword":"And sesi admin tersimpan di browser","stepMatchArguments":[{"group":{"start":5,"value":"admin"},"parameterTypeName":"akun"}]}]},
  {"pwTestLine":24,"pickleLine":24,"tags":["@sit","@login","@AUTH-004"],"steps":[{"pwStepLine":25,"gherkinStepLine":25,"keywordType":"Action","textWithKeyword":"When pengguna login sebagai akun tanpa peran","stepMatchArguments":[{"group":{"start":23,"value":"akun tanpa peran"},"parameterTypeName":"akun"}]},{"pwStepLine":26,"gherkinStepLine":26,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman pemilihan peran","stepMatchArguments":[{"group":{"start":30,"value":"pemilihan peran"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":29,"pickleLine":29,"tags":["@sit","@login","@AUTH-005","@critical"],"steps":[{"pwStepLine":30,"gherkinStepLine":30,"keywordType":"Action","textWithKeyword":"When pengguna login dengan kata sandi yang salah","stepMatchArguments":[]},{"pwStepLine":31,"gherkinStepLine":31,"keywordType":"Outcome","textWithKeyword":"Then pesan galat login adalah \"Invalid login credentials\"","stepMatchArguments":[{"group":{"start":25,"value":"\"Invalid login credentials\"","children":[{"start":26,"value":"Invalid login credentials","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":32,"gherkinStepLine":32,"keywordType":"Outcome","textWithKeyword":"And pengguna tetap berada di halaman login","stepMatchArguments":[{"group":{"start":33,"value":"login"},"parameterTypeName":"halaman"}]},{"pwStepLine":33,"gherkinStepLine":33,"keywordType":"Outcome","textWithKeyword":"And tidak ada sesi yang tersimpan di browser","stepMatchArguments":[]},{"pwStepLine":34,"gherkinStepLine":34,"keywordType":"Outcome","textWithKeyword":"And pengguna dapat mencoba login kembali","stepMatchArguments":[]}]},
  {"pwTestLine":37,"pickleLine":37,"tags":["@sit","@login","@AUTH-006"],"steps":[{"pwStepLine":38,"gherkinStepLine":38,"keywordType":"Action","textWithKeyword":"When pengguna login tanpa mengisi kata sandi","stepMatchArguments":[]},{"pwStepLine":39,"gherkinStepLine":39,"keywordType":"Outcome","textWithKeyword":"Then pesan galat login adalah \"Password wajib diisi.\"","stepMatchArguments":[{"group":{"start":25,"value":"\"Password wajib diisi.\"","children":[{"start":26,"value":"Password wajib diisi.","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":40,"gherkinStepLine":40,"keywordType":"Outcome","textWithKeyword":"And tidak ada permintaan login yang dikirim ke backend","stepMatchArguments":[{"group":{"start":21,"value":"login"},"parameterTypeName":"layanan"}]}]},
  {"pwTestLine":43,"pickleLine":43,"tags":["@sit","@login","@AUTH-007"],"steps":[{"pwStepLine":44,"gherkinStepLine":44,"keywordType":"Action","textWithKeyword":"When pengguna login dengan email yang kosong","stepMatchArguments":[{"group":{"start":33,"value":"kosong"},"parameterTypeName":"emailTidakValid"}]},{"pwStepLine":45,"gherkinStepLine":45,"keywordType":"Outcome","textWithKeyword":"Then kolom email login ditandai kosong","stepMatchArguments":[{"group":{"start":27,"value":"kosong"},"parameterTypeName":"emailTidakValid"}]},{"pwStepLine":46,"gherkinStepLine":46,"keywordType":"Outcome","textWithKeyword":"And tidak ada permintaan login yang dikirim ke backend","stepMatchArguments":[{"group":{"start":21,"value":"login"},"parameterTypeName":"layanan"}]}]},
  {"pwTestLine":49,"pickleLine":49,"tags":["@sit","@login","@AUTH-007"],"steps":[{"pwStepLine":50,"gherkinStepLine":50,"keywordType":"Action","textWithKeyword":"When pengguna login dengan email yang salah format","stepMatchArguments":[{"group":{"start":33,"value":"salah format"},"parameterTypeName":"emailTidakValid"}]},{"pwStepLine":51,"gherkinStepLine":51,"keywordType":"Outcome","textWithKeyword":"Then kolom email login ditandai salah format","stepMatchArguments":[{"group":{"start":27,"value":"salah format"},"parameterTypeName":"emailTidakValid"}]},{"pwStepLine":52,"gherkinStepLine":52,"keywordType":"Outcome","textWithKeyword":"And tidak ada permintaan login yang dikirim ke backend","stepMatchArguments":[{"group":{"start":21,"value":"login"},"parameterTypeName":"layanan"}]}]},
  {"pwTestLine":55,"pickleLine":55,"tags":["@sit","@login","@AUTH-008"],"steps":[{"pwStepLine":56,"gherkinStepLine":56,"keywordType":"Context","textWithKeyword":"Given layanan login sedang mengalami gangguan","stepMatchArguments":[{"group":{"start":8,"value":"login"},"parameterTypeName":"layanan"}]},{"pwStepLine":57,"gherkinStepLine":57,"keywordType":"Action","textWithKeyword":"When pengguna login sebagai klien","stepMatchArguments":[{"group":{"start":23,"value":"klien"},"parameterTypeName":"akun"}]},{"pwStepLine":58,"gherkinStepLine":58,"keywordType":"Outcome","textWithKeyword":"Then pesan galat login tampil","stepMatchArguments":[]},{"pwStepLine":59,"gherkinStepLine":59,"keywordType":"Outcome","textWithKeyword":"And pengguna dapat mencoba login kembali","stepMatchArguments":[]},{"pwStepLine":60,"gherkinStepLine":60,"keywordType":"Outcome","textWithKeyword":"And halaman tidak mengalami galat","stepMatchArguments":[]}]},
  {"pwTestLine":63,"pickleLine":63,"tags":["@sit","@login","@AUTH-008"],"steps":[{"pwStepLine":64,"gherkinStepLine":64,"keywordType":"Context","textWithKeyword":"Given layanan login tidak dapat dihubungi","stepMatchArguments":[{"group":{"start":8,"value":"login"},"parameterTypeName":"layanan"}]},{"pwStepLine":65,"gherkinStepLine":65,"keywordType":"Action","textWithKeyword":"When pengguna login sebagai klien","stepMatchArguments":[{"group":{"start":23,"value":"klien"},"parameterTypeName":"akun"}]},{"pwStepLine":66,"gherkinStepLine":66,"keywordType":"Outcome","textWithKeyword":"Then pesan galat login memuat \"Network Error\"","stepMatchArguments":[{"group":{"start":25,"value":"\"Network Error\"","children":[{"start":26,"value":"Network Error","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":67,"gherkinStepLine":67,"keywordType":"Outcome","textWithKeyword":"And halaman tidak mengalami galat","stepMatchArguments":[]}]},
  {"pwTestLine":70,"pickleLine":70,"tags":["@sit","@login","@AUTH-009"],"steps":[{"pwStepLine":71,"gherkinStepLine":71,"keywordType":"Context","textWithKeyword":"Given layanan login merespons lambat","stepMatchArguments":[{"group":{"start":8,"value":"login"},"parameterTypeName":"layanan"}]},{"pwStepLine":72,"gherkinStepLine":72,"keywordType":"Action","textWithKeyword":"When pengguna login sebagai klien","stepMatchArguments":[{"group":{"start":23,"value":"klien"},"parameterTypeName":"akun"}]},{"pwStepLine":73,"gherkinStepLine":73,"keywordType":"Outcome","textWithKeyword":"Then tombol masuk terkunci selama login diproses","stepMatchArguments":[]},{"pwStepLine":74,"gherkinStepLine":74,"keywordType":"Action","textWithKeyword":"When pengguna menekan tombol masuk sekali lagi","stepMatchArguments":[]},{"pwStepLine":75,"gherkinStepLine":75,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman dashboard klien","stepMatchArguments":[{"group":{"start":30,"value":"dashboard klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":76,"gherkinStepLine":76,"keywordType":"Outcome","textWithKeyword":"And hanya ada 1 permintaan login yang dikirim ke backend","stepMatchArguments":[{"group":{"start":10,"value":"1"},"parameterTypeName":"int"},{"group":{"start":23,"value":"login"},"parameterTypeName":"layanan"}]}]},
  {"pwTestLine":79,"pickleLine":79,"tags":["@sit","@login","@AUTH-010"],"steps":[{"pwStepLine":80,"gherkinStepLine":80,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman login","stepMatchArguments":[{"group":{"start":27,"value":"login"},"parameterTypeName":"halaman"}]},{"pwStepLine":81,"gherkinStepLine":81,"keywordType":"Action","textWithKeyword":"When pengguna mengetik kata sandi login","stepMatchArguments":[]},{"pwStepLine":82,"gherkinStepLine":82,"keywordType":"Outcome","textWithKeyword":"Then kata sandi login tersembunyi","stepMatchArguments":[]},{"pwStepLine":83,"gherkinStepLine":83,"keywordType":"Action","textWithKeyword":"When pengguna memilih menampilkan kata sandi","stepMatchArguments":[]},{"pwStepLine":84,"gherkinStepLine":84,"keywordType":"Outcome","textWithKeyword":"Then kata sandi login terlihat","stepMatchArguments":[]},{"pwStepLine":85,"gherkinStepLine":85,"keywordType":"Action","textWithKeyword":"When pengguna memilih menyembunyikan kata sandi","stepMatchArguments":[]},{"pwStepLine":86,"gherkinStepLine":86,"keywordType":"Outcome","textWithKeyword":"Then kata sandi login tersembunyi","stepMatchArguments":[]}]},
  {"pwTestLine":89,"pickleLine":89,"tags":["@sit","@login","@AUTH-011","@stub"],"steps":[{"pwStepLine":90,"gherkinStepLine":90,"keywordType":"Context","textWithKeyword":"Given layanan login menolak dengan pesan berisi skrip","stepMatchArguments":[{"group":{"start":8,"value":"login"},"parameterTypeName":"layanan"}]},{"pwStepLine":91,"gherkinStepLine":91,"keywordType":"Action","textWithKeyword":"When pengguna login dengan kata sandi berisi perintah SQL","stepMatchArguments":[]},{"pwStepLine":92,"gherkinStepLine":92,"keywordType":"Outcome","textWithKeyword":"Then pesan galat login menampilkan skrip itu sebagai teks biasa","stepMatchArguments":[]},{"pwStepLine":93,"gherkinStepLine":93,"keywordType":"Outcome","textWithKeyword":"And tidak ada dialog yang muncul","stepMatchArguments":[]}]},
  {"pwTestLine":96,"pickleLine":96,"tags":["@sit","@login","@AUTH-012"],"steps":[{"pwStepLine":97,"gherkinStepLine":97,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman login","stepMatchArguments":[{"group":{"start":27,"value":"login"},"parameterTypeName":"halaman"}]},{"pwStepLine":98,"gherkinStepLine":98,"keywordType":"Action","textWithKeyword":"When pengguna memilih tautan lupa kata sandi","stepMatchArguments":[{"group":{"start":24,"value":"lupa kata sandi"},"parameterTypeName":"tautanLogin"}]},{"pwStepLine":99,"gherkinStepLine":99,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman lupa kata sandi","stepMatchArguments":[{"group":{"start":30,"value":"lupa kata sandi"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":102,"pickleLine":102,"tags":["@sit","@login","@AUTH-012"],"steps":[{"pwStepLine":103,"gherkinStepLine":103,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman login","stepMatchArguments":[{"group":{"start":27,"value":"login"},"parameterTypeName":"halaman"}]},{"pwStepLine":104,"gherkinStepLine":104,"keywordType":"Action","textWithKeyword":"When pengguna memilih tautan daftar","stepMatchArguments":[{"group":{"start":24,"value":"daftar"},"parameterTypeName":"tautanLogin"}]},{"pwStepLine":105,"gherkinStepLine":105,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman pemilihan peran","stepMatchArguments":[{"group":{"start":30,"value":"pemilihan peran"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":108,"pickleLine":108,"tags":["@sit","@login","@AUTH-013","@precondition:login-klien"],"steps":[{"pwStepLine":109,"gherkinStepLine":109,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman login","stepMatchArguments":[{"group":{"start":25,"value":"login"},"parameterTypeName":"halaman"}]},{"pwStepLine":110,"gherkinStepLine":110,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman dashboard klien","stepMatchArguments":[{"group":{"start":30,"value":"dashboard klien"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":113,"pickleLine":113,"tags":["@sit","@login","@AUTH-014"],"steps":[{"pwStepLine":114,"gherkinStepLine":114,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman login","stepMatchArguments":[{"group":{"start":27,"value":"login"},"parameterTypeName":"halaman"}]},{"pwStepLine":115,"gherkinStepLine":115,"keywordType":"Action","textWithKeyword":"When pengguna memilih masuk dengan Google","stepMatchArguments":[]},{"pwStepLine":116,"gherkinStepLine":116,"keywordType":"Outcome","textWithKeyword":"Then browser berpindah ke penyedia login Google","stepMatchArguments":[]},{"pwStepLine":117,"gherkinStepLine":117,"keywordType":"Outcome","textWithKeyword":"And Google diminta mengembalikan pengguna ke halaman callback","stepMatchArguments":[]},{"pwStepLine":118,"gherkinStepLine":118,"keywordType":"Outcome","textWithKeyword":"And kode verifikasi OAuth tersimpan di browser","stepMatchArguments":[]}]},
  {"pwTestLine":121,"pickleLine":121,"tags":["@sit","@login","@AUTH-015","@stub"],"steps":[{"pwStepLine":122,"gherkinStepLine":122,"keywordType":"Context","textWithKeyword":"Given layanan login Google tidak memberikan alamat tujuan","stepMatchArguments":[{"group":{"start":8,"value":"login Google"},"parameterTypeName":"layanan"}]},{"pwStepLine":123,"gherkinStepLine":123,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman login","stepMatchArguments":[{"group":{"start":27,"value":"login"},"parameterTypeName":"halaman"}]},{"pwStepLine":124,"gherkinStepLine":124,"keywordType":"Action","textWithKeyword":"When pengguna memilih masuk dengan Google","stepMatchArguments":[]},{"pwStepLine":125,"gherkinStepLine":125,"keywordType":"Outcome","textWithKeyword":"Then pesan galat login adalah \"Gagal menyiapkan login Google.\"","stepMatchArguments":[{"group":{"start":25,"value":"\"Gagal menyiapkan login Google.\"","children":[{"start":26,"value":"Gagal menyiapkan login Google.","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end
// Generated from: features\verifikasi-otp\verifikasi-otp.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Verifikasi OTP', () => {

  test('Konsultan baru memverifikasi kode OTP lalu masuk ke dashboard', { tag: ['@sit', '@verifikasi-otp', '@AUTH-023', '@critical', '@precondition:calon-konsultan-menunggu-otp'] }, async ({ Given, When, Then, And, page, verifikasiOtpPage, world }) => { 
    await Given('pengguna berada di halaman verifikasi OTP', null, { page, world }); 
    await When('pengguna memverifikasi kode OTP yang diterimanya', null, { page, verifikasiOtpPage, world }); 
    await Then('pengguna diarahkan ke halaman dashboard konsultan', null, { page, world }); 
    await And('akun baru tersimpan sebagai konsultan', null, { page, world }); 
  });

  test('Verifikasi belum bisa dikirim sebelum kode diisi', { tag: ['@sit', '@verifikasi-otp', '@AUTH-023'] }, async ({ Given, Then, page, verifikasiOtpPage, world }) => { 
    await Given('pengguna berada di halaman verifikasi OTP', null, { page, world }); 
    await Then('tombol verifikasi belum dapat ditekan', null, { page, verifikasiOtpPage, world }); 
  });

  test('Kotak OTP menolak karakter selain huruf dan angka', { tag: ['@sit', '@verifikasi-otp', '@AUTH-024'] }, async ({ Given, When, Then, page, verifikasiOtpPage, world }) => { 
    await Given('pengguna berada di halaman verifikasi OTP', null, { page, world }); 
    await When('pengguna mengetik karakter selain huruf dan angka pada kotak OTP pertama', null, { page, verifikasiOtpPage, world }); 
    await Then('kotak OTP pertama tetap kosong', null, { page, verifikasiOtpPage, world }); 
  });

  test('Fokus kotak OTP berpindah mengikuti ketikan', { tag: ['@sit', '@verifikasi-otp', '@AUTH-024'] }, async ({ Given, When, Then, page, verifikasiOtpPage, world }) => { 
    await Given('pengguna berada di halaman verifikasi OTP', null, { page, world }); 
    await When('pengguna mengetik satu angka pada kotak OTP pertama', null, { page, verifikasiOtpPage, world }); 
    await Then('fokus berpindah ke kotak OTP kedua', null, { page, verifikasiOtpPage, world }); 
    await When('pengguna menghapus dari kotak OTP yang kosong', null, { page, world }); 
    await Then('fokus kembali ke kotak OTP pertama', null, { page, verifikasiOtpPage, world }); 
  });

  test('Kode OTP yang ditempel mengisi semua kotak', { tag: ['@sit', '@verifikasi-otp', '@AUTH-025'] }, async ({ Given, When, Then, And, page, verifikasiOtpPage, world }) => { 
    await Given('pengguna berada di halaman verifikasi OTP', null, { page, world }); 
    await When('pengguna menempel kode OTP yang mengandung spasi', null, { page, verifikasiOtpPage, world }); 
    await Then('semua kotak OTP terisi tanpa spasi', null, { page, verifikasiOtpPage, world }); 
    await And('tombol verifikasi dapat ditekan', null, { page, verifikasiOtpPage, world }); 
  });

  test('Kode OTP yang salah ditolak', { tag: ['@sit', '@verifikasi-otp', '@AUTH-026'] }, async ({ Given, When, Then, And, network, page, verifikasiOtpPage, world }) => { 
    await Given('sebuah pendaftaran sedang menunggu verifikasi', null, { page, world }); 
    await And('pengguna berada di halaman verifikasi OTP', null, { page, world }); 
    await When('pengguna memverifikasi kode OTP yang salah', null, { page, verifikasiOtpPage, world }); 
    await Then('pesan galat verifikasi tampil', null, { network, page, world }); 
    await And('pengguna tetap berada di halaman verifikasi OTP', null, { page, world }); 
  });

  test('Kode OTP dapat diminta ulang', { tag: ['@sit', '@verifikasi-otp', '@AUTH-027', '@stub'] }, async ({ Given, When, Then, And, network, page, verifikasiOtpPage, world }) => { 
    await Given('sebuah pendaftaran sedang menunggu verifikasi', null, { page, world }); 
    await And('layanan kirim ulang OTP menerima permintaan', null, { network, page, world }); 
    await And('pengguna berada di halaman verifikasi OTP', null, { page, world }); 
    await When('pengguna meminta kode OTP dikirim ulang setelah mengisi sebagian kotak', null, { page, verifikasiOtpPage, world }); 
    await Then('kode baru diminta untuk email pendaftaran itu', null, { network, page, world }); 
    await And('kotak OTP dikosongkan', null, { page, verifikasiOtpPage, world }); 
  });

  test('Verifikasi tanpa pendaftaran yang tertunda dikembalikan ke login', { tag: ['@sit', '@verifikasi-otp', '@AUTH-028'] }, async ({ Given, When, Then, And, network, page, verifikasiOtpPage, world }) => { 
    await Given('pengguna berada di halaman verifikasi OTP', null, { page, world }); 
    await When('pengguna memverifikasi kode OTP yang salah', null, { page, verifikasiOtpPage, world }); 
    await Then('pengguna diarahkan ke halaman login', null, { page, world }); 
    await And('tidak ada permintaan verifikasi OTP yang dikirim ke backend', null, { network, page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\verifikasi-otp\\verifikasi-otp.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":6,"tags":["@sit","@verifikasi-otp","@AUTH-023","@critical","@precondition:calon-konsultan-menunggu-otp"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman verifikasi OTP","stepMatchArguments":[{"group":{"start":27,"value":"verifikasi OTP"},"parameterTypeName":"halaman"}]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Action","textWithKeyword":"When pengguna memverifikasi kode OTP yang diterimanya","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":9,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman dashboard konsultan","stepMatchArguments":[{"group":{"start":30,"value":"dashboard konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":10,"gherkinStepLine":10,"keywordType":"Outcome","textWithKeyword":"And akun baru tersimpan sebagai konsultan","stepMatchArguments":[{"group":{"start":28,"value":"konsultan"},"parameterTypeName":"akun"}]}]},
  {"pwTestLine":13,"pickleLine":13,"tags":["@sit","@verifikasi-otp","@AUTH-023"],"steps":[{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman verifikasi OTP","stepMatchArguments":[{"group":{"start":27,"value":"verifikasi OTP"},"parameterTypeName":"halaman"}]},{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"Then tombol verifikasi belum dapat ditekan","stepMatchArguments":[]}]},
  {"pwTestLine":18,"pickleLine":18,"tags":["@sit","@verifikasi-otp","@AUTH-024"],"steps":[{"pwStepLine":19,"gherkinStepLine":19,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman verifikasi OTP","stepMatchArguments":[{"group":{"start":27,"value":"verifikasi OTP"},"parameterTypeName":"halaman"}]},{"pwStepLine":20,"gherkinStepLine":20,"keywordType":"Action","textWithKeyword":"When pengguna mengetik karakter selain huruf dan angka pada kotak OTP pertama","stepMatchArguments":[]},{"pwStepLine":21,"gherkinStepLine":21,"keywordType":"Outcome","textWithKeyword":"Then kotak OTP pertama tetap kosong","stepMatchArguments":[]}]},
  {"pwTestLine":24,"pickleLine":24,"tags":["@sit","@verifikasi-otp","@AUTH-024"],"steps":[{"pwStepLine":25,"gherkinStepLine":25,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman verifikasi OTP","stepMatchArguments":[{"group":{"start":27,"value":"verifikasi OTP"},"parameterTypeName":"halaman"}]},{"pwStepLine":26,"gherkinStepLine":26,"keywordType":"Action","textWithKeyword":"When pengguna mengetik satu angka pada kotak OTP pertama","stepMatchArguments":[]},{"pwStepLine":27,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"Then fokus berpindah ke kotak OTP kedua","stepMatchArguments":[]},{"pwStepLine":28,"gherkinStepLine":28,"keywordType":"Action","textWithKeyword":"When pengguna menghapus dari kotak OTP yang kosong","stepMatchArguments":[]},{"pwStepLine":29,"gherkinStepLine":29,"keywordType":"Outcome","textWithKeyword":"Then fokus kembali ke kotak OTP pertama","stepMatchArguments":[]}]},
  {"pwTestLine":32,"pickleLine":32,"tags":["@sit","@verifikasi-otp","@AUTH-025"],"steps":[{"pwStepLine":33,"gherkinStepLine":33,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman verifikasi OTP","stepMatchArguments":[{"group":{"start":27,"value":"verifikasi OTP"},"parameterTypeName":"halaman"}]},{"pwStepLine":34,"gherkinStepLine":34,"keywordType":"Action","textWithKeyword":"When pengguna menempel kode OTP yang mengandung spasi","stepMatchArguments":[]},{"pwStepLine":35,"gherkinStepLine":35,"keywordType":"Outcome","textWithKeyword":"Then semua kotak OTP terisi tanpa spasi","stepMatchArguments":[]},{"pwStepLine":36,"gherkinStepLine":36,"keywordType":"Outcome","textWithKeyword":"And tombol verifikasi dapat ditekan","stepMatchArguments":[]}]},
  {"pwTestLine":39,"pickleLine":39,"tags":["@sit","@verifikasi-otp","@AUTH-026"],"steps":[{"pwStepLine":40,"gherkinStepLine":40,"keywordType":"Context","textWithKeyword":"Given sebuah pendaftaran sedang menunggu verifikasi","stepMatchArguments":[]},{"pwStepLine":41,"gherkinStepLine":41,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman verifikasi OTP","stepMatchArguments":[{"group":{"start":27,"value":"verifikasi OTP"},"parameterTypeName":"halaman"}]},{"pwStepLine":42,"gherkinStepLine":42,"keywordType":"Action","textWithKeyword":"When pengguna memverifikasi kode OTP yang salah","stepMatchArguments":[]},{"pwStepLine":43,"gherkinStepLine":43,"keywordType":"Outcome","textWithKeyword":"Then pesan galat verifikasi tampil","stepMatchArguments":[]},{"pwStepLine":44,"gherkinStepLine":44,"keywordType":"Outcome","textWithKeyword":"And pengguna tetap berada di halaman verifikasi OTP","stepMatchArguments":[{"group":{"start":33,"value":"verifikasi OTP"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":47,"pickleLine":47,"tags":["@sit","@verifikasi-otp","@AUTH-027","@stub"],"steps":[{"pwStepLine":48,"gherkinStepLine":48,"keywordType":"Context","textWithKeyword":"Given sebuah pendaftaran sedang menunggu verifikasi","stepMatchArguments":[]},{"pwStepLine":49,"gherkinStepLine":49,"keywordType":"Context","textWithKeyword":"And layanan kirim ulang OTP menerima permintaan","stepMatchArguments":[{"group":{"start":8,"value":"kirim ulang OTP"},"parameterTypeName":"layanan"}]},{"pwStepLine":50,"gherkinStepLine":50,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman verifikasi OTP","stepMatchArguments":[{"group":{"start":27,"value":"verifikasi OTP"},"parameterTypeName":"halaman"}]},{"pwStepLine":51,"gherkinStepLine":51,"keywordType":"Action","textWithKeyword":"When pengguna meminta kode OTP dikirim ulang setelah mengisi sebagian kotak","stepMatchArguments":[]},{"pwStepLine":52,"gherkinStepLine":52,"keywordType":"Outcome","textWithKeyword":"Then kode baru diminta untuk email pendaftaran itu","stepMatchArguments":[]},{"pwStepLine":53,"gherkinStepLine":53,"keywordType":"Outcome","textWithKeyword":"And kotak OTP dikosongkan","stepMatchArguments":[]}]},
  {"pwTestLine":56,"pickleLine":56,"tags":["@sit","@verifikasi-otp","@AUTH-028"],"steps":[{"pwStepLine":57,"gherkinStepLine":57,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman verifikasi OTP","stepMatchArguments":[{"group":{"start":27,"value":"verifikasi OTP"},"parameterTypeName":"halaman"}]},{"pwStepLine":58,"gherkinStepLine":58,"keywordType":"Action","textWithKeyword":"When pengguna memverifikasi kode OTP yang salah","stepMatchArguments":[]},{"pwStepLine":59,"gherkinStepLine":59,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman login","stepMatchArguments":[{"group":{"start":30,"value":"login"},"parameterTypeName":"halaman"}]},{"pwStepLine":60,"gherkinStepLine":60,"keywordType":"Outcome","textWithKeyword":"And tidak ada permintaan verifikasi OTP yang dikirim ke backend","stepMatchArguments":[{"group":{"start":21,"value":"verifikasi OTP"},"parameterTypeName":"layanan"}]}]},
]; // bdd-data-end
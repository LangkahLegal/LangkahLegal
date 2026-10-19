// Generated from: features\pengaturan-keamanan\pengaturan-keamanan.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Pengaturan keamanan', () => {

  test('Pengguna mengganti kata sandi lalu diminta login ulang', { tag: ['@sit', '@pengaturan-keamanan', '@SEC-001', '@critical', '@precondition:login-klien-sementara'] }, async ({ Given, When, Then, And, dialogs, page, pengaturanKeamananPage, world }) => { 
    await Given('pengguna berada di halaman pengaturan keamanan', null, { page, world }); 
    await When('pengguna mengganti kata sandinya', null, { page, pengaturanKeamananPage, world }); 
    await Then('muncul pemberitahuan "Kata sandi berhasil diperbarui!"', null, { dialogs, page, world }); 
    await And('pengguna diarahkan ke halaman login', null, { page, world }); 
    await And('kata sandi baru pengguna itu dapat dipakai untuk login', null, { page, world }); 
  });

  test('Konfirmasi kata sandi yang tidak cocok ditolak', { tag: ['@sit', '@pengaturan-keamanan', '@SEC-002', '@precondition:login-klien'] }, async ({ Given, When, Then, And, dialogs, network, page, pengaturanKeamananPage, world }) => { 
    await Given('pengguna berada di halaman pengaturan keamanan', null, { page, world }); 
    await When('pengguna mengganti kata sandi dengan konfirmasi yang tidak cocok', null, { page, pengaturanKeamananPage, world }); 
    await Then('muncul pemberitahuan "Konfirmasi password baru tidak cocok."', null, { dialogs, page, world }); 
    await And('tidak ada permintaan reset kata sandi yang dikirim ke backend', null, { network, page, world }); 
  });

  test('Aturan panjang minimal kata sandi konsisten', { tag: ['@sit', '@pengaturan-keamanan', '@SEC-003', '@precondition:login-klien'] }, async ({ When, Then, page, pengaturanKeamananPage, world }) => { 
    await When('pengguna membuka halaman pengaturan keamanan', null, { page, world }); 
    await Then('petunjuk dan validasi kata sandi memakai panjang minimal yang sama', null, { page, pengaturanKeamananPage, world }); 
  });

  test('Mengganti kata sandi mensyaratkan kata sandi saat ini', { tag: ['@sit', '@pengaturan-keamanan', '@SEC-004', '@precondition:login-klien'] }, async ({ When, Then, page, pengaturanKeamananPage, world }) => { 
    await When('pengguna membuka halaman pengaturan keamanan', null, { page, world }); 
    await Then('pengguna diminta mengisi kata sandi saat ini', null, { page, pengaturanKeamananPage, world }); 
  });

  test('Kata sandi baru yang sama dengan yang lama ditolak', { tag: ['@sit', '@pengaturan-keamanan', '@SEC-005', '@precondition:login-klien-sementara'] }, async ({ Given, When, Then, And, dialogs, page, pengaturanKeamananPage, world }) => { 
    await Given('pengguna berada di halaman pengaturan keamanan', null, { page, world }); 
    await When('pengguna mengganti kata sandi dengan kata sandi lamanya', null, { page, pengaturanKeamananPage, world }); 
    await Then('muncul pemberitahuan "New password should be different from the old password."', null, { dialogs, page, world }); 
    await And('pengguna tetap berada di halaman pengaturan keamanan', null, { page, world }); 
  });

  test('Sesi di browser dihapus setelah kata sandi diganti', { tag: ['@sit', '@pengaturan-keamanan', '@SEC-006', '@precondition:login-klien-sementara'] }, async ({ Given, When, Then, And, page, pengaturanKeamananPage, world }) => { 
    await Given('pengguna berada di halaman pengaturan keamanan', null, { page, world }); 
    await When('pengguna mengganti kata sandinya', null, { page, pengaturanKeamananPage, world }); 
    await Then('pengguna diarahkan ke halaman login', null, { page, world }); 
    await And('tidak ada sesi yang tersimpan di browser', null, { page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\pengaturan-keamanan\\pengaturan-keamanan.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":9,"tags":["@sit","@pengaturan-keamanan","@SEC-001","@critical","@precondition:login-klien-sementara"],"steps":[{"pwStepLine":7,"gherkinStepLine":10,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman pengaturan keamanan","stepMatchArguments":[{"group":{"start":27,"value":"pengaturan keamanan"},"parameterTypeName":"halaman"}]},{"pwStepLine":8,"gherkinStepLine":11,"keywordType":"Action","textWithKeyword":"When pengguna mengganti kata sandinya","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"Then muncul pemberitahuan \"Kata sandi berhasil diperbarui!\"","stepMatchArguments":[{"group":{"start":21,"value":"\"Kata sandi berhasil diperbarui!\"","children":[{"start":22,"value":"Kata sandi berhasil diperbarui!","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":10,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"And pengguna diarahkan ke halaman login","stepMatchArguments":[{"group":{"start":30,"value":"login"},"parameterTypeName":"halaman"}]},{"pwStepLine":11,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"And kata sandi baru pengguna itu dapat dipakai untuk login","stepMatchArguments":[]}]},
  {"pwTestLine":14,"pickleLine":17,"tags":["@sit","@pengaturan-keamanan","@SEC-002","@precondition:login-klien"],"steps":[{"pwStepLine":15,"gherkinStepLine":18,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman pengaturan keamanan","stepMatchArguments":[{"group":{"start":27,"value":"pengaturan keamanan"},"parameterTypeName":"halaman"}]},{"pwStepLine":16,"gherkinStepLine":19,"keywordType":"Action","textWithKeyword":"When pengguna mengganti kata sandi dengan konfirmasi yang tidak cocok","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"Then muncul pemberitahuan \"Konfirmasi password baru tidak cocok.\"","stepMatchArguments":[{"group":{"start":21,"value":"\"Konfirmasi password baru tidak cocok.\"","children":[{"start":22,"value":"Konfirmasi password baru tidak cocok.","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":18,"gherkinStepLine":21,"keywordType":"Outcome","textWithKeyword":"And tidak ada permintaan reset kata sandi yang dikirim ke backend","stepMatchArguments":[{"group":{"start":21,"value":"reset kata sandi"},"parameterTypeName":"layanan"}]}]},
  {"pwTestLine":21,"pickleLine":24,"tags":["@sit","@pengaturan-keamanan","@SEC-003","@precondition:login-klien"],"steps":[{"pwStepLine":22,"gherkinStepLine":25,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman pengaturan keamanan","stepMatchArguments":[{"group":{"start":25,"value":"pengaturan keamanan"},"parameterTypeName":"halaman"}]},{"pwStepLine":23,"gherkinStepLine":26,"keywordType":"Outcome","textWithKeyword":"Then petunjuk dan validasi kata sandi memakai panjang minimal yang sama","stepMatchArguments":[]}]},
  {"pwTestLine":26,"pickleLine":29,"tags":["@sit","@pengaturan-keamanan","@SEC-004","@precondition:login-klien"],"steps":[{"pwStepLine":27,"gherkinStepLine":30,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman pengaturan keamanan","stepMatchArguments":[{"group":{"start":25,"value":"pengaturan keamanan"},"parameterTypeName":"halaman"}]},{"pwStepLine":28,"gherkinStepLine":31,"keywordType":"Outcome","textWithKeyword":"Then pengguna diminta mengisi kata sandi saat ini","stepMatchArguments":[]}]},
  {"pwTestLine":31,"pickleLine":34,"tags":["@sit","@pengaturan-keamanan","@SEC-005","@precondition:login-klien-sementara"],"steps":[{"pwStepLine":32,"gherkinStepLine":35,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman pengaturan keamanan","stepMatchArguments":[{"group":{"start":27,"value":"pengaturan keamanan"},"parameterTypeName":"halaman"}]},{"pwStepLine":33,"gherkinStepLine":36,"keywordType":"Action","textWithKeyword":"When pengguna mengganti kata sandi dengan kata sandi lamanya","stepMatchArguments":[]},{"pwStepLine":34,"gherkinStepLine":37,"keywordType":"Outcome","textWithKeyword":"Then muncul pemberitahuan \"New password should be different from the old password.\"","stepMatchArguments":[{"group":{"start":21,"value":"\"New password should be different from the old password.\"","children":[{"start":22,"value":"New password should be different from the old password.","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":35,"gherkinStepLine":38,"keywordType":"Outcome","textWithKeyword":"And pengguna tetap berada di halaman pengaturan keamanan","stepMatchArguments":[{"group":{"start":33,"value":"pengaturan keamanan"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":38,"pickleLine":41,"tags":["@sit","@pengaturan-keamanan","@SEC-006","@precondition:login-klien-sementara"],"steps":[{"pwStepLine":39,"gherkinStepLine":42,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman pengaturan keamanan","stepMatchArguments":[{"group":{"start":27,"value":"pengaturan keamanan"},"parameterTypeName":"halaman"}]},{"pwStepLine":40,"gherkinStepLine":43,"keywordType":"Action","textWithKeyword":"When pengguna mengganti kata sandinya","stepMatchArguments":[]},{"pwStepLine":41,"gherkinStepLine":44,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman login","stepMatchArguments":[{"group":{"start":30,"value":"login"},"parameterTypeName":"halaman"}]},{"pwStepLine":42,"gherkinStepLine":45,"keywordType":"Outcome","textWithKeyword":"And tidak ada sesi yang tersimpan di browser","stepMatchArguments":[]}]},
]; // bdd-data-end
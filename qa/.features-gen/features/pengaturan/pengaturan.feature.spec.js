// Generated from: features\pengaturan\pengaturan.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Pengaturan akun', () => {

  test('Halaman pengaturan menampilkan akun dan seluruh menu', { tag: ['@sit', '@pengaturan', '@SET-001', '@critical', '@mobile', '@precondition:login-klien'] }, async ({ When, Then, page, pengaturanPage, world }) => { 
    await When('pengguna membuka halaman pengaturan', null, { page, world }); 
    await Then('pengaturan menampilkan nama, email, dan seluruh menu pengaturan', null, { page, pengaturanPage, world }); 
  });

  test('Konsultan terverifikasi melihat status verifikasinya', { tag: ['@sit', '@pengaturan', '@SET-002', '@precondition:login-konsultan'] }, async ({ When, Then, page, pengaturanPage, world }) => { 
    await When('pengguna membuka halaman pengaturan', null, { page, world }); 
    await Then('pengaturan menampilkan status terverifikasi', null, { page, pengaturanPage, world }); 
  });

  test('Tema gelap tetap aktif setelah halaman dimuat ulang', { tag: ['@sit', '@pengaturan', '@SET-003', '@precondition:login-klien'] }, async ({ Given, When, Then, page, pengaturanPage, world }) => { 
    await Given('pengguna berada di halaman pengaturan', null, { page, world }); 
    await When('pengguna mengganti tema aplikasi', null, { page, pengaturanPage, world }); 
    await Then('aplikasi memakai tema gelap', null, { page, pengaturanPage, world }); 
    await When('pengguna memuat ulang halaman', null, { page, world }); 
    await Then('aplikasi memakai tema gelap', null, { page, pengaturanPage, world }); 
  });

  test('Pengguna keluar dari aplikasi', { tag: ['@sit', '@pengaturan', '@SET-004', '@critical', '@precondition:login-klien-sementara'] }, async ({ Given, When, Then, And, dialogs, network, page, pengaturanPage, world }) => { 
    await Given('pengguna berada di halaman pengaturan', null, { page, world }); 
    await When('pengguna keluar dari aplikasi', null, { dialogs, page, pengaturanPage, world }); 
    await Then('pengguna diarahkan ke halaman login', null, { page, world }); 
    await And('seluruh data sesi terhapus dari browser', null, { page, world }); 
    await And('hanya ada 1 permintaan logout yang dikirim ke backend', null, { network, page, world }); 
  });

  test('Pengguna mengurungkan keluar dari aplikasi', { tag: ['@sit', '@pengaturan', '@SET-005', '@precondition:login-klien'] }, async ({ Given, When, Then, And, dialogs, network, page, pengaturanPage, world }) => { 
    await Given('pengguna berada di halaman pengaturan', null, { page, world }); 
    await When('pengguna mengurungkan keluar dari aplikasi', null, { dialogs, page, pengaturanPage, world }); 
    await Then('pengguna tetap berada di halaman pengaturan', null, { page, world }); 
    await And('tidak ada permintaan logout yang dikirim ke backend', null, { network, page, world }); 
  });

  test('Sesi tetap dibersihkan walau layanan logout bermasalah', { tag: ['@sit', '@pengaturan', '@SET-005', '@precondition:login-klien-sementara'] }, async ({ Given, When, Then, And, dialogs, network, page, pengaturanPage, world }) => { 
    await Given('layanan logout sedang mengalami gangguan', null, { network, page, world }); 
    await And('pengguna berada di halaman pengaturan', null, { page, world }); 
    await When('pengguna keluar dari aplikasi', null, { dialogs, page, pengaturanPage, world }); 
    await Then('pengguna diarahkan ke halaman login', null, { page, world }); 
    await And('seluruh data sesi terhapus dari browser', null, { page, world }); 
  });

  test('Tema tidak berubah saat area kosong diklik', { tag: ['@sit', '@pengaturan', '@SET-006', '@precondition:login-klien'] }, async ({ Given, When, Then, page, pengaturanPage, world }) => { 
    await Given('pengguna berada di halaman pengaturan', null, { page, world }); 
    await When('pengguna mengklik area kosong halaman', null, { page, pengaturanPage, world }); 
    await Then('aplikasi tetap memakai tema terang', null, { page, pengaturanPage, world }); 
  });

  test('Setiap menu pengaturan membuka halamannya', { tag: ['@sit', '@pengaturan', '@SET-007', '@precondition:login-klien'] }, async ({ When, Then, page, pengaturanPage, world }) => { 
    await When('pengguna membuka setiap menu pengaturan', null, { page, pengaturanPage, world }); 
    await Then('setiap menu membuka halaman pengaturannya', null, { page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\pengaturan\\pengaturan.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":6,"tags":["@sit","@pengaturan","@SET-001","@critical","@mobile","@precondition:login-klien"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman pengaturan","stepMatchArguments":[{"group":{"start":25,"value":"pengaturan"},"parameterTypeName":"halaman"}]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Outcome","textWithKeyword":"Then pengaturan menampilkan nama, email, dan seluruh menu pengaturan","stepMatchArguments":[]}]},
  {"pwTestLine":11,"pickleLine":11,"tags":["@sit","@pengaturan","@SET-002","@precondition:login-konsultan"],"steps":[{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman pengaturan","stepMatchArguments":[{"group":{"start":25,"value":"pengaturan"},"parameterTypeName":"halaman"}]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"Then pengaturan menampilkan status terverifikasi","stepMatchArguments":[]}]},
  {"pwTestLine":16,"pickleLine":16,"tags":["@sit","@pengaturan","@SET-003","@precondition:login-klien"],"steps":[{"pwStepLine":17,"gherkinStepLine":17,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman pengaturan","stepMatchArguments":[{"group":{"start":27,"value":"pengaturan"},"parameterTypeName":"halaman"}]},{"pwStepLine":18,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"When pengguna mengganti tema aplikasi","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then aplikasi memakai tema gelap","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":20,"keywordType":"Action","textWithKeyword":"When pengguna memuat ulang halaman","stepMatchArguments":[]},{"pwStepLine":21,"gherkinStepLine":21,"keywordType":"Outcome","textWithKeyword":"Then aplikasi memakai tema gelap","stepMatchArguments":[]}]},
  {"pwTestLine":24,"pickleLine":24,"tags":["@sit","@pengaturan","@SET-004","@critical","@precondition:login-klien-sementara"],"steps":[{"pwStepLine":25,"gherkinStepLine":25,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman pengaturan","stepMatchArguments":[{"group":{"start":27,"value":"pengaturan"},"parameterTypeName":"halaman"}]},{"pwStepLine":26,"gherkinStepLine":26,"keywordType":"Action","textWithKeyword":"When pengguna keluar dari aplikasi","stepMatchArguments":[]},{"pwStepLine":27,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman login","stepMatchArguments":[{"group":{"start":30,"value":"login"},"parameterTypeName":"halaman"}]},{"pwStepLine":28,"gherkinStepLine":28,"keywordType":"Outcome","textWithKeyword":"And seluruh data sesi terhapus dari browser","stepMatchArguments":[]},{"pwStepLine":29,"gherkinStepLine":29,"keywordType":"Outcome","textWithKeyword":"And hanya ada 1 permintaan logout yang dikirim ke backend","stepMatchArguments":[{"group":{"start":10,"value":"1"},"parameterTypeName":"int"},{"group":{"start":23,"value":"logout"},"parameterTypeName":"layanan"}]}]},
  {"pwTestLine":32,"pickleLine":32,"tags":["@sit","@pengaturan","@SET-005","@precondition:login-klien"],"steps":[{"pwStepLine":33,"gherkinStepLine":33,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman pengaturan","stepMatchArguments":[{"group":{"start":27,"value":"pengaturan"},"parameterTypeName":"halaman"}]},{"pwStepLine":34,"gherkinStepLine":34,"keywordType":"Action","textWithKeyword":"When pengguna mengurungkan keluar dari aplikasi","stepMatchArguments":[]},{"pwStepLine":35,"gherkinStepLine":35,"keywordType":"Outcome","textWithKeyword":"Then pengguna tetap berada di halaman pengaturan","stepMatchArguments":[{"group":{"start":33,"value":"pengaturan"},"parameterTypeName":"halaman"}]},{"pwStepLine":36,"gherkinStepLine":36,"keywordType":"Outcome","textWithKeyword":"And tidak ada permintaan logout yang dikirim ke backend","stepMatchArguments":[{"group":{"start":21,"value":"logout"},"parameterTypeName":"layanan"}]}]},
  {"pwTestLine":39,"pickleLine":39,"tags":["@sit","@pengaturan","@SET-005","@precondition:login-klien-sementara"],"steps":[{"pwStepLine":40,"gherkinStepLine":40,"keywordType":"Context","textWithKeyword":"Given layanan logout sedang mengalami gangguan","stepMatchArguments":[{"group":{"start":8,"value":"logout"},"parameterTypeName":"layanan"}]},{"pwStepLine":41,"gherkinStepLine":41,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman pengaturan","stepMatchArguments":[{"group":{"start":27,"value":"pengaturan"},"parameterTypeName":"halaman"}]},{"pwStepLine":42,"gherkinStepLine":42,"keywordType":"Action","textWithKeyword":"When pengguna keluar dari aplikasi","stepMatchArguments":[]},{"pwStepLine":43,"gherkinStepLine":43,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman login","stepMatchArguments":[{"group":{"start":30,"value":"login"},"parameterTypeName":"halaman"}]},{"pwStepLine":44,"gherkinStepLine":44,"keywordType":"Outcome","textWithKeyword":"And seluruh data sesi terhapus dari browser","stepMatchArguments":[]}]},
  {"pwTestLine":47,"pickleLine":47,"tags":["@sit","@pengaturan","@SET-006","@precondition:login-klien"],"steps":[{"pwStepLine":48,"gherkinStepLine":48,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman pengaturan","stepMatchArguments":[{"group":{"start":27,"value":"pengaturan"},"parameterTypeName":"halaman"}]},{"pwStepLine":49,"gherkinStepLine":49,"keywordType":"Action","textWithKeyword":"When pengguna mengklik area kosong halaman","stepMatchArguments":[]},{"pwStepLine":50,"gherkinStepLine":50,"keywordType":"Outcome","textWithKeyword":"Then aplikasi tetap memakai tema terang","stepMatchArguments":[]}]},
  {"pwTestLine":53,"pickleLine":53,"tags":["@sit","@pengaturan","@SET-007","@precondition:login-klien"],"steps":[{"pwStepLine":54,"gherkinStepLine":54,"keywordType":"Action","textWithKeyword":"When pengguna membuka setiap menu pengaturan","stepMatchArguments":[]},{"pwStepLine":55,"gherkinStepLine":55,"keywordType":"Outcome","textWithKeyword":"Then setiap menu membuka halaman pengaturannya","stepMatchArguments":[]}]},
]; // bdd-data-end
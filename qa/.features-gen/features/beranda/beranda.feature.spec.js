// Generated from: features\beranda\beranda.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Beranda', () => {

  test('Beranda tampil lengkap untuk pengunjung', { tag: ['@sit', '@beranda', '@PUB-001', '@mobile'] }, async ({ Given, Then, And, berandaPage, page, pageErrors, world }) => { 
    await Given('pengguna berada di halaman beranda', null, { page, world }); 
    await Then('beranda menampilkan seluruh bagian utamanya', null, { berandaPage, page, world }); 
    await And('halaman tidak mengalami galat', null, { page, pageErrors, world }); 
  });

  test('Pengunjung memulai pendaftaran dari beranda', { tag: ['@sit', '@beranda', '@PUB-002'] }, async ({ Given, When, Then, berandaPage, page, world }) => { 
    await Given('pengguna berada di halaman beranda', null, { page, world }); 
    await When('pengguna memilih mulai sekarang', null, { berandaPage, page, world }); 
    await Then('pengguna diarahkan ke halaman pemilihan peran', null, { page, world }); 
  });

  test('Pengunjung menuju login dari navbar', { tag: ['@sit', '@beranda', '@PUB-003'] }, async ({ Given, When, Then, berandaPage, page, world }) => { 
    await Given('pengguna berada di halaman beranda', null, { page, world }); 
    await When('pengguna memilih masuk dari navbar', null, { berandaPage, page, world }); 
    await Then('pengguna diarahkan ke halaman login', null, { page, world }); 
  });

  test('Konsultan yang sudah login menuju dashboardnya dari navbar', { tag: ['@sit', '@beranda', '@PUB-004', '@precondition:login-konsultan'] }, async ({ Given, When, Then, berandaPage, page, world }) => { 
    await Given('pengguna berada di halaman beranda', null, { page, world }); 
    await When('pengguna memilih dashboard dari navbar', null, { berandaPage, page, world }); 
    await Then('pengguna diarahkan ke halaman dashboard konsultan', null, { page, world }); 
  });

  test('Pengguna yang perannya belum diketahui diminta memilih peran', { tag: ['@sit', '@beranda', '@PUB-005'] }, async ({ Given, When, Then, And, auth, berandaPage, page, world }) => { 
    await Given('pengguna sudah login sebagai klien tanpa peran tersimpan di browser', null, { auth, page, world }); 
    await And('pengguna berada di halaman beranda', null, { page, world }); 
    await When('pengguna memilih dashboard dari navbar', null, { berandaPage, page, world }); 
    await Then('pengguna diarahkan ke halaman pemilihan peran', null, { page, world }); 
  });

  test('Jawaban FAQ dapat dibuka dan ditutup', { tag: ['@sit', '@beranda', '@PUB-006'] }, async ({ Given, When, Then, berandaPage, page, world }) => { 
    await Given('pengguna berada di halaman beranda', null, { page, world }); 
    await When('pengguna membuka sebuah pertanyaan FAQ', null, { berandaPage, page, world }); 
    await Then('jawaban pertanyaan itu tampil', null, { berandaPage, page, world }); 
    await When('pengguna menutup pertanyaan FAQ itu', null, { berandaPage, page, world }); 
    await Then('jawaban pertanyaan itu tersembunyi', null, { berandaPage, page, world }); 
  });

  test('Tautan layanan di navbar membawa pengunjung ke bagian fitur', { tag: ['@sit', '@beranda', '@PUB-007'] }, async ({ Given, When, Then, berandaPage, page, world }) => { 
    await Given('pengguna berada di halaman beranda', null, { page, world }); 
    await When('pengguna memilih tautan layanan di navbar', null, { berandaPage, page, world }); 
    await Then('bagian fitur terlihat di layar', null, { berandaPage, page, world }); 
  });

  test('Beranda pas dengan lebar layar', { tag: ['@sit', '@beranda', '@PUB-008', '@mobile'] }, async ({ Given, Then, berandaPage, page, world }) => { 
    await Given('pengguna berada di halaman beranda', null, { page, world }); 
    await Then('beranda tidak dapat digulir ke samping', null, { berandaPage, page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\beranda\\beranda.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":6,"tags":["@sit","@beranda","@PUB-001","@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman beranda","stepMatchArguments":[{"group":{"start":27,"value":"beranda"},"parameterTypeName":"halaman"}]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Outcome","textWithKeyword":"Then beranda menampilkan seluruh bagian utamanya","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":9,"keywordType":"Outcome","textWithKeyword":"And halaman tidak mengalami galat","stepMatchArguments":[]}]},
  {"pwTestLine":12,"pickleLine":12,"tags":["@sit","@beranda","@PUB-002"],"steps":[{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman beranda","stepMatchArguments":[{"group":{"start":27,"value":"beranda"},"parameterTypeName":"halaman"}]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Action","textWithKeyword":"When pengguna memilih mulai sekarang","stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman pemilihan peran","stepMatchArguments":[{"group":{"start":30,"value":"pemilihan peran"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":18,"pickleLine":18,"tags":["@sit","@beranda","@PUB-003"],"steps":[{"pwStepLine":19,"gherkinStepLine":19,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman beranda","stepMatchArguments":[{"group":{"start":27,"value":"beranda"},"parameterTypeName":"halaman"}]},{"pwStepLine":20,"gherkinStepLine":20,"keywordType":"Action","textWithKeyword":"When pengguna memilih masuk dari navbar","stepMatchArguments":[]},{"pwStepLine":21,"gherkinStepLine":21,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman login","stepMatchArguments":[{"group":{"start":30,"value":"login"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":24,"pickleLine":24,"tags":["@sit","@beranda","@PUB-004","@precondition:login-konsultan"],"steps":[{"pwStepLine":25,"gherkinStepLine":25,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman beranda","stepMatchArguments":[{"group":{"start":27,"value":"beranda"},"parameterTypeName":"halaman"}]},{"pwStepLine":26,"gherkinStepLine":26,"keywordType":"Action","textWithKeyword":"When pengguna memilih dashboard dari navbar","stepMatchArguments":[]},{"pwStepLine":27,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman dashboard konsultan","stepMatchArguments":[{"group":{"start":30,"value":"dashboard konsultan"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":30,"pickleLine":30,"tags":["@sit","@beranda","@PUB-005"],"steps":[{"pwStepLine":31,"gherkinStepLine":31,"keywordType":"Context","textWithKeyword":"Given pengguna sudah login sebagai klien tanpa peran tersimpan di browser","stepMatchArguments":[{"group":{"start":29,"value":"klien"},"parameterTypeName":"akun"}]},{"pwStepLine":32,"gherkinStepLine":32,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman beranda","stepMatchArguments":[{"group":{"start":27,"value":"beranda"},"parameterTypeName":"halaman"}]},{"pwStepLine":33,"gherkinStepLine":33,"keywordType":"Action","textWithKeyword":"When pengguna memilih dashboard dari navbar","stepMatchArguments":[]},{"pwStepLine":34,"gherkinStepLine":34,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman pemilihan peran","stepMatchArguments":[{"group":{"start":30,"value":"pemilihan peran"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":37,"pickleLine":37,"tags":["@sit","@beranda","@PUB-006"],"steps":[{"pwStepLine":38,"gherkinStepLine":38,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman beranda","stepMatchArguments":[{"group":{"start":27,"value":"beranda"},"parameterTypeName":"halaman"}]},{"pwStepLine":39,"gherkinStepLine":39,"keywordType":"Action","textWithKeyword":"When pengguna membuka sebuah pertanyaan FAQ","stepMatchArguments":[]},{"pwStepLine":40,"gherkinStepLine":40,"keywordType":"Outcome","textWithKeyword":"Then jawaban pertanyaan itu tampil","stepMatchArguments":[]},{"pwStepLine":41,"gherkinStepLine":41,"keywordType":"Action","textWithKeyword":"When pengguna menutup pertanyaan FAQ itu","stepMatchArguments":[]},{"pwStepLine":42,"gherkinStepLine":42,"keywordType":"Outcome","textWithKeyword":"Then jawaban pertanyaan itu tersembunyi","stepMatchArguments":[]}]},
  {"pwTestLine":45,"pickleLine":45,"tags":["@sit","@beranda","@PUB-007"],"steps":[{"pwStepLine":46,"gherkinStepLine":46,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman beranda","stepMatchArguments":[{"group":{"start":27,"value":"beranda"},"parameterTypeName":"halaman"}]},{"pwStepLine":47,"gherkinStepLine":47,"keywordType":"Action","textWithKeyword":"When pengguna memilih tautan layanan di navbar","stepMatchArguments":[]},{"pwStepLine":48,"gherkinStepLine":48,"keywordType":"Outcome","textWithKeyword":"Then bagian fitur terlihat di layar","stepMatchArguments":[]}]},
  {"pwTestLine":51,"pickleLine":51,"tags":["@sit","@beranda","@PUB-008","@mobile"],"steps":[{"pwStepLine":52,"gherkinStepLine":52,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman beranda","stepMatchArguments":[{"group":{"start":27,"value":"beranda"},"parameterTypeName":"halaman"}]},{"pwStepLine":53,"gherkinStepLine":53,"keywordType":"Outcome","textWithKeyword":"Then beranda tidak dapat digulir ke samping","stepMatchArguments":[]}]},
]; // bdd-data-end
// Generated from: features\proteksi-halaman\proteksi-halaman.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Proteksi halaman dan pembatasan peran', () => {

  test('Pengunjung yang belum login tidak bisa membuka halaman privat', { tag: ['@sit', '@proteksi-halaman', '@GRD-001', '@critical'] }, async ({ Then, page, world }) => { 
    await Then('setiap halaman privat mengarahkan pengunjung ke halaman login', null, { page, world }); 
  });

  test('Pengunjung yang membuka halaman verifikasi konsultan diminta login', { tag: ['@sit', '@proteksi-halaman', '@GRD-002'] }, async ({ When, Then, page, world }) => { 
    await When('pengguna membuka halaman verifikasi konsultan', null, { page, world }); 
    await Then('pengguna segera diarahkan ke halaman login', null, { page, world }); 
  });

  test('Pengunjung yang membuka halaman basis pengetahuan diminta login', { tag: ['@sit', '@proteksi-halaman', '@GRD-003'] }, async ({ When, Then, page, world }) => { 
    await When('pengguna membuka halaman basis pengetahuan', null, { page, world }); 
    await Then('pengguna segera diarahkan ke halaman login', null, { page, world }); 
  });

  test('Pengunjung yang membuka halaman contoh pembayaran diminta login', { tag: ['@sit', '@proteksi-halaman', '@GRD-004'] }, async ({ When, Then, page, world }) => { 
    await When('pengguna membuka halaman contoh pembayaran', null, { page, world }); 
    await Then('pengguna segera diarahkan ke halaman login', null, { page, world }); 
  });

  test('Pengunjung dapat menjelajahi katalog konsultan', { tag: ['@sit', '@proteksi-halaman', '@GRD-005'] }, async ({ Given, Then, katalogKonsultanPage, page, world }) => { 
    await Given('pengguna berada di halaman katalog konsultan', null, { page, world }); 
    await Then('setidaknya satu konsultan tampil di katalog', null, { katalogKonsultanPage, page, world }); 
  });

  test('Pengunjung yang bertanya ke Tanya AI diminta login', { tag: ['@sit', '@proteksi-halaman', '@GRD-006'] }, async ({ Given, When, Then, page, tanyaAiPage, world }) => { 
    await Given('pengguna berada di halaman tanya AI', null, { page, world }); 
    await When('pengguna bertanya ke Tanya AI', null, { page, tanyaAiPage, world }); 
    await Then('pengguna diminta login terlebih dahulu', null, { page, tanyaAiPage, world }); 
  });

  test('Klien yang membuka dashboard konsultan dikembalikan ke dashboard klien', { tag: ['@sit', '@proteksi-halaman', '@GRD-007'] }, async ({ Given, When, Then, auth, page, world }) => { 
    await Given('pengguna sudah login sebagai klien', null, { auth, page, world }); 
    await When('pengguna membuka halaman dashboard konsultan', null, { page, world }); 
    await Then('pengguna diarahkan ke halaman dashboard klien', null, { page, world }); 
  });

  test('Klien yang membuka dashboard admin dikembalikan ke dashboard klien', { tag: ['@sit', '@proteksi-halaman', '@GRD-008'] }, async ({ Given, When, Then, auth, page, world }) => { 
    await Given('pengguna sudah login sebagai klien', null, { auth, page, world }); 
    await When('pengguna membuka halaman dashboard admin', null, { page, world }); 
    await Then('pengguna diarahkan ke halaman dashboard klien', null, { page, world }); 
  });

  test('Konsultan yang membuka dashboard klien dikembalikan ke dashboard konsultan', { tag: ['@sit', '@proteksi-halaman', '@GRD-009'] }, async ({ Given, When, Then, auth, page, world }) => { 
    await Given('pengguna sudah login sebagai konsultan', null, { auth, page, world }); 
    await When('pengguna membuka halaman dashboard klien', null, { page, world }); 
    await Then('pengguna diarahkan ke halaman dashboard konsultan', null, { page, world }); 
  });

  test('Konsultan yang membuka dashboard admin dikembalikan ke dashboard konsultan', { tag: ['@sit', '@proteksi-halaman', '@GRD-010'] }, async ({ Given, When, Then, auth, page, world }) => { 
    await Given('pengguna sudah login sebagai konsultan', null, { auth, page, world }); 
    await When('pengguna membuka halaman dashboard admin', null, { page, world }); 
    await Then('pengguna diarahkan ke halaman dashboard konsultan', null, { page, world }); 
  });

  test('Admin yang membuka dashboard klien dikembalikan ke dashboard admin', { tag: ['@sit', '@proteksi-halaman', '@GRD-011'] }, async ({ Given, When, Then, auth, page, world }) => { 
    await Given('pengguna sudah login sebagai admin', null, { auth, page, world }); 
    await When('pengguna membuka halaman dashboard klien', null, { page, world }); 
    await Then('pengguna diarahkan ke halaman dashboard admin', null, { page, world }); 
  });

  test('Pengguna yang perannya belum diketahui diminta memilih peran', { tag: ['@sit', '@proteksi-halaman', '@GRD-012'] }, async ({ Given, When, Then, auth, page, world }) => { 
    await Given('pengguna sudah login sebagai klien tanpa peran tersimpan di browser', null, { auth, page, world }); 
    await When('pengguna membuka halaman dashboard klien', null, { page, world }); 
    await Then('pengguna diarahkan ke halaman pemilihan peran', null, { page, world }); 
  });

  test('Klien yang membuka jadwal dikembalikan ke dashboard klien', { tag: ['@sit', '@proteksi-halaman', '@GRD-013'] }, async ({ Given, When, Then, auth, page, world }) => { 
    await Given('pengguna sudah login sebagai klien', null, { auth, page, world }); 
    await When('pengguna membuka halaman jadwal', null, { page, world }); 
    await Then('pengguna segera diarahkan ke halaman dashboard klien', null, { page, world }); 
  });

  test('Klien yang membuka bursa kasus dikembalikan ke dashboard klien', { tag: ['@sit', '@proteksi-halaman', '@GRD-014'] }, async ({ Given, When, Then, auth, page, world }) => { 
    await Given('pengguna sudah login sebagai klien', null, { auth, page, world }); 
    await When('pengguna membuka halaman bursa kasus', null, { page, world }); 
    await Then('pengguna segera diarahkan ke halaman dashboard klien', null, { page, world }); 
  });

  test('Klien yang membuka verifikasi konsultan dikembalikan ke dashboard klien', { tag: ['@sit', '@proteksi-halaman', '@GRD-015'] }, async ({ Given, When, Then, auth, page, world }) => { 
    await Given('pengguna sudah login sebagai klien', null, { auth, page, world }); 
    await When('pengguna membuka halaman verifikasi konsultan', null, { page, world }); 
    await Then('pengguna segera diarahkan ke halaman dashboard klien', null, { page, world }); 
  });

  test('Konsultan yang membuka posting kasus dikembalikan ke dashboard konsultan', { tag: ['@sit', '@proteksi-halaman', '@GRD-016'] }, async ({ Given, When, Then, auth, page, world }) => { 
    await Given('pengguna sudah login sebagai konsultan', null, { auth, page, world }); 
    await When('pengguna membuka halaman posting kasus', null, { page, world }); 
    await Then('pengguna segera diarahkan ke halaman dashboard konsultan', null, { page, world }); 
  });

  test('Konsultan yang membuka basis pengetahuan dikembalikan ke dashboard konsultan', { tag: ['@sit', '@proteksi-halaman', '@GRD-017'] }, async ({ Given, When, Then, auth, page, world }) => { 
    await Given('pengguna sudah login sebagai konsultan', null, { auth, page, world }); 
    await When('pengguna membuka halaman basis pengetahuan', null, { page, world }); 
    await Then('pengguna segera diarahkan ke halaman dashboard konsultan', null, { page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\proteksi-halaman\\proteksi-halaman.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":6,"tags":["@sit","@proteksi-halaman","@GRD-001","@critical"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Outcome","textWithKeyword":"Then setiap halaman privat mengarahkan pengunjung ke halaman login","stepMatchArguments":[{"group":{"start":56,"value":"login"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":10,"pickleLine":10,"tags":["@sit","@proteksi-halaman","@GRD-002"],"steps":[{"pwStepLine":11,"gherkinStepLine":11,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman verifikasi konsultan","stepMatchArguments":[{"group":{"start":25,"value":"verifikasi konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"Then pengguna segera diarahkan ke halaman login","stepMatchArguments":[{"group":{"start":37,"value":"login"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":15,"pickleLine":15,"tags":["@sit","@proteksi-halaman","@GRD-003"],"steps":[{"pwStepLine":16,"gherkinStepLine":16,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman basis pengetahuan","stepMatchArguments":[{"group":{"start":25,"value":"basis pengetahuan"},"parameterTypeName":"halaman"}]},{"pwStepLine":17,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"Then pengguna segera diarahkan ke halaman login","stepMatchArguments":[{"group":{"start":37,"value":"login"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":20,"pickleLine":20,"tags":["@sit","@proteksi-halaman","@GRD-004"],"steps":[{"pwStepLine":21,"gherkinStepLine":21,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman contoh pembayaran","stepMatchArguments":[{"group":{"start":25,"value":"contoh pembayaran"},"parameterTypeName":"halaman"}]},{"pwStepLine":22,"gherkinStepLine":22,"keywordType":"Outcome","textWithKeyword":"Then pengguna segera diarahkan ke halaman login","stepMatchArguments":[{"group":{"start":37,"value":"login"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":25,"pickleLine":25,"tags":["@sit","@proteksi-halaman","@GRD-005"],"steps":[{"pwStepLine":26,"gherkinStepLine":26,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman katalog konsultan","stepMatchArguments":[{"group":{"start":27,"value":"katalog konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":27,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"Then setidaknya satu konsultan tampil di katalog","stepMatchArguments":[]}]},
  {"pwTestLine":30,"pickleLine":30,"tags":["@sit","@proteksi-halaman","@GRD-006"],"steps":[{"pwStepLine":31,"gherkinStepLine":31,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman tanya AI","stepMatchArguments":[{"group":{"start":27,"value":"tanya AI"},"parameterTypeName":"halaman"}]},{"pwStepLine":32,"gherkinStepLine":32,"keywordType":"Action","textWithKeyword":"When pengguna bertanya ke Tanya AI","stepMatchArguments":[]},{"pwStepLine":33,"gherkinStepLine":33,"keywordType":"Outcome","textWithKeyword":"Then pengguna diminta login terlebih dahulu","stepMatchArguments":[]}]},
  {"pwTestLine":36,"pickleLine":36,"tags":["@sit","@proteksi-halaman","@GRD-007"],"steps":[{"pwStepLine":37,"gherkinStepLine":37,"keywordType":"Context","textWithKeyword":"Given pengguna sudah login sebagai klien","stepMatchArguments":[{"group":{"start":29,"value":"klien"},"parameterTypeName":"akun"}]},{"pwStepLine":38,"gherkinStepLine":38,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman dashboard konsultan","stepMatchArguments":[{"group":{"start":25,"value":"dashboard konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":39,"gherkinStepLine":39,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman dashboard klien","stepMatchArguments":[{"group":{"start":30,"value":"dashboard klien"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":42,"pickleLine":42,"tags":["@sit","@proteksi-halaman","@GRD-008"],"steps":[{"pwStepLine":43,"gherkinStepLine":43,"keywordType":"Context","textWithKeyword":"Given pengguna sudah login sebagai klien","stepMatchArguments":[{"group":{"start":29,"value":"klien"},"parameterTypeName":"akun"}]},{"pwStepLine":44,"gherkinStepLine":44,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman dashboard admin","stepMatchArguments":[{"group":{"start":25,"value":"dashboard admin"},"parameterTypeName":"halaman"}]},{"pwStepLine":45,"gherkinStepLine":45,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman dashboard klien","stepMatchArguments":[{"group":{"start":30,"value":"dashboard klien"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":48,"pickleLine":48,"tags":["@sit","@proteksi-halaman","@GRD-009"],"steps":[{"pwStepLine":49,"gherkinStepLine":49,"keywordType":"Context","textWithKeyword":"Given pengguna sudah login sebagai konsultan","stepMatchArguments":[{"group":{"start":29,"value":"konsultan"},"parameterTypeName":"akun"}]},{"pwStepLine":50,"gherkinStepLine":50,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman dashboard klien","stepMatchArguments":[{"group":{"start":25,"value":"dashboard klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":51,"gherkinStepLine":51,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman dashboard konsultan","stepMatchArguments":[{"group":{"start":30,"value":"dashboard konsultan"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":54,"pickleLine":54,"tags":["@sit","@proteksi-halaman","@GRD-010"],"steps":[{"pwStepLine":55,"gherkinStepLine":55,"keywordType":"Context","textWithKeyword":"Given pengguna sudah login sebagai konsultan","stepMatchArguments":[{"group":{"start":29,"value":"konsultan"},"parameterTypeName":"akun"}]},{"pwStepLine":56,"gherkinStepLine":56,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman dashboard admin","stepMatchArguments":[{"group":{"start":25,"value":"dashboard admin"},"parameterTypeName":"halaman"}]},{"pwStepLine":57,"gherkinStepLine":57,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman dashboard konsultan","stepMatchArguments":[{"group":{"start":30,"value":"dashboard konsultan"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":60,"pickleLine":60,"tags":["@sit","@proteksi-halaman","@GRD-011"],"steps":[{"pwStepLine":61,"gherkinStepLine":61,"keywordType":"Context","textWithKeyword":"Given pengguna sudah login sebagai admin","stepMatchArguments":[{"group":{"start":29,"value":"admin"},"parameterTypeName":"akun"}]},{"pwStepLine":62,"gherkinStepLine":62,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman dashboard klien","stepMatchArguments":[{"group":{"start":25,"value":"dashboard klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":63,"gherkinStepLine":63,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman dashboard admin","stepMatchArguments":[{"group":{"start":30,"value":"dashboard admin"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":66,"pickleLine":66,"tags":["@sit","@proteksi-halaman","@GRD-012"],"steps":[{"pwStepLine":67,"gherkinStepLine":67,"keywordType":"Context","textWithKeyword":"Given pengguna sudah login sebagai klien tanpa peran tersimpan di browser","stepMatchArguments":[{"group":{"start":29,"value":"klien"},"parameterTypeName":"akun"}]},{"pwStepLine":68,"gherkinStepLine":68,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman dashboard klien","stepMatchArguments":[{"group":{"start":25,"value":"dashboard klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":69,"gherkinStepLine":69,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman pemilihan peran","stepMatchArguments":[{"group":{"start":30,"value":"pemilihan peran"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":72,"pickleLine":72,"tags":["@sit","@proteksi-halaman","@GRD-013"],"steps":[{"pwStepLine":73,"gherkinStepLine":73,"keywordType":"Context","textWithKeyword":"Given pengguna sudah login sebagai klien","stepMatchArguments":[{"group":{"start":29,"value":"klien"},"parameterTypeName":"akun"}]},{"pwStepLine":74,"gherkinStepLine":74,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman jadwal","stepMatchArguments":[{"group":{"start":25,"value":"jadwal"},"parameterTypeName":"halaman"}]},{"pwStepLine":75,"gherkinStepLine":75,"keywordType":"Outcome","textWithKeyword":"Then pengguna segera diarahkan ke halaman dashboard klien","stepMatchArguments":[{"group":{"start":37,"value":"dashboard klien"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":78,"pickleLine":78,"tags":["@sit","@proteksi-halaman","@GRD-014"],"steps":[{"pwStepLine":79,"gherkinStepLine":79,"keywordType":"Context","textWithKeyword":"Given pengguna sudah login sebagai klien","stepMatchArguments":[{"group":{"start":29,"value":"klien"},"parameterTypeName":"akun"}]},{"pwStepLine":80,"gherkinStepLine":80,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman bursa kasus","stepMatchArguments":[{"group":{"start":25,"value":"bursa kasus"},"parameterTypeName":"halaman"}]},{"pwStepLine":81,"gherkinStepLine":81,"keywordType":"Outcome","textWithKeyword":"Then pengguna segera diarahkan ke halaman dashboard klien","stepMatchArguments":[{"group":{"start":37,"value":"dashboard klien"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":84,"pickleLine":84,"tags":["@sit","@proteksi-halaman","@GRD-015"],"steps":[{"pwStepLine":85,"gherkinStepLine":85,"keywordType":"Context","textWithKeyword":"Given pengguna sudah login sebagai klien","stepMatchArguments":[{"group":{"start":29,"value":"klien"},"parameterTypeName":"akun"}]},{"pwStepLine":86,"gherkinStepLine":86,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman verifikasi konsultan","stepMatchArguments":[{"group":{"start":25,"value":"verifikasi konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":87,"gherkinStepLine":87,"keywordType":"Outcome","textWithKeyword":"Then pengguna segera diarahkan ke halaman dashboard klien","stepMatchArguments":[{"group":{"start":37,"value":"dashboard klien"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":90,"pickleLine":90,"tags":["@sit","@proteksi-halaman","@GRD-016"],"steps":[{"pwStepLine":91,"gherkinStepLine":91,"keywordType":"Context","textWithKeyword":"Given pengguna sudah login sebagai konsultan","stepMatchArguments":[{"group":{"start":29,"value":"konsultan"},"parameterTypeName":"akun"}]},{"pwStepLine":92,"gherkinStepLine":92,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman posting kasus","stepMatchArguments":[{"group":{"start":25,"value":"posting kasus"},"parameterTypeName":"halaman"}]},{"pwStepLine":93,"gherkinStepLine":93,"keywordType":"Outcome","textWithKeyword":"Then pengguna segera diarahkan ke halaman dashboard konsultan","stepMatchArguments":[{"group":{"start":37,"value":"dashboard konsultan"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":96,"pickleLine":96,"tags":["@sit","@proteksi-halaman","@GRD-017"],"steps":[{"pwStepLine":97,"gherkinStepLine":97,"keywordType":"Context","textWithKeyword":"Given pengguna sudah login sebagai konsultan","stepMatchArguments":[{"group":{"start":29,"value":"konsultan"},"parameterTypeName":"akun"}]},{"pwStepLine":98,"gherkinStepLine":98,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman basis pengetahuan","stepMatchArguments":[{"group":{"start":25,"value":"basis pengetahuan"},"parameterTypeName":"halaman"}]},{"pwStepLine":99,"gherkinStepLine":99,"keywordType":"Outcome","textWithKeyword":"Then pengguna segera diarahkan ke halaman dashboard konsultan","stepMatchArguments":[{"group":{"start":37,"value":"dashboard konsultan"},"parameterTypeName":"halaman"}]}]},
]; // bdd-data-end
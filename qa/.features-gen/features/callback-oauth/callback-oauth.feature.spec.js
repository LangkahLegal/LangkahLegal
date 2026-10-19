// Generated from: features\callback-oauth\callback-oauth.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Callback login Google', () => {

  test('Penolakan akses di Google diberitahukan ke pengguna', { tag: ['@sit', '@callback-oauth', '@AUTH-037'] }, async ({ When, Then, callbackOauthPage, page, world }) => { 
    await When('pengguna kembali dari Google setelah menolak memberi akses', null, { callbackOauthPage, page, world }); 
    await Then('galat callback menampilkan alasan penolakan', null, { callbackOauthPage, page, world }); 
    await When('pengguna memilih kembali ke login', null, { callbackOauthPage, page, world }); 
    await Then('pengguna diarahkan ke halaman login', null, { page, world }); 
  });

  test('Callback tanpa kode otorisasi dikembalikan ke login', { tag: ['@sit', '@callback-oauth', '@AUTH-038'] }, async ({ When, Then, page, world }) => { 
    await When('pengguna membuka halaman callback OAuth', null, { page, world }); 
    await Then('pengguna diarahkan ke halaman login', null, { page, world }); 
  });

  test('Pendaftaran konsultan lewat Google berakhir di dashboard konsultan', { tag: ['@sit', '@callback-oauth', '@AUTH-039', '@stub'] }, async ({ Given, When, Then, And, callbackOauthPage, network, page, world }) => { 
    await Given('Google mengenali pengguna sebagai konsultan', null, { network, page, world }); 
    await And('pendaftaran lewat Google sebagai konsultan sedang berlangsung', null, { page, world }); 
    await When('pengguna kembali dari Google dengan kode otorisasi', null, { callbackOauthPage, page, world }); 
    await Then('pengguna diarahkan ke halaman dashboard konsultan', null, { page, world }); 
    await And('kode otorisasi ditukar bersama kode verifikasinya', null, { network, page, world }); 
    await And('peran konsultan dikirim ke backend', null, { network, page, world }); 
  });

  test('Pengguna Google baru tanpa peran otomatis menjadi klien', { tag: ['@sit', '@callback-oauth', '@AUTH-040', '@stub'] }, async ({ Given, When, Then, And, callbackOauthPage, network, page, world }) => { 
    await Given('Google mengenali pengguna sebagai akun tanpa peran', null, { network, page, world }); 
    await When('pengguna kembali dari Google dengan kode otorisasi', null, { callbackOauthPage, page, world }); 
    await Then('pengguna diarahkan ke halaman dashboard klien', null, { page, world }); 
    await And('peran klien dikirim ke backend', null, { network, page, world }); 
    await And('akun tanpa peran tersimpan sebagai klien', null, { page, world }); 
  });

  test('Tujuan lanjutan ke situs luar tidak boleh mengalihkan pengguna', { tag: ['@sit', '@callback-oauth', '@AUTH-041', '@stub'] }, async ({ Given, When, Then, callbackOauthPage, network, page, world }) => { 
    await Given('Google mengenali pengguna sebagai klien', null, { network, page, world }); 
    await When('pengguna kembali dari Google dengan tujuan lanjutan ke situs luar', null, { callbackOauthPage, page, world }); 
    await Then('browser tetap berada di aplikasi LangkahLegal', null, { page, world }); 
  });

  test('Kode otorisasi yang tidak berlaku diberitahukan ke pengguna', { tag: ['@sit', '@callback-oauth', '@AUTH-042'] }, async ({ Given, When, Then, And, callbackOauthPage, network, page, world }) => { 
    await Given('browser masih menyimpan kode verifikasi OAuth', null, { page, world }); 
    await When('pengguna kembali dari Google dengan kode otorisasi yang tidak berlaku', null, { callbackOauthPage, page, world }); 
    await Then('galat callback tampil', null, { callbackOauthPage, page, world }); 
    await And('hanya ada 1 permintaan tukar kode OAuth yang dikirim ke backend', null, { network, page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\callback-oauth\\callback-oauth.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":9,"tags":["@sit","@callback-oauth","@AUTH-037"],"steps":[{"pwStepLine":7,"gherkinStepLine":10,"keywordType":"Action","textWithKeyword":"When pengguna kembali dari Google setelah menolak memberi akses","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":11,"keywordType":"Outcome","textWithKeyword":"Then galat callback menampilkan alasan penolakan","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":12,"keywordType":"Action","textWithKeyword":"When pengguna memilih kembali ke login","stepMatchArguments":[]},{"pwStepLine":10,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman login","stepMatchArguments":[{"group":{"start":30,"value":"login"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":13,"pickleLine":16,"tags":["@sit","@callback-oauth","@AUTH-038"],"steps":[{"pwStepLine":14,"gherkinStepLine":17,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman callback OAuth","stepMatchArguments":[{"group":{"start":25,"value":"callback OAuth"},"parameterTypeName":"halaman"}]},{"pwStepLine":15,"gherkinStepLine":18,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman login","stepMatchArguments":[{"group":{"start":30,"value":"login"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":18,"pickleLine":21,"tags":["@sit","@callback-oauth","@AUTH-039","@stub"],"steps":[{"pwStepLine":19,"gherkinStepLine":22,"keywordType":"Context","textWithKeyword":"Given Google mengenali pengguna sebagai konsultan","stepMatchArguments":[{"group":{"start":34,"value":"konsultan"},"parameterTypeName":"akun"}]},{"pwStepLine":20,"gherkinStepLine":23,"keywordType":"Context","textWithKeyword":"And pendaftaran lewat Google sebagai konsultan sedang berlangsung","stepMatchArguments":[{"group":{"start":33,"value":"konsultan"},"parameterTypeName":"akun"}]},{"pwStepLine":21,"gherkinStepLine":24,"keywordType":"Action","textWithKeyword":"When pengguna kembali dari Google dengan kode otorisasi","stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":25,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman dashboard konsultan","stepMatchArguments":[{"group":{"start":30,"value":"dashboard konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":23,"gherkinStepLine":26,"keywordType":"Outcome","textWithKeyword":"And kode otorisasi ditukar bersama kode verifikasinya","stepMatchArguments":[]},{"pwStepLine":24,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"And peran konsultan dikirim ke backend","stepMatchArguments":[{"group":{"start":6,"value":"konsultan"},"parameterTypeName":"akun"}]}]},
  {"pwTestLine":27,"pickleLine":30,"tags":["@sit","@callback-oauth","@AUTH-040","@stub"],"steps":[{"pwStepLine":28,"gherkinStepLine":31,"keywordType":"Context","textWithKeyword":"Given Google mengenali pengguna sebagai akun tanpa peran","stepMatchArguments":[{"group":{"start":34,"value":"akun tanpa peran"},"parameterTypeName":"akun"}]},{"pwStepLine":29,"gherkinStepLine":32,"keywordType":"Action","textWithKeyword":"When pengguna kembali dari Google dengan kode otorisasi","stepMatchArguments":[]},{"pwStepLine":30,"gherkinStepLine":33,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman dashboard klien","stepMatchArguments":[{"group":{"start":30,"value":"dashboard klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":31,"gherkinStepLine":34,"keywordType":"Outcome","textWithKeyword":"And peran klien dikirim ke backend","stepMatchArguments":[{"group":{"start":6,"value":"klien"},"parameterTypeName":"akun"}]},{"pwStepLine":32,"gherkinStepLine":35,"keywordType":"Outcome","textWithKeyword":"And akun tanpa peran tersimpan sebagai klien","stepMatchArguments":[{"group":{"start":0,"value":"akun tanpa peran"},"parameterTypeName":"akun"},{"group":{"start":35,"value":"klien"},"parameterTypeName":"akun"}]}]},
  {"pwTestLine":35,"pickleLine":38,"tags":["@sit","@callback-oauth","@AUTH-041","@stub"],"steps":[{"pwStepLine":36,"gherkinStepLine":39,"keywordType":"Context","textWithKeyword":"Given Google mengenali pengguna sebagai klien","stepMatchArguments":[{"group":{"start":34,"value":"klien"},"parameterTypeName":"akun"}]},{"pwStepLine":37,"gherkinStepLine":40,"keywordType":"Action","textWithKeyword":"When pengguna kembali dari Google dengan tujuan lanjutan ke situs luar","stepMatchArguments":[]},{"pwStepLine":38,"gherkinStepLine":41,"keywordType":"Outcome","textWithKeyword":"Then browser tetap berada di aplikasi LangkahLegal","stepMatchArguments":[]}]},
  {"pwTestLine":41,"pickleLine":44,"tags":["@sit","@callback-oauth","@AUTH-042"],"steps":[{"pwStepLine":42,"gherkinStepLine":45,"keywordType":"Context","textWithKeyword":"Given browser masih menyimpan kode verifikasi OAuth","stepMatchArguments":[]},{"pwStepLine":43,"gherkinStepLine":46,"keywordType":"Action","textWithKeyword":"When pengguna kembali dari Google dengan kode otorisasi yang tidak berlaku","stepMatchArguments":[]},{"pwStepLine":44,"gherkinStepLine":47,"keywordType":"Outcome","textWithKeyword":"Then galat callback tampil","stepMatchArguments":[]},{"pwStepLine":45,"gherkinStepLine":48,"keywordType":"Outcome","textWithKeyword":"And hanya ada 1 permintaan tukar kode OAuth yang dikirim ke backend","stepMatchArguments":[{"group":{"start":10,"value":"1"},"parameterTypeName":"int"},{"group":{"start":23,"value":"tukar kode OAuth"},"parameterTypeName":"layanan"}]}]},
]; // bdd-data-end
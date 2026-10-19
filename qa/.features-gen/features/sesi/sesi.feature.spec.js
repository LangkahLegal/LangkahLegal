// Generated from: features\sesi\sesi.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Sesi dan pembaruan token', () => {

  test('Token akses kedaluwarsa diperbarui otomatis', { tag: ['@sit', '@sesi', '@SES-001', '@critical'] }, async ({ Given, When, Then, And, auth, network, page, world }) => { 
    await Given('token akses klien sudah kedaluwarsa', null, { auth, page, world }); 
    await When('pengguna membuka halaman dashboard klien', null, { page, world }); 
    await Then('dashboard menampilkan nama pengguna', null, { page, world }); 
    await And('hanya ada 1 permintaan perbarui sesi yang dikirim ke backend', null, { network, page, world }); 
    await And('token akses di browser sudah diganti dengan yang baru', null, { page, world }); 
  });

  test('Setelah token diperbarui, setiap permintaan memakai token yang baru', { tag: ['@sit', '@sesi', '@SES-004', '@continue'] }, async ({ When, Then, And, network, page, world }) => { 
    await When('pengguna membuka halaman dashboard klien', null, { page, world }); 
    await Then('dashboard menampilkan nama pengguna', null, { page, world }); 
    await And('semua permintaan ke backend membawa token akses pengguna', null, { network, page, world }); 
  });

  test('Sesi yang tidak bisa diperbarui dibersihkan dan pengguna diminta login', { tag: ['@sit', '@sesi', '@SES-002'] }, async ({ Given, When, Then, And, auth, page, world }) => { 
    await Given('token akses dan token pembaruan klien sudah tidak berlaku', null, { auth, page, world }); 
    await When('pengguna membuka halaman dashboard klien', null, { page, world }); 
    await Then('tidak ada sesi yang tersimpan di browser', null, { page, world }); 
    await And('pengguna segera diarahkan ke halaman login', null, { page, world }); 
  });

  test('Beberapa permintaan yang ditolak bersamaan hanya memicu satu pembaruan sesi', { tag: ['@sit', '@sesi', '@SES-003'] }, async ({ Given, When, Then, And, auth, network, page, world }) => { 
    await Given('token akses konsultan sudah kedaluwarsa', null, { auth, page, world }); 
    await When('pengguna membuka halaman dashboard konsultan', null, { page, world }); 
    await Then('dashboard konsultan selesai dimuat', null, { page, world }); 
    await And('hanya ada 1 permintaan perbarui sesi yang dikirim ke backend', null, { network, page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\sesi\\sesi.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":6,"tags":["@sit","@sesi","@SES-001","@critical"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given token akses klien sudah kedaluwarsa","stepMatchArguments":[{"group":{"start":12,"value":"klien"},"parameterTypeName":"akun"}]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman dashboard klien","stepMatchArguments":[{"group":{"start":25,"value":"dashboard klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":9,"gherkinStepLine":9,"keywordType":"Outcome","textWithKeyword":"Then dashboard menampilkan nama pengguna","stepMatchArguments":[]},{"pwStepLine":10,"gherkinStepLine":10,"keywordType":"Outcome","textWithKeyword":"And hanya ada 1 permintaan perbarui sesi yang dikirim ke backend","stepMatchArguments":[{"group":{"start":10,"value":"1"},"parameterTypeName":"int"},{"group":{"start":23,"value":"perbarui sesi"},"parameterTypeName":"layanan"}]},{"pwStepLine":11,"gherkinStepLine":11,"keywordType":"Outcome","textWithKeyword":"And token akses di browser sudah diganti dengan yang baru","stepMatchArguments":[]}]},
  {"pwTestLine":14,"pickleLine":14,"tags":["@sit","@sesi","@SES-004","@continue"],"steps":[{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman dashboard klien","stepMatchArguments":[{"group":{"start":25,"value":"dashboard klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":16,"gherkinStepLine":16,"keywordType":"Outcome","textWithKeyword":"Then dashboard menampilkan nama pengguna","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"And semua permintaan ke backend membawa token akses pengguna","stepMatchArguments":[]}]},
  {"pwTestLine":20,"pickleLine":20,"tags":["@sit","@sesi","@SES-002"],"steps":[{"pwStepLine":21,"gherkinStepLine":21,"keywordType":"Context","textWithKeyword":"Given token akses dan token pembaruan klien sudah tidak berlaku","stepMatchArguments":[{"group":{"start":32,"value":"klien"},"parameterTypeName":"akun"}]},{"pwStepLine":22,"gherkinStepLine":22,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman dashboard klien","stepMatchArguments":[{"group":{"start":25,"value":"dashboard klien"},"parameterTypeName":"halaman"}]},{"pwStepLine":23,"gherkinStepLine":23,"keywordType":"Outcome","textWithKeyword":"Then tidak ada sesi yang tersimpan di browser","stepMatchArguments":[]},{"pwStepLine":24,"gherkinStepLine":24,"keywordType":"Outcome","textWithKeyword":"And pengguna segera diarahkan ke halaman login","stepMatchArguments":[{"group":{"start":37,"value":"login"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":27,"pickleLine":27,"tags":["@sit","@sesi","@SES-003"],"steps":[{"pwStepLine":28,"gherkinStepLine":28,"keywordType":"Context","textWithKeyword":"Given token akses konsultan sudah kedaluwarsa","stepMatchArguments":[{"group":{"start":12,"value":"konsultan"},"parameterTypeName":"akun"}]},{"pwStepLine":29,"gherkinStepLine":29,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman dashboard konsultan","stepMatchArguments":[{"group":{"start":25,"value":"dashboard konsultan"},"parameterTypeName":"halaman"}]},{"pwStepLine":30,"gherkinStepLine":30,"keywordType":"Outcome","textWithKeyword":"Then dashboard konsultan selesai dimuat","stepMatchArguments":[]},{"pwStepLine":31,"gherkinStepLine":31,"keywordType":"Outcome","textWithKeyword":"And hanya ada 1 permintaan perbarui sesi yang dikirim ke backend","stepMatchArguments":[{"group":{"start":10,"value":"1"},"parameterTypeName":"int"},{"group":{"start":23,"value":"perbarui sesi"},"parameterTypeName":"layanan"}]}]},
]; // bdd-data-end
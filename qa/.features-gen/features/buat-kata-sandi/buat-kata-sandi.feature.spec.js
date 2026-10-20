// Generated from: features\buat-kata-sandi\buat-kata-sandi.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Buat kata sandi', () => {

  test('Kata sandi dengan format tidak valid ditolak', { tag: ['@sit', '@buat-kata-sandi', '@AUTH-035'] }, async ({ Given, When, Then, buatKataSandiPage, page, world }) => { 
    await Given('pengguna berada di halaman buat kata sandi', null, { page, world }); 
    await When('pengguna membuat kata sandi dengan format tidak valid', null, { buatKataSandiPage, page, world }); 
    await Then('setiap kata sandi itu ditolak dengan pesan yang sesuai', null, { page, world }); 
  });

  test('Kata sandi yang valid tersimpan lalu pengguna menuju dashboard', { tag: ['@sit', '@buat-kata-sandi', '@AUTH-036', '@precondition:login-klien-sementara-tanpa-kata-sandi'] }, async ({ Given, When, Then, And, buatKataSandiPage, page, world }) => { 
    await Given('pengguna diminta membuat kata sandi setelah masuk lewat Google', null, { page, world }); 
    await And('pengguna berada di halaman buat kata sandi', null, { page, world }); 
    await When('pengguna membuat kata sandi yang valid', null, { buatKataSandiPage, page, world }); 
    await Then('tidak ada pesan galat buat kata sandi', null, { buatKataSandiPage, page, world }); 
    await And('pengguna diarahkan ke halaman dashboard klien', null, { page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\buat-kata-sandi\\buat-kata-sandi.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":6,"tags":["@sit","@buat-kata-sandi","@AUTH-035"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman buat kata sandi","stepMatchArguments":[{"group":{"start":27,"value":"buat kata sandi"},"parameterTypeName":"halaman"}]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Action","textWithKeyword":"When pengguna membuat kata sandi dengan format tidak valid","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":9,"keywordType":"Outcome","textWithKeyword":"Then setiap kata sandi itu ditolak dengan pesan yang sesuai","stepMatchArguments":[]}]},
  {"pwTestLine":12,"pickleLine":12,"tags":["@sit","@buat-kata-sandi","@AUTH-036","@precondition:login-klien-sementara-tanpa-kata-sandi"],"steps":[{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Context","textWithKeyword":"Given pengguna diminta membuat kata sandi setelah masuk lewat Google","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman buat kata sandi","stepMatchArguments":[{"group":{"start":27,"value":"buat kata sandi"},"parameterTypeName":"halaman"}]},{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Action","textWithKeyword":"When pengguna membuat kata sandi yang valid","stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":16,"keywordType":"Outcome","textWithKeyword":"Then tidak ada pesan galat buat kata sandi","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"And pengguna diarahkan ke halaman dashboard klien","stepMatchArguments":[{"group":{"start":30,"value":"dashboard klien"},"parameterTypeName":"halaman"}]}]},
]; // bdd-data-end
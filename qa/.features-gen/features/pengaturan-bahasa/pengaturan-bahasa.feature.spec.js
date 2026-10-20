// Generated from: features\pengaturan-bahasa\pengaturan-bahasa.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Pengaturan bahasa', () => {

  test('Pilihan bahasa Inggris tersimpan', { tag: ['@sit', '@pengaturan-bahasa', '@precondition:login-klien', '@LNG-001'] }, async ({ Given, When, Then, page, pengaturanBahasaPage, world }) => { 
    await Given('pengguna berada di halaman pengaturan bahasa', null, { page, world }); 
    await When('pengguna memilih bahasa Inggris lalu menyimpannya', null, { page, pengaturanBahasaPage, world }); 
    await Then('pengguna diarahkan ke halaman pengaturan', null, { page, world }); 
    await When('pengguna membuka halaman pengaturan bahasa', null, { page, world }); 
    await Then('bahasa Inggris masih terpilih', null, { page, pengaturanBahasaPage, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\pengaturan-bahasa\\pengaturan-bahasa.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":6,"tags":["@sit","@pengaturan-bahasa","@precondition:login-klien","@LNG-001"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman pengaturan bahasa","stepMatchArguments":[{"group":{"start":27,"value":"pengaturan bahasa"},"parameterTypeName":"halaman"}]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Action","textWithKeyword":"When pengguna memilih bahasa Inggris lalu menyimpannya","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":9,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman pengaturan","stepMatchArguments":[{"group":{"start":30,"value":"pengaturan"},"parameterTypeName":"halaman"}]},{"pwStepLine":10,"gherkinStepLine":10,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman pengaturan bahasa","stepMatchArguments":[{"group":{"start":25,"value":"pengaturan bahasa"},"parameterTypeName":"halaman"}]},{"pwStepLine":11,"gherkinStepLine":11,"keywordType":"Outcome","textWithKeyword":"Then bahasa Inggris masih terpilih","stepMatchArguments":[]}]},
]; // bdd-data-end
// Generated from: features\tentang-aplikasi\tentang-aplikasi.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Tentang aplikasi', () => {

  test('Halaman tentang aplikasi dapat dibuka dari pengaturan', { tag: ['@sit', '@tentang-aplikasi', '@precondition:login-klien', '@ABT-001'] }, async ({ When, Then, page, world }) => { 
    await When('pengguna membuka halaman tentang aplikasi', null, { page, world }); 
    await Then('halaman tentang aplikasi menampilkan penjelasan LangkahLegal', null, { page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\tentang-aplikasi\\tentang-aplikasi.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":6,"tags":["@sit","@tentang-aplikasi","@precondition:login-klien","@ABT-001"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman tentang aplikasi","stepMatchArguments":[{"group":{"start":25,"value":"tentang aplikasi"},"parameterTypeName":"halaman"}]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Outcome","textWithKeyword":"Then halaman tentang aplikasi menampilkan penjelasan LangkahLegal","stepMatchArguments":[]}]},
]; // bdd-data-end
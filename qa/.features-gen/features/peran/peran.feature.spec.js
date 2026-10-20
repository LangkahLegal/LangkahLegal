// Generated from: features\peran\peran.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Pemilihan peran', () => {

  test('Peran klien terpilih sejak awal', { tag: ['@sit', '@peran', '@AUTH-016'] }, async ({ Given, Then, page, peranPage, world }) => { 
    await Given('pengguna berada di halaman pemilihan peran', null, { page, world }); 
    await Then('peran klien sudah terpilih', null, { page, peranPage, world }); 
  });

  test('Memilih peran konsultan membuka formulir pendaftaran konsultan', { tag: ['@sit', '@peran', '@AUTH-016', '@mobile'] }, async ({ Given, When, Then, And, page, peranPage, world }) => { 
    await Given('pengguna berada di halaman pemilihan peran', null, { page, world }); 
    await When('pengguna memilih mendaftar sebagai konsultan', null, { page, peranPage, world }); 
    await Then('pengguna diarahkan ke halaman pendaftaran', null, { page, world }); 
    await And('formulir pendaftaran konsultan tampil', null, { page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\peran\\peran.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":6,"tags":["@sit","@peran","@AUTH-016"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman pemilihan peran","stepMatchArguments":[{"group":{"start":27,"value":"pemilihan peran"},"parameterTypeName":"halaman"}]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Outcome","textWithKeyword":"Then peran klien sudah terpilih","stepMatchArguments":[{"group":{"start":6,"value":"klien"},"parameterTypeName":"peranDaftar"}]}]},
  {"pwTestLine":11,"pickleLine":11,"tags":["@sit","@peran","@AUTH-016","@mobile"],"steps":[{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman pemilihan peran","stepMatchArguments":[{"group":{"start":27,"value":"pemilihan peran"},"parameterTypeName":"halaman"}]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Action","textWithKeyword":"When pengguna memilih mendaftar sebagai konsultan","stepMatchArguments":[{"group":{"start":35,"value":"konsultan"},"parameterTypeName":"peranDaftar"}]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman pendaftaran","stepMatchArguments":[{"group":{"start":30,"value":"pendaftaran"},"parameterTypeName":"halaman"}]},{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"And formulir pendaftaran konsultan tampil","stepMatchArguments":[{"group":{"start":21,"value":"konsultan"},"parameterTypeName":"peranDaftar"}]}]},
]; // bdd-data-end
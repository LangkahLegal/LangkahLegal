// Generated from: features\lupa-kata-sandi\lupa-kata-sandi.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Lupa kata sandi', () => {

  test('Permintaan tautan reset dikonfirmasi ke pengguna', { tag: ['@sit', '@lupa-kata-sandi', '@AUTH-029', '@stub'] }, async ({ Given, When, Then, And, lupaKataSandiPage, network, page, world }) => { 
    await Given('layanan lupa kata sandi menerima permintaan', null, { network, page, world }); 
    await And('pengguna berada di halaman lupa kata sandi', null, { page, world }); 
    await When('pengguna meminta tautan reset untuk emailnya', null, { lupaKataSandiPage, page, world }); 
    await Then('konfirmasi tautan terkirim tampil beserta emailnya', null, { lupaKataSandiPage, page, world }); 
    await And('tautan reset diminta mengarah ke halaman reset kata sandi', null, { network, page, world }); 
  });

  test('Permintaan tautan reset tanpa email ditolak peramban', { tag: ['@sit', '@lupa-kata-sandi', '@AUTH-030'] }, async ({ Given, When, Then, lupaKataSandiPage, network, page, world }) => { 
    await Given('pengguna berada di halaman lupa kata sandi', null, { page, world }); 
    await When('pengguna meminta tautan reset tanpa mengisi email', null, { lupaKataSandiPage, page, world }); 
    await Then('tidak ada permintaan lupa kata sandi yang dikirim ke backend', null, { network, page, world }); 
  });

  test('Penolakan backend saat meminta tautan reset diberitahukan ke pengguna', { tag: ['@sit', '@lupa-kata-sandi', '@AUTH-030', '@stub'] }, async ({ Given, When, Then, And, lupaKataSandiPage, network, page, world }) => { 
    await Given('layanan lupa kata sandi menolak dengan pesan "User not found"', null, { network, page, world }); 
    await And('pengguna berada di halaman lupa kata sandi', null, { page, world }); 
    await When('pengguna meminta tautan reset untuk emailnya', null, { lupaKataSandiPage, page, world }); 
    await Then('pengguna melihat pesan "User not found"', null, { page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\lupa-kata-sandi\\lupa-kata-sandi.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":8,"tags":["@sit","@lupa-kata-sandi","@AUTH-029","@stub"],"steps":[{"pwStepLine":7,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"Given layanan lupa kata sandi menerima permintaan","stepMatchArguments":[{"group":{"start":8,"value":"lupa kata sandi"},"parameterTypeName":"layanan"}]},{"pwStepLine":8,"gherkinStepLine":10,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman lupa kata sandi","stepMatchArguments":[{"group":{"start":27,"value":"lupa kata sandi"},"parameterTypeName":"halaman"}]},{"pwStepLine":9,"gherkinStepLine":11,"keywordType":"Action","textWithKeyword":"When pengguna meminta tautan reset untuk emailnya","stepMatchArguments":[]},{"pwStepLine":10,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"Then konfirmasi tautan terkirim tampil beserta emailnya","stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"And tautan reset diminta mengarah ke halaman reset kata sandi","stepMatchArguments":[]}]},
  {"pwTestLine":14,"pickleLine":16,"tags":["@sit","@lupa-kata-sandi","@AUTH-030"],"steps":[{"pwStepLine":15,"gherkinStepLine":17,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman lupa kata sandi","stepMatchArguments":[{"group":{"start":27,"value":"lupa kata sandi"},"parameterTypeName":"halaman"}]},{"pwStepLine":16,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"When pengguna meminta tautan reset tanpa mengisi email","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then tidak ada permintaan lupa kata sandi yang dikirim ke backend","stepMatchArguments":[{"group":{"start":21,"value":"lupa kata sandi"},"parameterTypeName":"layanan"}]}]},
  {"pwTestLine":20,"pickleLine":22,"tags":["@sit","@lupa-kata-sandi","@AUTH-030","@stub"],"steps":[{"pwStepLine":21,"gherkinStepLine":23,"keywordType":"Context","textWithKeyword":"Given layanan lupa kata sandi menolak dengan pesan \"User not found\"","stepMatchArguments":[{"group":{"start":8,"value":"lupa kata sandi"},"parameterTypeName":"layanan"},{"group":{"start":45,"value":"\"User not found\"","children":[{"start":46,"value":"User not found","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":22,"gherkinStepLine":24,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman lupa kata sandi","stepMatchArguments":[{"group":{"start":27,"value":"lupa kata sandi"},"parameterTypeName":"halaman"}]},{"pwStepLine":23,"gherkinStepLine":25,"keywordType":"Action","textWithKeyword":"When pengguna meminta tautan reset untuk emailnya","stepMatchArguments":[]},{"pwStepLine":24,"gherkinStepLine":26,"keywordType":"Outcome","textWithKeyword":"Then pengguna melihat pesan \"User not found\"","stepMatchArguments":[{"group":{"start":23,"value":"\"User not found\"","children":[{"start":24,"value":"User not found","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end
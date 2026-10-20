// Generated from: features\reset-kata-sandi\reset-kata-sandi.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Reset kata sandi', () => {

  test('Halaman reset tanpa tautan yang sah ditolak', { tag: ['@sit', '@reset-kata-sandi', '@AUTH-031'] }, async ({ Given, Then, And, page, resetKataSandiPage, world }) => { 
    await Given('pengguna berada di halaman reset kata sandi', null, { page, world }); 
    await Then('tautan reset dinyatakan tidak valid', null, { page, resetKataSandiPage, world }); 
    await And('pengguna dapat meminta tautan reset baru', null, { page, resetKataSandiPage, world }); 
  });

  test('Tautan reset yang sudah tidak berlaku ditolak', { tag: ['@sit', '@reset-kata-sandi', '@AUTH-032'] }, async ({ When, Then, page, resetKataSandiPage, world }) => { 
    await When('pengguna membuka tautan reset yang sudah tidak berlaku', null, { page, resetKataSandiPage, world }); 
    await Then('pengguna diberi tahu tautan reset sudah kedaluwarsa', null, { page, resetKataSandiPage, world }); 
  });

  test('Kata sandi baru dengan format tidak valid ditolak', { tag: ['@sit', '@reset-kata-sandi', '@AUTH-033', '@precondition:pengguna-reset-kata-sandi'] }, async ({ Given, When, Then, And, network, page, resetKataSandiPage, world }) => { 
    await Given('pengguna membuka tautan reset yang diterimanya', null, { page, resetKataSandiPage, world }); 
    await When('pengguna menyimpan kata sandi baru dengan format tidak valid', null, { page, resetKataSandiPage, world }); 
    await Then('setiap kata sandi itu ditolak dengan pesan yang sesuai', null, { page, world }); 
    await And('tidak ada permintaan reset kata sandi yang dikirim ke backend', null, { network, page, world }); 
  });

  test('Kata sandi berhasil direset lalu dapat dipakai untuk login', { tag: ['@sit', '@reset-kata-sandi', '@AUTH-034', '@precondition:pengguna-reset-kata-sandi'] }, async ({ Given, When, Then, And, dialogs, page, resetKataSandiPage, world }) => { 
    await Given('pengguna membuka tautan reset yang diterimanya', null, { page, resetKataSandiPage, world }); 
    await When('pengguna menyimpan kata sandi baru yang valid', null, { page, resetKataSandiPage, world }); 
    await Then('muncul pemberitahuan "Password berhasil diubah"', null, { dialogs, page, world }); 
    await And('pengguna diarahkan ke halaman login', null, { page, world }); 
    await And('kata sandi baru dapat dipakai untuk login', null, { page, world }); 
  });

  test('Label formulir reset terhubung ke kolom yang benar', { tag: ['@sit', '@reset-kata-sandi', '@AUTH-043', '@precondition:pengguna-reset-kata-sandi'] }, async ({ Given, When, Then, And, page, resetKataSandiPage, world }) => { 
    await Given('pengguna membuka tautan reset yang diterimanya', null, { page, resetKataSandiPage, world }); 
    await When('pengguna memilih label konfirmasi kata sandi baru', null, { page, resetKataSandiPage, world }); 
    await Then('kolom konfirmasi kata sandi baru menjadi aktif', null, { page, resetKataSandiPage, world }); 
    await And('setiap kolom formulir reset punya id unik', null, { page, resetKataSandiPage, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\reset-kata-sandi\\reset-kata-sandi.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":6,"tags":["@sit","@reset-kata-sandi","@AUTH-031"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman reset kata sandi","stepMatchArguments":[{"group":{"start":27,"value":"reset kata sandi"},"parameterTypeName":"halaman"}]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Outcome","textWithKeyword":"Then tautan reset dinyatakan tidak valid","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":9,"keywordType":"Outcome","textWithKeyword":"And pengguna dapat meminta tautan reset baru","stepMatchArguments":[]}]},
  {"pwTestLine":12,"pickleLine":12,"tags":["@sit","@reset-kata-sandi","@AUTH-032"],"steps":[{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Action","textWithKeyword":"When pengguna membuka tautan reset yang sudah tidak berlaku","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"Then pengguna diberi tahu tautan reset sudah kedaluwarsa","stepMatchArguments":[]}]},
  {"pwTestLine":17,"pickleLine":17,"tags":["@sit","@reset-kata-sandi","@AUTH-033","@precondition:pengguna-reset-kata-sandi"],"steps":[{"pwStepLine":18,"gherkinStepLine":18,"keywordType":"Context","textWithKeyword":"Given pengguna membuka tautan reset yang diterimanya","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":19,"keywordType":"Action","textWithKeyword":"When pengguna menyimpan kata sandi baru dengan format tidak valid","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"Then setiap kata sandi itu ditolak dengan pesan yang sesuai","stepMatchArguments":[]},{"pwStepLine":21,"gherkinStepLine":21,"keywordType":"Outcome","textWithKeyword":"And tidak ada permintaan reset kata sandi yang dikirim ke backend","stepMatchArguments":[{"group":{"start":21,"value":"reset kata sandi"},"parameterTypeName":"layanan"}]}]},
  {"pwTestLine":24,"pickleLine":24,"tags":["@sit","@reset-kata-sandi","@AUTH-034","@precondition:pengguna-reset-kata-sandi"],"steps":[{"pwStepLine":25,"gherkinStepLine":25,"keywordType":"Context","textWithKeyword":"Given pengguna membuka tautan reset yang diterimanya","stepMatchArguments":[]},{"pwStepLine":26,"gherkinStepLine":26,"keywordType":"Action","textWithKeyword":"When pengguna menyimpan kata sandi baru yang valid","stepMatchArguments":[]},{"pwStepLine":27,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"Then muncul pemberitahuan \"Password berhasil diubah\"","stepMatchArguments":[{"group":{"start":21,"value":"\"Password berhasil diubah\"","children":[{"start":22,"value":"Password berhasil diubah","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":28,"gherkinStepLine":28,"keywordType":"Outcome","textWithKeyword":"And pengguna diarahkan ke halaman login","stepMatchArguments":[{"group":{"start":30,"value":"login"},"parameterTypeName":"halaman"}]},{"pwStepLine":29,"gherkinStepLine":29,"keywordType":"Outcome","textWithKeyword":"And kata sandi baru dapat dipakai untuk login","stepMatchArguments":[]}]},
  {"pwTestLine":32,"pickleLine":32,"tags":["@sit","@reset-kata-sandi","@AUTH-043","@precondition:pengguna-reset-kata-sandi"],"steps":[{"pwStepLine":33,"gherkinStepLine":33,"keywordType":"Context","textWithKeyword":"Given pengguna membuka tautan reset yang diterimanya","stepMatchArguments":[]},{"pwStepLine":34,"gherkinStepLine":34,"keywordType":"Action","textWithKeyword":"When pengguna memilih label konfirmasi kata sandi baru","stepMatchArguments":[]},{"pwStepLine":35,"gherkinStepLine":35,"keywordType":"Outcome","textWithKeyword":"Then kolom konfirmasi kata sandi baru menjadi aktif","stepMatchArguments":[]},{"pwStepLine":36,"gherkinStepLine":36,"keywordType":"Outcome","textWithKeyword":"And setiap kolom formulir reset punya id unik","stepMatchArguments":[]}]},
]; // bdd-data-end
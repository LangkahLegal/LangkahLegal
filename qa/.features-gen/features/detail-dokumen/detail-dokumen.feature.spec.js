// Generated from: features\detail-dokumen\detail-dokumen.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Detail dokumen hukum', () => {

  test('Admin membaca seluruh pasal sebuah dokumen', { tag: ['@sit', '@detail-dokumen', '@precondition:login-admin', '@KNW-008'] }, async ({ Given, When, Then, detailDokumenPage, page, world }) => { 
    await Given('basis pengetahuan berisi dokumen uji', null, { page, world }); 
    await When('pengguna membuka detail dokumen uji', null, { detailDokumenPage, page, world }); 
    await Then('detail dokumen menampilkan identitas dokumen uji', null, { page, world }); 
    await When('pengguna membuka semua pasal', null, { detailDokumenPage, page, world }); 
    await Then('isi setiap pasal dokumen uji tampil', null, { page, world }); 
  });

  test('Admin memperbaiki isi sebuah pasal', { tag: ['@sit', '@detail-dokumen', '@precondition:login-admin', '@KNW-008', '@layanan-eksternal'] }, async ({ Given, When, Then, And, detailDokumenPage, page, world }) => { 
    await Given('basis pengetahuan berisi dokumen uji', null, { page, world }); 
    await And('pengguna membuka detail dokumen uji', null, { detailDokumenPage, page, world }); 
    await When('pengguna menyunting isi pasal pertama', null, { detailDokumenPage, page, world }); 
    await Then('muncul keterangan perubahan pasal berhasil disimpan', null, { page, world }); 
    await And('isi pasal pertama tersimpan di database', null, { page, world }); 
  });

  test('Detail dokumen tanpa dokumen yang dipilih menampilkan keadaan kosong', { tag: ['@sit', '@detail-dokumen', '@precondition:login-admin', '@KNW-009'] }, async ({ When, Then, detailDokumenPage, page, world }) => { 
    await When('pengguna membuka halaman detail dokumen', null, { page, world }); 
    await Then('detail dokumen menampilkan keadaan kosong', null, { detailDokumenPage, page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\detail-dokumen\\detail-dokumen.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":6,"tags":["@sit","@detail-dokumen","@precondition:login-admin","@KNW-008"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given basis pengetahuan berisi dokumen uji","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Action","textWithKeyword":"When pengguna membuka detail dokumen uji","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":9,"keywordType":"Outcome","textWithKeyword":"Then detail dokumen menampilkan identitas dokumen uji","stepMatchArguments":[]},{"pwStepLine":10,"gherkinStepLine":10,"keywordType":"Action","textWithKeyword":"When pengguna membuka semua pasal","stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":11,"keywordType":"Outcome","textWithKeyword":"Then isi setiap pasal dokumen uji tampil","stepMatchArguments":[]}]},
  {"pwTestLine":14,"pickleLine":15,"tags":["@sit","@detail-dokumen","@precondition:login-admin","@KNW-008","@layanan-eksternal"],"steps":[{"pwStepLine":15,"gherkinStepLine":16,"keywordType":"Context","textWithKeyword":"Given basis pengetahuan berisi dokumen uji","stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":17,"keywordType":"Context","textWithKeyword":"And pengguna membuka detail dokumen uji","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"When pengguna menyunting isi pasal pertama","stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then muncul keterangan perubahan pasal berhasil disimpan","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"And isi pasal pertama tersimpan di database","stepMatchArguments":[]}]},
  {"pwTestLine":22,"pickleLine":23,"tags":["@sit","@detail-dokumen","@precondition:login-admin","@KNW-009"],"steps":[{"pwStepLine":23,"gherkinStepLine":24,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman detail dokumen","stepMatchArguments":[{"group":{"start":25,"value":"detail dokumen"},"parameterTypeName":"halaman"}]},{"pwStepLine":24,"gherkinStepLine":25,"keywordType":"Outcome","textWithKeyword":"Then detail dokumen menampilkan keadaan kosong","stepMatchArguments":[]}]},
]; // bdd-data-end
// Generated from: features\posting-kasus\posting-kasus.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Posting kasus ke bursa', () => {

  test('Formulir posting kasus menjelaskan bahwa kasus diposting anonim', { tag: ['@sit', '@posting-kasus', '@precondition:login-klien', '@BPO-001', '@mobile'] }, async ({ When, Then, page, postingKasusPage, world }) => { 
    await When('pengguna membuka halaman posting kasus', null, { page, world }); 
    await Then('formulir posting kasus menampilkan pilihan kategori dan keterangan anonim', null, { page, postingKasusPage, world }); 
  });

  test('Klien memposting kasus lengkap dengan dokumen', { tag: ['@sit', '@posting-kasus', '@precondition:login-klien', '@BPO-002', '@critical'] }, async ({ Given, When, Then, And, page, postingKasusPage, world }) => { 
    await Given('klien belum punya konsultasi', null, { page, world }); 
    await And('pengguna berada di halaman posting kasus', null, { page, world }); 
    await When('pengguna memposting kasus pidana dengan jadwal dan dokumen', null, { page, postingKasusPage, world }); 
    await Then('posting kasus dikonfirmasi berhasil', null, { page, postingKasusPage, world }); 
    await And('kasus tersimpan terbuka di bursa sesuai isian klien', null, { page, world }); 
    await When('pengguna kembali ke dashboard dari konfirmasi posting', null, { page, postingKasusPage, world }); 
    await Then('pengguna diarahkan ke halaman dashboard klien', null, { page, world }); 
  });

  test('Posting tanpa isian apa pun ditolak', { tag: ['@sit', '@posting-kasus', '@precondition:login-klien', '@BPO-003'] }, async ({ Given, When, Then, And, dialogs, network, page, postingKasusPage, world }) => { 
    await Given('pengguna berada di halaman posting kasus', null, { page, world }); 
    await When('pengguna memposting kasus tanpa mengisi apa pun', null, { page, postingKasusPage, world }); 
    await Then('muncul pemberitahuan "Mohon lengkapi semua data pengajuan (deskripsi, tanggal, dan jam)."', null, { dialogs, page, world }); 
    await And('tidak ada permintaan posting kasus yang dikirim ke backend', null, { network, page, world }); 
  });

  test('Posting tanpa jadwal ditolak', { tag: ['@sit', '@posting-kasus', '@precondition:login-klien', '@BPO-003'] }, async ({ Given, When, Then, And, dialogs, network, page, postingKasusPage, world }) => { 
    await Given('pengguna berada di halaman posting kasus', null, { page, world }); 
    await When('pengguna memposting kasus tanpa memilih jadwal', null, { page, postingKasusPage, world }); 
    await Then('muncul pemberitahuan "Mohon lengkapi semua data pengajuan (deskripsi, tanggal, dan jam)."', null, { dialogs, page, world }); 
    await And('tidak ada permintaan posting kasus yang dikirim ke backend', null, { network, page, world }); 
  });

  test('Penolakan backend saat memposting diberitahukan ke klien', { tag: ['@sit', '@posting-kasus', '@precondition:login-klien', '@BPO-004', '@stub'] }, async ({ Given, When, Then, And, dialogs, network, page, postingKasusPage, world }) => { 
    await Given('layanan posting kasus menolak dengan pesan "Hanya client yang dapat memposting kasus"', null, { network, page, world }); 
    await And('pengguna berada di halaman posting kasus', null, { page, world }); 
    await When('pengguna memposting kasus pidana dengan jadwal dan dokumen', null, { page, postingKasusPage, world }); 
    await Then('muncul pemberitahuan "Hanya client yang dapat memposting kasus"', null, { dialogs, page, world }); 
    await And('pengguna tetap berada di halaman posting kasus', null, { page, world }); 
  });

  test('Jam yang bentrok dengan konsultasi klien sendiri tidak ditawarkan', { tag: ['@sit', '@posting-kasus', '@precondition:login-klien', '@BPO-005'] }, async ({ Given, When, Then, And, page, postingKasusPage, world }) => { 
    await Given('klien sudah punya sesi konsultasi besok', null, { page, world }); 
    await And('pengguna berada di halaman posting kasus', null, { page, world }); 
    await When('pengguna melihat pilihan jam untuk besok', null, { page, postingKasusPage, world }); 
    await Then('jam yang bentrok dengan sesinya ditandai terisi', null, { page, postingKasusPage, world }); 
  });

  test('Jam yang sudah lewat hari ini tidak ditawarkan', { tag: ['@sit', '@posting-kasus', '@precondition:login-klien', '@BPO-006'] }, async ({ Given, When, Then, And, page, postingKasusPage, world }) => { 
    await Given('waktu di browser menunjukkan siang hari', null, { page, world }); 
    await And('pengguna berada di halaman posting kasus', null, { page, world }); 
    await When('pengguna melihat pilihan jam untuk hari ini', null, { page, postingKasusPage, world }); 
    await Then('hanya jam yang belum lewat yang bisa dipilih', null, { page, postingKasusPage, world }); 
  });

  test('Jumlah dokumen pendukung dibatasi', { tag: ['@sit', '@posting-kasus', '@precondition:login-klien', '@BPO-007'] }, async ({ Given, When, Then, And, dialogs, page, postingKasusPage, world }) => { 
    await Given('pengguna berada di halaman posting kasus', null, { page, world }); 
    await When('pengguna melampirkan dokumen melebihi batas jumlah', null, { page, postingKasusPage, world }); 
    await Then('muncul pemberitahuan "Maksimal 10 file"', null, { dialogs, page, world }); 
    await And('hanya dokumen sebanyak batas yang masuk daftar lampiran', null, { page, postingKasusPage, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\posting-kasus\\posting-kasus.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":6,"tags":["@sit","@posting-kasus","@precondition:login-klien","@BPO-001","@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman posting kasus","stepMatchArguments":[{"group":{"start":25,"value":"posting kasus"},"parameterTypeName":"halaman"}]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Outcome","textWithKeyword":"Then formulir posting kasus menampilkan pilihan kategori dan keterangan anonim","stepMatchArguments":[]}]},
  {"pwTestLine":11,"pickleLine":11,"tags":["@sit","@posting-kasus","@precondition:login-klien","@BPO-002","@critical"],"steps":[{"pwStepLine":12,"gherkinStepLine":12,"keywordType":"Context","textWithKeyword":"Given klien belum punya konsultasi","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman posting kasus","stepMatchArguments":[{"group":{"start":27,"value":"posting kasus"},"parameterTypeName":"halaman"}]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Action","textWithKeyword":"When pengguna memposting kasus pidana dengan jadwal dan dokumen","stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"Then posting kasus dikonfirmasi berhasil","stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":16,"keywordType":"Outcome","textWithKeyword":"And kasus tersimpan terbuka di bursa sesuai isian klien","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":17,"keywordType":"Action","textWithKeyword":"When pengguna kembali ke dashboard dari konfirmasi posting","stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":18,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman dashboard klien","stepMatchArguments":[{"group":{"start":30,"value":"dashboard klien"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":21,"pickleLine":21,"tags":["@sit","@posting-kasus","@precondition:login-klien","@BPO-003"],"steps":[{"pwStepLine":22,"gherkinStepLine":22,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman posting kasus","stepMatchArguments":[{"group":{"start":27,"value":"posting kasus"},"parameterTypeName":"halaman"}]},{"pwStepLine":23,"gherkinStepLine":23,"keywordType":"Action","textWithKeyword":"When pengguna memposting kasus tanpa mengisi apa pun","stepMatchArguments":[]},{"pwStepLine":24,"gherkinStepLine":24,"keywordType":"Outcome","textWithKeyword":"Then muncul pemberitahuan \"Mohon lengkapi semua data pengajuan (deskripsi, tanggal, dan jam).\"","stepMatchArguments":[{"group":{"start":21,"value":"\"Mohon lengkapi semua data pengajuan (deskripsi, tanggal, dan jam).\"","children":[{"start":22,"value":"Mohon lengkapi semua data pengajuan (deskripsi, tanggal, dan jam).","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":25,"gherkinStepLine":25,"keywordType":"Outcome","textWithKeyword":"And tidak ada permintaan posting kasus yang dikirim ke backend","stepMatchArguments":[{"group":{"start":21,"value":"posting kasus"},"parameterTypeName":"layanan"}]}]},
  {"pwTestLine":28,"pickleLine":28,"tags":["@sit","@posting-kasus","@precondition:login-klien","@BPO-003"],"steps":[{"pwStepLine":29,"gherkinStepLine":29,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman posting kasus","stepMatchArguments":[{"group":{"start":27,"value":"posting kasus"},"parameterTypeName":"halaman"}]},{"pwStepLine":30,"gherkinStepLine":30,"keywordType":"Action","textWithKeyword":"When pengguna memposting kasus tanpa memilih jadwal","stepMatchArguments":[]},{"pwStepLine":31,"gherkinStepLine":31,"keywordType":"Outcome","textWithKeyword":"Then muncul pemberitahuan \"Mohon lengkapi semua data pengajuan (deskripsi, tanggal, dan jam).\"","stepMatchArguments":[{"group":{"start":21,"value":"\"Mohon lengkapi semua data pengajuan (deskripsi, tanggal, dan jam).\"","children":[{"start":22,"value":"Mohon lengkapi semua data pengajuan (deskripsi, tanggal, dan jam).","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":32,"gherkinStepLine":32,"keywordType":"Outcome","textWithKeyword":"And tidak ada permintaan posting kasus yang dikirim ke backend","stepMatchArguments":[{"group":{"start":21,"value":"posting kasus"},"parameterTypeName":"layanan"}]}]},
  {"pwTestLine":35,"pickleLine":35,"tags":["@sit","@posting-kasus","@precondition:login-klien","@BPO-004","@stub"],"steps":[{"pwStepLine":36,"gherkinStepLine":36,"keywordType":"Context","textWithKeyword":"Given layanan posting kasus menolak dengan pesan \"Hanya client yang dapat memposting kasus\"","stepMatchArguments":[{"group":{"start":8,"value":"posting kasus"},"parameterTypeName":"layanan"},{"group":{"start":43,"value":"\"Hanya client yang dapat memposting kasus\"","children":[{"start":44,"value":"Hanya client yang dapat memposting kasus","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":37,"gherkinStepLine":37,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman posting kasus","stepMatchArguments":[{"group":{"start":27,"value":"posting kasus"},"parameterTypeName":"halaman"}]},{"pwStepLine":38,"gherkinStepLine":38,"keywordType":"Action","textWithKeyword":"When pengguna memposting kasus pidana dengan jadwal dan dokumen","stepMatchArguments":[]},{"pwStepLine":39,"gherkinStepLine":39,"keywordType":"Outcome","textWithKeyword":"Then muncul pemberitahuan \"Hanya client yang dapat memposting kasus\"","stepMatchArguments":[{"group":{"start":21,"value":"\"Hanya client yang dapat memposting kasus\"","children":[{"start":22,"value":"Hanya client yang dapat memposting kasus","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":40,"gherkinStepLine":40,"keywordType":"Outcome","textWithKeyword":"And pengguna tetap berada di halaman posting kasus","stepMatchArguments":[{"group":{"start":33,"value":"posting kasus"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":43,"pickleLine":43,"tags":["@sit","@posting-kasus","@precondition:login-klien","@BPO-005"],"steps":[{"pwStepLine":44,"gherkinStepLine":44,"keywordType":"Context","textWithKeyword":"Given klien sudah punya sesi konsultasi besok","stepMatchArguments":[]},{"pwStepLine":45,"gherkinStepLine":45,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman posting kasus","stepMatchArguments":[{"group":{"start":27,"value":"posting kasus"},"parameterTypeName":"halaman"}]},{"pwStepLine":46,"gherkinStepLine":46,"keywordType":"Action","textWithKeyword":"When pengguna melihat pilihan jam untuk besok","stepMatchArguments":[]},{"pwStepLine":47,"gherkinStepLine":47,"keywordType":"Outcome","textWithKeyword":"Then jam yang bentrok dengan sesinya ditandai terisi","stepMatchArguments":[]}]},
  {"pwTestLine":50,"pickleLine":50,"tags":["@sit","@posting-kasus","@precondition:login-klien","@BPO-006"],"steps":[{"pwStepLine":51,"gherkinStepLine":51,"keywordType":"Context","textWithKeyword":"Given waktu di browser menunjukkan siang hari","stepMatchArguments":[]},{"pwStepLine":52,"gherkinStepLine":52,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman posting kasus","stepMatchArguments":[{"group":{"start":27,"value":"posting kasus"},"parameterTypeName":"halaman"}]},{"pwStepLine":53,"gherkinStepLine":53,"keywordType":"Action","textWithKeyword":"When pengguna melihat pilihan jam untuk hari ini","stepMatchArguments":[]},{"pwStepLine":54,"gherkinStepLine":54,"keywordType":"Outcome","textWithKeyword":"Then hanya jam yang belum lewat yang bisa dipilih","stepMatchArguments":[]}]},
  {"pwTestLine":57,"pickleLine":57,"tags":["@sit","@posting-kasus","@precondition:login-klien","@BPO-007"],"steps":[{"pwStepLine":58,"gherkinStepLine":58,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman posting kasus","stepMatchArguments":[{"group":{"start":27,"value":"posting kasus"},"parameterTypeName":"halaman"}]},{"pwStepLine":59,"gherkinStepLine":59,"keywordType":"Action","textWithKeyword":"When pengguna melampirkan dokumen melebihi batas jumlah","stepMatchArguments":[]},{"pwStepLine":60,"gherkinStepLine":60,"keywordType":"Outcome","textWithKeyword":"Then muncul pemberitahuan \"Maksimal 10 file\"","stepMatchArguments":[{"group":{"start":21,"value":"\"Maksimal 10 file\"","children":[{"start":22,"value":"Maksimal 10 file","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":61,"gherkinStepLine":61,"keywordType":"Outcome","textWithKeyword":"And hanya dokumen sebanyak batas yang masuk daftar lampiran","stepMatchArguments":[]}]},
]; // bdd-data-end
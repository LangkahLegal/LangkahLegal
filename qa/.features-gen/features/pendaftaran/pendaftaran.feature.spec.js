// Generated from: features\pendaftaran\pendaftaran.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Pendaftaran akun', () => {

  test('Formulir pendaftaran tidak bisa dibuka tanpa memilih peran', { tag: ['@sit', '@pendaftaran', '@AUTH-017'] }, async ({ When, Then, page, world }) => { 
    await When('pengguna membuka halaman pendaftaran', null, { page, world }); 
    await Then('pengguna diarahkan ke halaman pemilihan peran', null, { page, world }); 
  });

  test('Pendaftaran klien berlanjut ke verifikasi OTP', { tag: ['@sit', '@pendaftaran', '@AUTH-018', '@critical', '@stub'] }, async ({ Given, When, Then, And, network, page, pendaftaranPage, world }) => { 
    await Given('pengguna sudah memilih mendaftar sebagai klien', null, { page, world }); 
    await And('layanan pendaftaran menerima permintaan', null, { network, page, world }); 
    await When('pengguna mendaftar dengan data yang valid', null, { page, pendaftaranPage, world }); 
    await Then('pengguna diarahkan ke halaman verifikasi OTP', null, { page, world }); 
    await And('data pendaftaran dikirim lengkap ke backend', null, { network, page, world }); 
    await And('pendaftaran tercatat menunggu verifikasi', null, { page, world }); 
  });

  test('Email yang sudah terdaftar ditolak', { tag: ['@sit', '@pendaftaran', '@AUTH-019', '@stub'] }, async ({ Given, When, Then, And, network, page, pendaftaranPage, world }) => { 
    await Given('pengguna sudah memilih mendaftar sebagai klien', null, { page, world }); 
    await And('layanan pendaftaran menolak dengan pesan "User already registered"', null, { network, page, world }); 
    await When('pengguna mendaftar dengan data yang valid', null, { page, pendaftaranPage, world }); 
    await Then('pesan galat pendaftaran adalah "User already registered"', null, { page, pendaftaranPage, world }); 
    await And('pengguna tetap berada di halaman pendaftaran', null, { page, world }); 
  });

  test('Nama beraksara non-Latin dan emoji diterima apa adanya', { tag: ['@sit', '@pendaftaran', '@AUTH-020', '@stub'] }, async ({ Given, When, Then, And, network, page, pendaftaranPage, world }) => { 
    await Given('pengguna sudah memilih mendaftar sebagai konsultan', null, { page, world }); 
    await And('layanan pendaftaran menerima permintaan', null, { network, page, world }); 
    await When('pengguna mendaftar dengan nama beraksara non-Latin dan emoji', null, { page, pendaftaranPage, world }); 
    await Then('data pendaftaran dikirim lengkap ke backend', null, { network, page, world }); 
  });

  test('Kata sandi yang terlalu pendek ditolak sebelum dikirim', { tag: ['@sit', '@pendaftaran', '@AUTH-021', '@stub'] }, async ({ Given, When, Then, And, network, page, pendaftaranPage, world }) => { 
    await Given('pengguna sudah memilih mendaftar sebagai klien', null, { page, world }); 
    await And('layanan pendaftaran menolak dengan pesan "Password should be at least 6 characters"', null, { network, page, world }); 
    await When('pengguna mendaftar dengan kata sandi yang terlalu pendek', null, { page, pendaftaranPage, world }); 
    await Then('tidak ada permintaan pendaftaran yang dikirim ke backend', null, { network, page, world }); 
  });

  test('Pendaftaran tanpa nama ditolak peramban', { tag: ['@sit', '@pendaftaran', '@AUTH-022'] }, async ({ Given, When, Then, And, network, page, pendaftaranPage, world }) => { 
    await Given('pengguna sudah memilih mendaftar sebagai klien', null, { page, world }); 
    await When('pengguna mendaftar dengan nama yang kosong', null, { page, pendaftaranPage, world }); 
    await Then('kolom nama pendaftaran ditandai belum diisi', null, { page, pendaftaranPage, world }); 
    await And('tidak ada permintaan pendaftaran yang dikirim ke backend', null, { network, page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\pendaftaran\\pendaftaran.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":9,"tags":["@sit","@pendaftaran","@AUTH-017"],"steps":[{"pwStepLine":7,"gherkinStepLine":10,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman pendaftaran","stepMatchArguments":[{"group":{"start":25,"value":"pendaftaran"},"parameterTypeName":"halaman"}]},{"pwStepLine":8,"gherkinStepLine":11,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman pemilihan peran","stepMatchArguments":[{"group":{"start":30,"value":"pemilihan peran"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":11,"pickleLine":14,"tags":["@sit","@pendaftaran","@AUTH-018","@critical","@stub"],"steps":[{"pwStepLine":12,"gherkinStepLine":15,"keywordType":"Context","textWithKeyword":"Given pengguna sudah memilih mendaftar sebagai klien","stepMatchArguments":[{"group":{"start":41,"value":"klien"},"parameterTypeName":"peranDaftar"}]},{"pwStepLine":13,"gherkinStepLine":16,"keywordType":"Context","textWithKeyword":"And layanan pendaftaran menerima permintaan","stepMatchArguments":[{"group":{"start":8,"value":"pendaftaran"},"parameterTypeName":"layanan"}]},{"pwStepLine":14,"gherkinStepLine":17,"keywordType":"Action","textWithKeyword":"When pengguna mendaftar dengan data yang valid","stepMatchArguments":[{"group":{"start":26,"value":"data yang valid"},"parameterTypeName":"pendaftaran"}]},{"pwStepLine":15,"gherkinStepLine":18,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman verifikasi OTP","stepMatchArguments":[{"group":{"start":30,"value":"verifikasi OTP"},"parameterTypeName":"halaman"}]},{"pwStepLine":16,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"And data pendaftaran dikirim lengkap ke backend","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"And pendaftaran tercatat menunggu verifikasi","stepMatchArguments":[]}]},
  {"pwTestLine":20,"pickleLine":23,"tags":["@sit","@pendaftaran","@AUTH-019","@stub"],"steps":[{"pwStepLine":21,"gherkinStepLine":24,"keywordType":"Context","textWithKeyword":"Given pengguna sudah memilih mendaftar sebagai klien","stepMatchArguments":[{"group":{"start":41,"value":"klien"},"parameterTypeName":"peranDaftar"}]},{"pwStepLine":22,"gherkinStepLine":25,"keywordType":"Context","textWithKeyword":"And layanan pendaftaran menolak dengan pesan \"User already registered\"","stepMatchArguments":[{"group":{"start":8,"value":"pendaftaran"},"parameterTypeName":"layanan"},{"group":{"start":41,"value":"\"User already registered\"","children":[{"start":42,"value":"User already registered","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":23,"gherkinStepLine":26,"keywordType":"Action","textWithKeyword":"When pengguna mendaftar dengan data yang valid","stepMatchArguments":[{"group":{"start":26,"value":"data yang valid"},"parameterTypeName":"pendaftaran"}]},{"pwStepLine":24,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"Then pesan galat pendaftaran adalah \"User already registered\"","stepMatchArguments":[{"group":{"start":31,"value":"\"User already registered\"","children":[{"start":32,"value":"User already registered","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":25,"gherkinStepLine":28,"keywordType":"Outcome","textWithKeyword":"And pengguna tetap berada di halaman pendaftaran","stepMatchArguments":[{"group":{"start":33,"value":"pendaftaran"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":28,"pickleLine":31,"tags":["@sit","@pendaftaran","@AUTH-020","@stub"],"steps":[{"pwStepLine":29,"gherkinStepLine":32,"keywordType":"Context","textWithKeyword":"Given pengguna sudah memilih mendaftar sebagai konsultan","stepMatchArguments":[{"group":{"start":41,"value":"konsultan"},"parameterTypeName":"peranDaftar"}]},{"pwStepLine":30,"gherkinStepLine":33,"keywordType":"Context","textWithKeyword":"And layanan pendaftaran menerima permintaan","stepMatchArguments":[{"group":{"start":8,"value":"pendaftaran"},"parameterTypeName":"layanan"}]},{"pwStepLine":31,"gherkinStepLine":34,"keywordType":"Action","textWithKeyword":"When pengguna mendaftar dengan nama beraksara non-Latin dan emoji","stepMatchArguments":[{"group":{"start":26,"value":"nama beraksara non-Latin dan emoji"},"parameterTypeName":"pendaftaran"}]},{"pwStepLine":32,"gherkinStepLine":35,"keywordType":"Outcome","textWithKeyword":"Then data pendaftaran dikirim lengkap ke backend","stepMatchArguments":[]}]},
  {"pwTestLine":35,"pickleLine":38,"tags":["@sit","@pendaftaran","@AUTH-021","@stub"],"steps":[{"pwStepLine":36,"gherkinStepLine":39,"keywordType":"Context","textWithKeyword":"Given pengguna sudah memilih mendaftar sebagai klien","stepMatchArguments":[{"group":{"start":41,"value":"klien"},"parameterTypeName":"peranDaftar"}]},{"pwStepLine":37,"gherkinStepLine":40,"keywordType":"Context","textWithKeyword":"And layanan pendaftaran menolak dengan pesan \"Password should be at least 6 characters\"","stepMatchArguments":[{"group":{"start":8,"value":"pendaftaran"},"parameterTypeName":"layanan"},{"group":{"start":41,"value":"\"Password should be at least 6 characters\"","children":[{"start":42,"value":"Password should be at least 6 characters","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":38,"gherkinStepLine":41,"keywordType":"Action","textWithKeyword":"When pengguna mendaftar dengan kata sandi yang terlalu pendek","stepMatchArguments":[{"group":{"start":26,"value":"kata sandi yang terlalu pendek"},"parameterTypeName":"pendaftaran"}]},{"pwStepLine":39,"gherkinStepLine":42,"keywordType":"Outcome","textWithKeyword":"Then tidak ada permintaan pendaftaran yang dikirim ke backend","stepMatchArguments":[{"group":{"start":21,"value":"pendaftaran"},"parameterTypeName":"layanan"}]}]},
  {"pwTestLine":42,"pickleLine":45,"tags":["@sit","@pendaftaran","@AUTH-022"],"steps":[{"pwStepLine":43,"gherkinStepLine":46,"keywordType":"Context","textWithKeyword":"Given pengguna sudah memilih mendaftar sebagai klien","stepMatchArguments":[{"group":{"start":41,"value":"klien"},"parameterTypeName":"peranDaftar"}]},{"pwStepLine":44,"gherkinStepLine":47,"keywordType":"Action","textWithKeyword":"When pengguna mendaftar dengan nama yang kosong","stepMatchArguments":[{"group":{"start":26,"value":"nama yang kosong"},"parameterTypeName":"pendaftaran"}]},{"pwStepLine":45,"gherkinStepLine":48,"keywordType":"Outcome","textWithKeyword":"Then kolom nama pendaftaran ditandai belum diisi","stepMatchArguments":[]},{"pwStepLine":46,"gherkinStepLine":49,"keywordType":"Outcome","textWithKeyword":"And tidak ada permintaan pendaftaran yang dikirim ke backend","stepMatchArguments":[{"group":{"start":21,"value":"pendaftaran"},"parameterTypeName":"layanan"}]}]},
]; // bdd-data-end
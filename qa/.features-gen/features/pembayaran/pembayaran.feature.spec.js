// Generated from: features\pembayaran\pembayaran.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Pembayaran konsultasi', () => {

  test('Halaman pembayaran menampilkan konsultan dan rincian biaya', { tag: ['@sit', '@pembayaran', '@precondition:login-klien', '@PAY-001', '@critical', '@mobile'] }, async ({ Given, When, Then, page, pembayaranPage, world }) => { 
    await Given('klien punya konsultasi berstatus menunggu pembayaran', null, { page, world }); 
    await When('pengguna membuka halaman pembayaran konsultasi itu', null, { page, world }); 
    await Then('halaman pembayaran menampilkan konsultan, rincian biaya, dan tombol bayar', null, { page, pembayaranPage, world }); 
  });

  test('Klien menyelesaikan pembayaran', { tag: ['@sit', '@pembayaran', '@precondition:login-klien', '@PAY-002', '@critical', '@stub'] }, async ({ Given, When, Then, And, network, page, pembayaranPage, world }) => { 
    await Given('klien punya konsultasi berstatus menunggu pembayaran', null, { page, world }); 
    await And('Midtrans akan menyelesaikan pembayaran', null, { network, page, world }); 
    await And('pengguna berada di halaman pembayaran konsultasi itu', null, { page, world }); 
    await When('pengguna membayar konsultasi', null, { page, pembayaranPage, world }); 
    await Then('pembayaran dikonfirmasi berhasil', null, { page, pembayaranPage, world }); 
    await And('transaksi tercatat di database untuk konsultasi itu', null, { page, world }); 
    await When('pengguna kembali ke dashboard dari konfirmasi pembayaran', null, { page, pembayaranPage, world }); 
    await Then('pengguna diarahkan ke halaman dashboard klien', null, { page, world }); 
  });

  test('Pembayaran yang belum diselesaikan mengembalikan klien ke dashboard', { tag: ['@sit', '@pembayaran', '@precondition:login-klien', '@PAY-003', '@stub'] }, async ({ Given, When, Then, And, dialogs, network, page, pembayaranPage, world }) => { 
    await Given('klien punya konsultasi berstatus menunggu pembayaran', null, { page, world }); 
    await And('Midtrans akan menunda pembayaran', null, { network, page, world }); 
    await And('pengguna berada di halaman pembayaran konsultasi itu', null, { page, world }); 
    await When('pengguna membayar konsultasi', null, { page, pembayaranPage, world }); 
    await Then('muncul pemberitahuan "Pembayaran tertunda"', null, { dialogs, page, world }); 
    await And('pengguna diarahkan ke halaman dashboard klien', null, { page, world }); 
  });

  test('Pembayaran yang ditolak dapat dicoba kembali', { tag: ['@sit', '@pembayaran', '@precondition:login-klien', '@PAY-004', '@stub'] }, async ({ Given, When, Then, And, dialogs, network, page, pembayaranPage, world }) => { 
    await Given('klien punya konsultasi berstatus menunggu pembayaran', null, { page, world }); 
    await And('Midtrans akan menolak pembayaran', null, { network, page, world }); 
    await And('pengguna berada di halaman pembayaran konsultasi itu', null, { page, world }); 
    await When('pengguna membayar konsultasi', null, { page, pembayaranPage, world }); 
    await Then('muncul pemberitahuan "Pembayaran gagal. Silakan coba lagi."', null, { dialogs, page, world }); 
    await And('pengguna masih dapat membayar konsultasi', null, { page, pembayaranPage, world }); 
  });

  test('Konsultasi yang belum disetujui tidak dapat dibayar', { tag: ['@sit', '@pembayaran', '@precondition:login-klien', '@PAY-005'] }, async ({ Given, When, Then, And, dialogs, page, pembayaranPage, world }) => { 
    await Given('klien punya konsultasi berstatus pending', null, { page, world }); 
    await And('pengguna berada di halaman pembayaran konsultasi itu', null, { page, world }); 
    await When('pengguna membayar konsultasi', null, { page, pembayaranPage, world }); 
    await Then('muncul pemberitahuan "Pengajuan tidak dalam status yang memerlukan pembayaran"', null, { dialogs, page, world }); 
    await And('jendela pembayaran Midtrans tidak dibuka', null, { page, world }); 
  });

  test('Konsultasi yang sudah lunas langsung menampilkan konfirmasi', { tag: ['@sit', '@pembayaran', '@precondition:login-klien', '@PAY-006'] }, async ({ Given, When, Then, And, page, pembayaranPage, world }) => { 
    await Given('klien punya konsultasi berstatus terjadwal', null, { page, world }); 
    await And('pembayaran konsultasi itu sudah lunas', null, { page, world }); 
    await When('pengguna membuka halaman pembayaran konsultasi itu', null, { page, world }); 
    await Then('pembayaran dikonfirmasi berhasil', null, { page, pembayaranPage, world }); 
  });

  test('Pelunasan terdeteksi tanpa memuat ulang halaman', { tag: ['@sit', '@pembayaran', '@precondition:login-klien', '@PAY-012'] }, async ({ Given, When, Then, And, page, pembayaranPage, world }) => { 
    await Given('klien punya konsultasi berstatus menunggu pembayaran', null, { page, world }); 
    await And('pembayaran konsultasi itu masih tertunda', null, { page, world }); 
    await And('pengguna berada di halaman pembayaran konsultasi itu', null, { page, world }); 
    await When('pembayaran itu dilunasi di luar aplikasi', null, { page, pembayaranPage, world }); 
    await Then('pembayaran dikonfirmasi berhasil', null, { page, pembayaranPage, world }); 
  });

  test('Layanan pembayaran yang tidak tersedia diberitahukan ke klien', { tag: ['@sit', '@pembayaran', '@precondition:login-klien', '@PAY-007'] }, async ({ Given, When, Then, And, dialogs, page, pembayaranPage, world }) => { 
    await Given('klien punya konsultasi berstatus menunggu pembayaran', null, { page, world }); 
    await And('layanan pembayaran Midtrans tidak dapat dimuat', null, { page, world }); 
    await And('pengguna berada di halaman pembayaran konsultasi itu', null, { page, world }); 
    await When('pengguna membayar konsultasi', null, { page, pembayaranPage, world }); 
    await Then('pengguna diberi tahu bahwa pembayaran tidak dapat diproses', null, { dialogs, page, world }); 
  });

  test('Pembayaran untuk konsultasi yang tidak ada menampilkan gagal memuat', { tag: ['@sit', '@pembayaran', '@precondition:login-klien', '@PAY-008'] }, async ({ When, Then, page, pembayaranPage, world }) => { 
    await When('pengguna membuka halaman pembayaran yang tidak ada', null, { page, world }); 
    await Then('halaman pembayaran menampilkan gagal memuat dengan pilihan coba lagi', null, { page, pembayaranPage, world }); 
  });

  test('Pembayaran yang sedang diproses tidak membuat transaksi ganda', { tag: ['@sit', '@pembayaran', '@precondition:login-klien', '@PAY-009', '@stub'] }, async ({ Given, When, Then, And, network, page, pembayaranPage, world }) => { 
    await Given('klien punya konsultasi berstatus menunggu pembayaran', null, { page, world }); 
    await And('Midtrans akan menyelesaikan pembayaran', null, { network, page, world }); 
    await And('layanan pembuatan transaksi merespons lambat', null, { network, page, world }); 
    await And('pengguna berada di halaman pembayaran konsultasi itu', null, { page, world }); 
    await When('pengguna membayar konsultasi lalu menekan tombol bayar sekali lagi', null, { page, pembayaranPage, world }); 
    await Then('pembayaran dikonfirmasi berhasil', null, { page, pembayaranPage, world }); 
    await And('hanya ada 1 permintaan pembuatan transaksi yang dikirim ke backend', null, { network, page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\pembayaran\\pembayaran.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":9,"tags":["@sit","@pembayaran","@precondition:login-klien","@PAY-001","@critical","@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":10,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus menunggu pembayaran","stepMatchArguments":[{"group":{"start":33,"value":"menunggu pembayaran"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":8,"gherkinStepLine":11,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman pembayaran konsultasi itu","stepMatchArguments":[{"group":{"start":25,"value":"pembayaran konsultasi itu"},"parameterTypeName":"halaman"}]},{"pwStepLine":9,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"Then halaman pembayaran menampilkan konsultan, rincian biaya, dan tombol bayar","stepMatchArguments":[]}]},
  {"pwTestLine":12,"pickleLine":15,"tags":["@sit","@pembayaran","@precondition:login-klien","@PAY-002","@critical","@stub"],"steps":[{"pwStepLine":13,"gherkinStepLine":16,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus menunggu pembayaran","stepMatchArguments":[{"group":{"start":33,"value":"menunggu pembayaran"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":14,"gherkinStepLine":17,"keywordType":"Context","textWithKeyword":"And Midtrans akan menyelesaikan pembayaran","stepMatchArguments":[{"group":{"start":14,"value":"menyelesaikan pembayaran"},"parameterTypeName":"hasilMidtrans"}]},{"pwStepLine":15,"gherkinStepLine":18,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman pembayaran konsultasi itu","stepMatchArguments":[{"group":{"start":27,"value":"pembayaran konsultasi itu"},"parameterTypeName":"halaman"}]},{"pwStepLine":16,"gherkinStepLine":19,"keywordType":"Action","textWithKeyword":"When pengguna membayar konsultasi","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"Then pembayaran dikonfirmasi berhasil","stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":21,"keywordType":"Outcome","textWithKeyword":"And transaksi tercatat di database untuk konsultasi itu","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":22,"keywordType":"Action","textWithKeyword":"When pengguna kembali ke dashboard dari konfirmasi pembayaran","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":23,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman dashboard klien","stepMatchArguments":[{"group":{"start":30,"value":"dashboard klien"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":23,"pickleLine":26,"tags":["@sit","@pembayaran","@precondition:login-klien","@PAY-003","@stub"],"steps":[{"pwStepLine":24,"gherkinStepLine":27,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus menunggu pembayaran","stepMatchArguments":[{"group":{"start":33,"value":"menunggu pembayaran"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":25,"gherkinStepLine":28,"keywordType":"Context","textWithKeyword":"And Midtrans akan menunda pembayaran","stepMatchArguments":[{"group":{"start":14,"value":"menunda pembayaran"},"parameterTypeName":"hasilMidtrans"}]},{"pwStepLine":26,"gherkinStepLine":29,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman pembayaran konsultasi itu","stepMatchArguments":[{"group":{"start":27,"value":"pembayaran konsultasi itu"},"parameterTypeName":"halaman"}]},{"pwStepLine":27,"gherkinStepLine":30,"keywordType":"Action","textWithKeyword":"When pengguna membayar konsultasi","stepMatchArguments":[]},{"pwStepLine":28,"gherkinStepLine":31,"keywordType":"Outcome","textWithKeyword":"Then muncul pemberitahuan \"Pembayaran tertunda\"","stepMatchArguments":[{"group":{"start":21,"value":"\"Pembayaran tertunda\"","children":[{"start":22,"value":"Pembayaran tertunda","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":29,"gherkinStepLine":32,"keywordType":"Outcome","textWithKeyword":"And pengguna diarahkan ke halaman dashboard klien","stepMatchArguments":[{"group":{"start":30,"value":"dashboard klien"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":32,"pickleLine":35,"tags":["@sit","@pembayaran","@precondition:login-klien","@PAY-004","@stub"],"steps":[{"pwStepLine":33,"gherkinStepLine":36,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus menunggu pembayaran","stepMatchArguments":[{"group":{"start":33,"value":"menunggu pembayaran"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":34,"gherkinStepLine":37,"keywordType":"Context","textWithKeyword":"And Midtrans akan menolak pembayaran","stepMatchArguments":[{"group":{"start":14,"value":"menolak pembayaran"},"parameterTypeName":"hasilMidtrans"}]},{"pwStepLine":35,"gherkinStepLine":38,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman pembayaran konsultasi itu","stepMatchArguments":[{"group":{"start":27,"value":"pembayaran konsultasi itu"},"parameterTypeName":"halaman"}]},{"pwStepLine":36,"gherkinStepLine":39,"keywordType":"Action","textWithKeyword":"When pengguna membayar konsultasi","stepMatchArguments":[]},{"pwStepLine":37,"gherkinStepLine":40,"keywordType":"Outcome","textWithKeyword":"Then muncul pemberitahuan \"Pembayaran gagal. Silakan coba lagi.\"","stepMatchArguments":[{"group":{"start":21,"value":"\"Pembayaran gagal. Silakan coba lagi.\"","children":[{"start":22,"value":"Pembayaran gagal. Silakan coba lagi.","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":38,"gherkinStepLine":41,"keywordType":"Outcome","textWithKeyword":"And pengguna masih dapat membayar konsultasi","stepMatchArguments":[]}]},
  {"pwTestLine":41,"pickleLine":44,"tags":["@sit","@pembayaran","@precondition:login-klien","@PAY-005"],"steps":[{"pwStepLine":42,"gherkinStepLine":45,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus pending","stepMatchArguments":[{"group":{"start":33,"value":"pending"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":43,"gherkinStepLine":46,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman pembayaran konsultasi itu","stepMatchArguments":[{"group":{"start":27,"value":"pembayaran konsultasi itu"},"parameterTypeName":"halaman"}]},{"pwStepLine":44,"gherkinStepLine":47,"keywordType":"Action","textWithKeyword":"When pengguna membayar konsultasi","stepMatchArguments":[]},{"pwStepLine":45,"gherkinStepLine":48,"keywordType":"Outcome","textWithKeyword":"Then muncul pemberitahuan \"Pengajuan tidak dalam status yang memerlukan pembayaran\"","stepMatchArguments":[{"group":{"start":21,"value":"\"Pengajuan tidak dalam status yang memerlukan pembayaran\"","children":[{"start":22,"value":"Pengajuan tidak dalam status yang memerlukan pembayaran","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":46,"gherkinStepLine":49,"keywordType":"Outcome","textWithKeyword":"And jendela pembayaran Midtrans tidak dibuka","stepMatchArguments":[]}]},
  {"pwTestLine":49,"pickleLine":52,"tags":["@sit","@pembayaran","@precondition:login-klien","@PAY-006"],"steps":[{"pwStepLine":50,"gherkinStepLine":53,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus terjadwal","stepMatchArguments":[{"group":{"start":33,"value":"terjadwal"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":51,"gherkinStepLine":54,"keywordType":"Context","textWithKeyword":"And pembayaran konsultasi itu sudah lunas","stepMatchArguments":[]},{"pwStepLine":52,"gherkinStepLine":55,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman pembayaran konsultasi itu","stepMatchArguments":[{"group":{"start":25,"value":"pembayaran konsultasi itu"},"parameterTypeName":"halaman"}]},{"pwStepLine":53,"gherkinStepLine":56,"keywordType":"Outcome","textWithKeyword":"Then pembayaran dikonfirmasi berhasil","stepMatchArguments":[]}]},
  {"pwTestLine":56,"pickleLine":59,"tags":["@sit","@pembayaran","@precondition:login-klien","@PAY-012"],"steps":[{"pwStepLine":57,"gherkinStepLine":60,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus menunggu pembayaran","stepMatchArguments":[{"group":{"start":33,"value":"menunggu pembayaran"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":58,"gherkinStepLine":61,"keywordType":"Context","textWithKeyword":"And pembayaran konsultasi itu masih tertunda","stepMatchArguments":[]},{"pwStepLine":59,"gherkinStepLine":62,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman pembayaran konsultasi itu","stepMatchArguments":[{"group":{"start":27,"value":"pembayaran konsultasi itu"},"parameterTypeName":"halaman"}]},{"pwStepLine":60,"gherkinStepLine":63,"keywordType":"Action","textWithKeyword":"When pembayaran itu dilunasi di luar aplikasi","stepMatchArguments":[]},{"pwStepLine":61,"gherkinStepLine":64,"keywordType":"Outcome","textWithKeyword":"Then pembayaran dikonfirmasi berhasil","stepMatchArguments":[]}]},
  {"pwTestLine":64,"pickleLine":67,"tags":["@sit","@pembayaran","@precondition:login-klien","@PAY-007"],"steps":[{"pwStepLine":65,"gherkinStepLine":68,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus menunggu pembayaran","stepMatchArguments":[{"group":{"start":33,"value":"menunggu pembayaran"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":66,"gherkinStepLine":69,"keywordType":"Context","textWithKeyword":"And layanan pembayaran Midtrans tidak dapat dimuat","stepMatchArguments":[]},{"pwStepLine":67,"gherkinStepLine":70,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman pembayaran konsultasi itu","stepMatchArguments":[{"group":{"start":27,"value":"pembayaran konsultasi itu"},"parameterTypeName":"halaman"}]},{"pwStepLine":68,"gherkinStepLine":71,"keywordType":"Action","textWithKeyword":"When pengguna membayar konsultasi","stepMatchArguments":[]},{"pwStepLine":69,"gherkinStepLine":72,"keywordType":"Outcome","textWithKeyword":"Then pengguna diberi tahu bahwa pembayaran tidak dapat diproses","stepMatchArguments":[]}]},
  {"pwTestLine":72,"pickleLine":75,"tags":["@sit","@pembayaran","@precondition:login-klien","@PAY-008"],"steps":[{"pwStepLine":73,"gherkinStepLine":76,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman pembayaran yang tidak ada","stepMatchArguments":[{"group":{"start":25,"value":"pembayaran yang tidak ada"},"parameterTypeName":"halaman"}]},{"pwStepLine":74,"gherkinStepLine":77,"keywordType":"Outcome","textWithKeyword":"Then halaman pembayaran menampilkan gagal memuat dengan pilihan coba lagi","stepMatchArguments":[]}]},
  {"pwTestLine":77,"pickleLine":80,"tags":["@sit","@pembayaran","@precondition:login-klien","@PAY-009","@stub"],"steps":[{"pwStepLine":78,"gherkinStepLine":81,"keywordType":"Context","textWithKeyword":"Given klien punya konsultasi berstatus menunggu pembayaran","stepMatchArguments":[{"group":{"start":33,"value":"menunggu pembayaran"},"parameterTypeName":"statusKonsultasi"}]},{"pwStepLine":79,"gherkinStepLine":82,"keywordType":"Context","textWithKeyword":"And Midtrans akan menyelesaikan pembayaran","stepMatchArguments":[{"group":{"start":14,"value":"menyelesaikan pembayaran"},"parameterTypeName":"hasilMidtrans"}]},{"pwStepLine":80,"gherkinStepLine":83,"keywordType":"Context","textWithKeyword":"And layanan pembuatan transaksi merespons lambat","stepMatchArguments":[{"group":{"start":8,"value":"pembuatan transaksi"},"parameterTypeName":"layanan"}]},{"pwStepLine":81,"gherkinStepLine":84,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman pembayaran konsultasi itu","stepMatchArguments":[{"group":{"start":27,"value":"pembayaran konsultasi itu"},"parameterTypeName":"halaman"}]},{"pwStepLine":82,"gherkinStepLine":85,"keywordType":"Action","textWithKeyword":"When pengguna membayar konsultasi lalu menekan tombol bayar sekali lagi","stepMatchArguments":[]},{"pwStepLine":83,"gherkinStepLine":86,"keywordType":"Outcome","textWithKeyword":"Then pembayaran dikonfirmasi berhasil","stepMatchArguments":[]},{"pwStepLine":84,"gherkinStepLine":87,"keywordType":"Outcome","textWithKeyword":"And hanya ada 1 permintaan pembuatan transaksi yang dikirim ke backend","stepMatchArguments":[{"group":{"start":10,"value":"1"},"parameterTypeName":"int"},{"group":{"start":23,"value":"pembuatan transaksi"},"parameterTypeName":"layanan"}]}]},
]; // bdd-data-end
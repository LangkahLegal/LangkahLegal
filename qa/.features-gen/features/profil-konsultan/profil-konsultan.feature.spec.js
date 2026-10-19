// Generated from: features\profil-konsultan\profil-konsultan.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Profil konsultan dan pemesanan konsultasi', () => {

  test('Profil konsultan menampilkan informasi utamanya', { tag: ['@sit', '@profil-konsultan', '@precondition:login-klien', '@BOK-001', '@mobile'] }, async ({ Given, When, Then, page, profilKonsultanPage, world }) => { 
    await Given('konsultan uji membuka jadwal praktik', null, { page, world }); 
    await When('pengguna membuka halaman profil konsultan uji', null, { page, world }); 
    await Then('profil menampilkan nama, status verifikasi, tarif, dan deskripsi konsultan uji', null, { page, profilKonsultanPage, world }); 
  });

  test('Klien memesan konsultasi dengan dokumen pendukung', { tag: ['@sit', '@profil-konsultan', '@precondition:login-klien', '@BOK-002', '@critical'] }, async ({ Given, When, Then, And, page, profilKonsultanPage, world }) => { 
    await Given('konsultan uji membuka jadwal praktik', null, { page, world }); 
    await And('pengguna berada di halaman profil konsultan uji', null, { page, world }); 
    await When('pengguna memesan konsultasi dengan dokumen pendukung', null, { page, profilKonsultanPage, world }); 
    await Then('pemesanan dikonfirmasi berhasil', null, { page, profilKonsultanPage, world }); 
    await And('pengajuan tersimpan menunggu persetujuan konsultan beserta dokumennya', null, { page, world }); 
    await When('pengguna kembali ke dashboard dari konfirmasi pemesanan', null, { page, profilKonsultanPage, world }); 
    await Then('pengguna diarahkan ke halaman dashboard klien', null, { page, world }); 
  });

  test('Pemesanan tanpa jadwal dan deskripsi ditolak', { tag: ['@sit', '@profil-konsultan', '@precondition:login-klien', '@BOK-003'] }, async ({ Given, When, Then, And, dialogs, network, page, profilKonsultanPage, world }) => { 
    await Given('konsultan uji membuka jadwal praktik', null, { page, world }); 
    await And('pengguna berada di halaman profil konsultan uji', null, { page, world }); 
    await When('pengguna memesan konsultasi tanpa mengisi apa pun', null, { page, profilKonsultanPage, world }); 
    await Then('muncul pemberitahuan "Mohon lengkapi semua data pengajuan."', null, { dialogs, page, world }); 
    await And('tidak ada permintaan pemesanan konsultasi yang dikirim ke backend', null, { network, page, world }); 
  });

  test('Pemesanan dengan deskripsi kosong ditolak', { tag: ['@sit', '@profil-konsultan', '@precondition:login-klien', '@BOK-003'] }, async ({ Given, When, Then, And, dialogs, network, page, profilKonsultanPage, world }) => { 
    await Given('konsultan uji membuka jadwal praktik', null, { page, world }); 
    await And('pengguna berada di halaman profil konsultan uji', null, { page, world }); 
    await When('pengguna memesan konsultasi dengan deskripsi yang hanya berisi spasi', null, { page, profilKonsultanPage, world }); 
    await Then('muncul pemberitahuan "Mohon lengkapi semua data pengajuan."', null, { dialogs, page, world }); 
    await And('tidak ada permintaan pemesanan konsultasi yang dikirim ke backend', null, { network, page, world }); 
  });

  test('Jam yang sudah dipesan tidak bisa dipilih', { tag: ['@sit', '@profil-konsultan', '@precondition:login-klien', '@BOK-004'] }, async ({ Given, When, Then, And, page, profilKonsultanPage, world }) => { 
    await Given('konsultan uji sudah punya sesi terjadwal pada jadwal praktiknya', null, { page, world }); 
    await And('pengguna berada di halaman profil konsultan uji', null, { page, world }); 
    await When('pengguna melihat pilihan jam mulai', null, { page, profilKonsultanPage, world }); 
    await Then('jam yang sudah dipesan ditandai terisi dan tidak bisa dipilih', null, { page, profilKonsultanPage, world }); 
  });

  test('Jam di luar jam praktik tidak bisa dipilih', { tag: ['@sit', '@profil-konsultan', '@precondition:login-klien', '@BOK-005'] }, async ({ Given, When, Then, And, page, profilKonsultanPage, world }) => { 
    await Given('konsultan uji membuka jadwal praktik', null, { page, world }); 
    await And('pengguna berada di halaman profil konsultan uji', null, { page, world }); 
    await When('pengguna melihat pilihan jam mulai', null, { page, profilKonsultanPage, world }); 
    await Then('hanya jam di dalam jam praktik yang bisa dipilih', null, { page, profilKonsultanPage, world }); 
  });

  test('Konsultan tanpa jadwal tidak menawarkan tanggal', { tag: ['@sit', '@profil-konsultan', '@precondition:login-klien', '@BOK-006'] }, async ({ Given, When, Then, page, profilKonsultanPage, world }) => { 
    await Given('konsultan uji belum membuka jadwal praktik', null, { page, world }); 
    await When('pengguna membuka halaman profil konsultan uji', null, { page, world }); 
    await Then('tidak ada tanggal konsultasi yang bisa dipilih', null, { page, profilKonsultanPage, world }); 
  });

  test('Dokumen yang terlalu besar ditolak', { tag: ['@sit', '@profil-konsultan', '@precondition:login-klien', '@BOK-007'] }, async ({ Given, When, Then, And, dialogs, page, profilKonsultanPage, world }) => { 
    await Given('konsultan uji membuka jadwal praktik', null, { page, world }); 
    await And('pengguna berada di halaman profil konsultan uji', null, { page, world }); 
    await When('pengguna melampirkan dokumen yang terlalu besar', null, { page, profilKonsultanPage, world }); 
    await Then('muncul pemberitahuan "File terlalu besar! Maksimal 10MB"', null, { dialogs, page, world }); 
    await And('dokumen itu tidak masuk daftar lampiran', null, { page, profilKonsultanPage, world }); 
  });

  test('Dokumen yang sudah dilampirkan dapat dihapus', { tag: ['@sit', '@profil-konsultan', '@precondition:login-klien', '@BOK-007'] }, async ({ Given, When, Then, And, page, profilKonsultanPage, world }) => { 
    await Given('konsultan uji membuka jadwal praktik', null, { page, world }); 
    await And('pengguna berada di halaman profil konsultan uji', null, { page, world }); 
    await When('pengguna melampirkan lalu menghapus sebuah dokumen', null, { page, profilKonsultanPage, world }); 
    await Then('daftar lampiran kembali kosong', null, { page, profilKonsultanPage, world }); 
  });

  test('Berkas program tidak boleh dilampirkan', { tag: ['@sit', '@profil-konsultan', '@precondition:login-klien', '@BOK-008'] }, async ({ Given, When, Then, And, page, profilKonsultanPage, world }) => { 
    await Given('konsultan uji membuka jadwal praktik', null, { page, world }); 
    await And('pengguna berada di halaman profil konsultan uji', null, { page, world }); 
    await When('pengguna melampirkan berkas program', null, { page, profilKonsultanPage, world }); 
    await Then('dokumen itu tidak masuk daftar lampiran', null, { page, profilKonsultanPage, world }); 
  });

  test('Penolakan backend saat memesan diberitahukan ke klien', { tag: ['@sit', '@profil-konsultan', '@precondition:login-klien', '@BOK-009', '@stub'] }, async ({ Given, When, Then, And, dialogs, network, page, profilKonsultanPage, world }) => { 
    await Given('konsultan uji membuka jadwal praktik', null, { page, world }); 
    await And('layanan pemesanan konsultasi menolak dengan pesan "Jadwal sudah terisi"', null, { network, page, world }); 
    await And('pengguna berada di halaman profil konsultan uji', null, { page, world }); 
    await When('pengguna memesan konsultasi tanpa dokumen', null, { page, profilKonsultanPage, world }); 
    await Then('muncul pemberitahuan "Jadwal sudah terisi"', null, { dialogs, page, world }); 
    await And('pemesanan tidak dikonfirmasi berhasil', null, { page, profilKonsultanPage, world }); 
  });

  test('Pemesanan yang sedang diproses tidak bisa dikirim dua kali', { tag: ['@sit', '@profil-konsultan', '@precondition:login-klien', '@BOK-010'] }, async ({ Given, When, Then, And, network, page, profilKonsultanPage, world }) => { 
    await Given('konsultan uji membuka jadwal praktik', null, { page, world }); 
    await And('layanan pemesanan konsultasi merespons lambat', null, { network, page, world }); 
    await And('pengguna berada di halaman profil konsultan uji', null, { page, world }); 
    await When('pengguna memesan konsultasi lalu menekan tombol pesan sekali lagi', null, { page, profilKonsultanPage, world }); 
    await Then('pemesanan dikonfirmasi berhasil', null, { page, profilKonsultanPage, world }); 
    await And('hanya ada 1 permintaan pemesanan konsultasi yang dikirim ke backend', null, { network, page, world }); 
  });

  test('Profil konsultan yang tidak ada diberitahukan ke klien', { tag: ['@sit', '@profil-konsultan', '@precondition:login-klien', '@BOK-011'] }, async ({ When, Then, page, profilKonsultanPage, world }) => { 
    await When('pengguna membuka halaman profil konsultan yang tidak ada', null, { page, world }); 
    await Then('profil menampilkan pesan konsultan tidak ditemukan', null, { page, profilKonsultanPage, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\profil-konsultan\\profil-konsultan.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":6,"tags":["@sit","@profil-konsultan","@precondition:login-klien","@BOK-001","@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given konsultan uji membuka jadwal praktik","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman profil konsultan uji","stepMatchArguments":[{"group":{"start":25,"value":"profil konsultan uji"},"parameterTypeName":"halaman"}]},{"pwStepLine":9,"gherkinStepLine":9,"keywordType":"Outcome","textWithKeyword":"Then profil menampilkan nama, status verifikasi, tarif, dan deskripsi konsultan uji","stepMatchArguments":[]}]},
  {"pwTestLine":12,"pickleLine":12,"tags":["@sit","@profil-konsultan","@precondition:login-klien","@BOK-002","@critical"],"steps":[{"pwStepLine":13,"gherkinStepLine":13,"keywordType":"Context","textWithKeyword":"Given konsultan uji membuka jadwal praktik","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":14,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman profil konsultan uji","stepMatchArguments":[{"group":{"start":27,"value":"profil konsultan uji"},"parameterTypeName":"halaman"}]},{"pwStepLine":15,"gherkinStepLine":15,"keywordType":"Action","textWithKeyword":"When pengguna memesan konsultasi dengan dokumen pendukung","stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":16,"keywordType":"Outcome","textWithKeyword":"Then pemesanan dikonfirmasi berhasil","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"And pengajuan tersimpan menunggu persetujuan konsultan beserta dokumennya","stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"When pengguna kembali ke dashboard dari konfirmasi pemesanan","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then pengguna diarahkan ke halaman dashboard klien","stepMatchArguments":[{"group":{"start":30,"value":"dashboard klien"},"parameterTypeName":"halaman"}]}]},
  {"pwTestLine":22,"pickleLine":22,"tags":["@sit","@profil-konsultan","@precondition:login-klien","@BOK-003"],"steps":[{"pwStepLine":23,"gherkinStepLine":23,"keywordType":"Context","textWithKeyword":"Given konsultan uji membuka jadwal praktik","stepMatchArguments":[]},{"pwStepLine":24,"gherkinStepLine":24,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman profil konsultan uji","stepMatchArguments":[{"group":{"start":27,"value":"profil konsultan uji"},"parameterTypeName":"halaman"}]},{"pwStepLine":25,"gherkinStepLine":25,"keywordType":"Action","textWithKeyword":"When pengguna memesan konsultasi tanpa mengisi apa pun","stepMatchArguments":[]},{"pwStepLine":26,"gherkinStepLine":26,"keywordType":"Outcome","textWithKeyword":"Then muncul pemberitahuan \"Mohon lengkapi semua data pengajuan.\"","stepMatchArguments":[{"group":{"start":21,"value":"\"Mohon lengkapi semua data pengajuan.\"","children":[{"start":22,"value":"Mohon lengkapi semua data pengajuan.","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":27,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"And tidak ada permintaan pemesanan konsultasi yang dikirim ke backend","stepMatchArguments":[{"group":{"start":21,"value":"pemesanan konsultasi"},"parameterTypeName":"layanan"}]}]},
  {"pwTestLine":30,"pickleLine":30,"tags":["@sit","@profil-konsultan","@precondition:login-klien","@BOK-003"],"steps":[{"pwStepLine":31,"gherkinStepLine":31,"keywordType":"Context","textWithKeyword":"Given konsultan uji membuka jadwal praktik","stepMatchArguments":[]},{"pwStepLine":32,"gherkinStepLine":32,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman profil konsultan uji","stepMatchArguments":[{"group":{"start":27,"value":"profil konsultan uji"},"parameterTypeName":"halaman"}]},{"pwStepLine":33,"gherkinStepLine":33,"keywordType":"Action","textWithKeyword":"When pengguna memesan konsultasi dengan deskripsi yang hanya berisi spasi","stepMatchArguments":[]},{"pwStepLine":34,"gherkinStepLine":34,"keywordType":"Outcome","textWithKeyword":"Then muncul pemberitahuan \"Mohon lengkapi semua data pengajuan.\"","stepMatchArguments":[{"group":{"start":21,"value":"\"Mohon lengkapi semua data pengajuan.\"","children":[{"start":22,"value":"Mohon lengkapi semua data pengajuan.","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":35,"gherkinStepLine":35,"keywordType":"Outcome","textWithKeyword":"And tidak ada permintaan pemesanan konsultasi yang dikirim ke backend","stepMatchArguments":[{"group":{"start":21,"value":"pemesanan konsultasi"},"parameterTypeName":"layanan"}]}]},
  {"pwTestLine":38,"pickleLine":38,"tags":["@sit","@profil-konsultan","@precondition:login-klien","@BOK-004"],"steps":[{"pwStepLine":39,"gherkinStepLine":39,"keywordType":"Context","textWithKeyword":"Given konsultan uji sudah punya sesi terjadwal pada jadwal praktiknya","stepMatchArguments":[]},{"pwStepLine":40,"gherkinStepLine":40,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman profil konsultan uji","stepMatchArguments":[{"group":{"start":27,"value":"profil konsultan uji"},"parameterTypeName":"halaman"}]},{"pwStepLine":41,"gherkinStepLine":41,"keywordType":"Action","textWithKeyword":"When pengguna melihat pilihan jam mulai","stepMatchArguments":[]},{"pwStepLine":42,"gherkinStepLine":42,"keywordType":"Outcome","textWithKeyword":"Then jam yang sudah dipesan ditandai terisi dan tidak bisa dipilih","stepMatchArguments":[]}]},
  {"pwTestLine":45,"pickleLine":45,"tags":["@sit","@profil-konsultan","@precondition:login-klien","@BOK-005"],"steps":[{"pwStepLine":46,"gherkinStepLine":46,"keywordType":"Context","textWithKeyword":"Given konsultan uji membuka jadwal praktik","stepMatchArguments":[]},{"pwStepLine":47,"gherkinStepLine":47,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman profil konsultan uji","stepMatchArguments":[{"group":{"start":27,"value":"profil konsultan uji"},"parameterTypeName":"halaman"}]},{"pwStepLine":48,"gherkinStepLine":48,"keywordType":"Action","textWithKeyword":"When pengguna melihat pilihan jam mulai","stepMatchArguments":[]},{"pwStepLine":49,"gherkinStepLine":49,"keywordType":"Outcome","textWithKeyword":"Then hanya jam di dalam jam praktik yang bisa dipilih","stepMatchArguments":[]}]},
  {"pwTestLine":52,"pickleLine":52,"tags":["@sit","@profil-konsultan","@precondition:login-klien","@BOK-006"],"steps":[{"pwStepLine":53,"gherkinStepLine":53,"keywordType":"Context","textWithKeyword":"Given konsultan uji belum membuka jadwal praktik","stepMatchArguments":[]},{"pwStepLine":54,"gherkinStepLine":54,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman profil konsultan uji","stepMatchArguments":[{"group":{"start":25,"value":"profil konsultan uji"},"parameterTypeName":"halaman"}]},{"pwStepLine":55,"gherkinStepLine":55,"keywordType":"Outcome","textWithKeyword":"Then tidak ada tanggal konsultasi yang bisa dipilih","stepMatchArguments":[]}]},
  {"pwTestLine":58,"pickleLine":58,"tags":["@sit","@profil-konsultan","@precondition:login-klien","@BOK-007"],"steps":[{"pwStepLine":59,"gherkinStepLine":59,"keywordType":"Context","textWithKeyword":"Given konsultan uji membuka jadwal praktik","stepMatchArguments":[]},{"pwStepLine":60,"gherkinStepLine":60,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman profil konsultan uji","stepMatchArguments":[{"group":{"start":27,"value":"profil konsultan uji"},"parameterTypeName":"halaman"}]},{"pwStepLine":61,"gherkinStepLine":61,"keywordType":"Action","textWithKeyword":"When pengguna melampirkan dokumen yang terlalu besar","stepMatchArguments":[]},{"pwStepLine":62,"gherkinStepLine":62,"keywordType":"Outcome","textWithKeyword":"Then muncul pemberitahuan \"File terlalu besar! Maksimal 10MB\"","stepMatchArguments":[{"group":{"start":21,"value":"\"File terlalu besar! Maksimal 10MB\"","children":[{"start":22,"value":"File terlalu besar! Maksimal 10MB","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":63,"gherkinStepLine":63,"keywordType":"Outcome","textWithKeyword":"And dokumen itu tidak masuk daftar lampiran","stepMatchArguments":[]}]},
  {"pwTestLine":66,"pickleLine":66,"tags":["@sit","@profil-konsultan","@precondition:login-klien","@BOK-007"],"steps":[{"pwStepLine":67,"gherkinStepLine":67,"keywordType":"Context","textWithKeyword":"Given konsultan uji membuka jadwal praktik","stepMatchArguments":[]},{"pwStepLine":68,"gherkinStepLine":68,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman profil konsultan uji","stepMatchArguments":[{"group":{"start":27,"value":"profil konsultan uji"},"parameterTypeName":"halaman"}]},{"pwStepLine":69,"gherkinStepLine":69,"keywordType":"Action","textWithKeyword":"When pengguna melampirkan lalu menghapus sebuah dokumen","stepMatchArguments":[]},{"pwStepLine":70,"gherkinStepLine":70,"keywordType":"Outcome","textWithKeyword":"Then daftar lampiran kembali kosong","stepMatchArguments":[]}]},
  {"pwTestLine":73,"pickleLine":73,"tags":["@sit","@profil-konsultan","@precondition:login-klien","@BOK-008"],"steps":[{"pwStepLine":74,"gherkinStepLine":74,"keywordType":"Context","textWithKeyword":"Given konsultan uji membuka jadwal praktik","stepMatchArguments":[]},{"pwStepLine":75,"gherkinStepLine":75,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman profil konsultan uji","stepMatchArguments":[{"group":{"start":27,"value":"profil konsultan uji"},"parameterTypeName":"halaman"}]},{"pwStepLine":76,"gherkinStepLine":76,"keywordType":"Action","textWithKeyword":"When pengguna melampirkan berkas program","stepMatchArguments":[]},{"pwStepLine":77,"gherkinStepLine":77,"keywordType":"Outcome","textWithKeyword":"Then dokumen itu tidak masuk daftar lampiran","stepMatchArguments":[]}]},
  {"pwTestLine":80,"pickleLine":80,"tags":["@sit","@profil-konsultan","@precondition:login-klien","@BOK-009","@stub"],"steps":[{"pwStepLine":81,"gherkinStepLine":81,"keywordType":"Context","textWithKeyword":"Given konsultan uji membuka jadwal praktik","stepMatchArguments":[]},{"pwStepLine":82,"gherkinStepLine":82,"keywordType":"Context","textWithKeyword":"And layanan pemesanan konsultasi menolak dengan pesan \"Jadwal sudah terisi\"","stepMatchArguments":[{"group":{"start":8,"value":"pemesanan konsultasi"},"parameterTypeName":"layanan"},{"group":{"start":50,"value":"\"Jadwal sudah terisi\"","children":[{"start":51,"value":"Jadwal sudah terisi","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":83,"gherkinStepLine":83,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman profil konsultan uji","stepMatchArguments":[{"group":{"start":27,"value":"profil konsultan uji"},"parameterTypeName":"halaman"}]},{"pwStepLine":84,"gherkinStepLine":84,"keywordType":"Action","textWithKeyword":"When pengguna memesan konsultasi tanpa dokumen","stepMatchArguments":[]},{"pwStepLine":85,"gherkinStepLine":85,"keywordType":"Outcome","textWithKeyword":"Then muncul pemberitahuan \"Jadwal sudah terisi\"","stepMatchArguments":[{"group":{"start":21,"value":"\"Jadwal sudah terisi\"","children":[{"start":22,"value":"Jadwal sudah terisi","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":86,"gherkinStepLine":86,"keywordType":"Outcome","textWithKeyword":"And pemesanan tidak dikonfirmasi berhasil","stepMatchArguments":[]}]},
  {"pwTestLine":89,"pickleLine":89,"tags":["@sit","@profil-konsultan","@precondition:login-klien","@BOK-010"],"steps":[{"pwStepLine":90,"gherkinStepLine":90,"keywordType":"Context","textWithKeyword":"Given konsultan uji membuka jadwal praktik","stepMatchArguments":[]},{"pwStepLine":91,"gherkinStepLine":91,"keywordType":"Context","textWithKeyword":"And layanan pemesanan konsultasi merespons lambat","stepMatchArguments":[{"group":{"start":8,"value":"pemesanan konsultasi"},"parameterTypeName":"layanan"}]},{"pwStepLine":92,"gherkinStepLine":92,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman profil konsultan uji","stepMatchArguments":[{"group":{"start":27,"value":"profil konsultan uji"},"parameterTypeName":"halaman"}]},{"pwStepLine":93,"gherkinStepLine":93,"keywordType":"Action","textWithKeyword":"When pengguna memesan konsultasi lalu menekan tombol pesan sekali lagi","stepMatchArguments":[]},{"pwStepLine":94,"gherkinStepLine":94,"keywordType":"Outcome","textWithKeyword":"Then pemesanan dikonfirmasi berhasil","stepMatchArguments":[]},{"pwStepLine":95,"gherkinStepLine":95,"keywordType":"Outcome","textWithKeyword":"And hanya ada 1 permintaan pemesanan konsultasi yang dikirim ke backend","stepMatchArguments":[{"group":{"start":10,"value":"1"},"parameterTypeName":"int"},{"group":{"start":23,"value":"pemesanan konsultasi"},"parameterTypeName":"layanan"}]}]},
  {"pwTestLine":98,"pickleLine":98,"tags":["@sit","@profil-konsultan","@precondition:login-klien","@BOK-011"],"steps":[{"pwStepLine":99,"gherkinStepLine":99,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman profil konsultan yang tidak ada","stepMatchArguments":[{"group":{"start":25,"value":"profil konsultan yang tidak ada"},"parameterTypeName":"halaman"}]},{"pwStepLine":100,"gherkinStepLine":100,"keywordType":"Outcome","textWithKeyword":"Then profil menampilkan pesan konsultan tidak ditemukan","stepMatchArguments":[]}]},
]; // bdd-data-end
// Generated from: features\tanya-ai\tanya-ai.feature
import { test } from "../../../hooks/fixtures.js";

test.describe('Tanya AI', () => {

  test('Halaman Tanya AI menyambut klien', { tag: ['@sit', '@tanya-ai', '@precondition:login-klien', '@AI-001', '@mobile'] }, async ({ When, Then, page, tanyaAiPage, world }) => { 
    await When('pengguna membuka halaman tanya AI', null, { page, world }); 
    await Then('Tanya AI menampilkan sambutan dan menunggu pertanyaan', null, { page, tanyaAiPage, world }); 
  });

  test('Klien bertanya dan mendapat jawaban dari AI', { tag: ['@sit', '@tanya-ai', '@precondition:login-klien', '@AI-002', '@critical', '@layanan-eksternal'] }, async ({ Given, When, Then, And, network, page, tanyaAiPage, world }) => { 
    await Given('klien belum punya percakapan dengan AI', null, { page, world }); 
    await And('pengguna berada di halaman tanya AI', null, { page, world }); 
    await When('pengguna mengirim pertanyaan hukum ke AI', null, { page, tanyaAiPage, world }); 
    await Then('pertanyaan itu tampil di percakapan selagi AI menyiapkan jawaban', null, { page, tanyaAiPage, world }); 
    await And('AI membalas pertanyaan itu', null, { network, page, tanyaAiPage, world }); 
    await And('percakapan tersimpan sebagai sesi klien uji', null, { page, world }); 
  });

  test('Pertanyaan lanjutan tetap berada di sesi yang sama', { tag: ['@sit', '@tanya-ai', '@precondition:login-klien', '@AI-003', '@stub'] }, async ({ Given, When, Then, And, network, page, tanyaAiPage, world }) => { 
    await Given('AI akan membalas dengan jawaban biasa', null, { network, page, world }); 
    await And('pengguna berada di halaman tanya AI', null, { page, world }); 
    await When('pengguna mengirim dua pertanyaan berturut-turut', null, { page, tanyaAiPage, world }); 
    await Then('pertanyaan kedua dikirim dalam sesi yang sama', null, { network, page, world }); 
  });

  test('Baris baru tidak mengirim pertanyaan', { tag: ['@sit', '@tanya-ai', '@precondition:login-klien', '@AI-004'] }, async ({ Given, When, Then, network, page, tanyaAiPage, world }) => { 
    await Given('pengguna berada di halaman tanya AI', null, { page, world }); 
    await When('pengguna menulis pertanyaan dua baris', null, { page, tanyaAiPage, world }); 
    await Then('pertanyaan itu belum dikirim ke AI', null, { network, page, tanyaAiPage, world }); 
  });

  test('Pertanyaan kosong tidak dapat dikirim', { tag: ['@sit', '@tanya-ai', '@precondition:login-klien', '@AI-004'] }, async ({ Given, When, Then, network, page, tanyaAiPage, world }) => { 
    await Given('pengguna berada di halaman tanya AI', null, { page, world }); 
    await When('pengguna mengirim pertanyaan yang hanya berisi spasi', null, { page, tanyaAiPage, world }); 
    await Then('tidak ada permintaan tanya AI yang dikirim ke backend', null, { network, page, world }); 
  });

  test('AI yang kebanjiran permintaan diberitahukan dengan ramah', { tag: ['@sit', '@tanya-ai', '@precondition:login-klien', '@AI-005'] }, async ({ Given, When, Then, And, network, page, tanyaAiPage, world }) => { 
    await Given('layanan AI sedang kebanjiran permintaan', null, { network, page, world }); 
    await And('pengguna berada di halaman tanya AI', null, { page, world }); 
    await When('pengguna mengirim pertanyaan hukum ke AI', null, { page, tanyaAiPage, world }); 
    await Then('AI menampilkan pesan gangguan yang sesuai dan klien dapat bertanya lagi', null, { page, tanyaAiPage, world }); 
  });

  test('Galat internal layanan AI diberitahukan dengan ramah', { tag: ['@sit', '@tanya-ai', '@precondition:login-klien', '@AI-006'] }, async ({ Given, When, Then, And, network, page, tanyaAiPage, world }) => { 
    await Given('layanan AI sedang mengalami galat internal', null, { network, page, world }); 
    await And('pengguna berada di halaman tanya AI', null, { page, world }); 
    await When('pengguna mengirim pertanyaan hukum ke AI', null, { page, tanyaAiPage, world }); 
    await Then('AI menampilkan pesan gangguan yang sesuai dan klien dapat bertanya lagi', null, { page, tanyaAiPage, world }); 
  });

  test('Koneksi terputus ke layanan AI diberitahukan dengan ramah', { tag: ['@sit', '@tanya-ai', '@precondition:login-klien', '@AI-007'] }, async ({ Given, When, Then, And, network, page, tanyaAiPage, world }) => { 
    await Given('layanan AI sedang tidak dapat dihubungi', null, { network, page, world }); 
    await And('pengguna berada di halaman tanya AI', null, { page, world }); 
    await When('pengguna mengirim pertanyaan hukum ke AI', null, { page, tanyaAiPage, world }); 
    await Then('AI menampilkan pesan gangguan yang sesuai dan klien dapat bertanya lagi', null, { page, tanyaAiPage, world }); 
  });

  test('Rekomendasi konsultan dari AI dapat langsung dijadwalkan', { tag: ['@sit', '@tanya-ai', '@precondition:login-klien', '@AI-008', '@stub'] }, async ({ Given, When, Then, And, context, network, page, tanyaAiPage, world }) => { 
    await Given('AI akan membalas dengan rekomendasi konsultan', null, { network, page, world }); 
    await And('pengguna berada di halaman tanya AI', null, { page, world }); 
    await When('pengguna mengirim pertanyaan hukum ke AI', null, { page, tanyaAiPage, world }); 
    await Then('AI menampilkan konsultan uji sebagai rekomendasi', null, { page, world }); 
    await When('pengguna memilih menjadwalkan konsultan yang direkomendasikan', null, { context, page, tanyaAiPage, world }); 
    await Then('profil konsultan uji terbuka di tab baru', null, { page, world }); 
  });

  test('Ringkasan kasus dari AI terisi otomatis di form pengajuan konsultan', { tag: ['@sit', '@tanya-ai', '@precondition:login-klien', '@AI-014', '@stub'] }, async ({ Given, When, Then, And, context, network, page, tanyaAiPage, world }) => { 
    await Given('AI akan membalas dengan draft pengajuan konsultasi', null, { network, page, world }); 
    await And('pengguna berada di halaman tanya AI', null, { page, world }); 
    await When('pengguna mengirim pertanyaan hukum ke AI', null, { page, tanyaAiPage, world }); 
    await Then('AI menampilkan ringkasan kasus sebagai draft pengajuan', null, { page, tanyaAiPage, world }); 
    await When('pengguna memilih menjadwalkan konsultan yang direkomendasikan', null, { context, page, tanyaAiPage, world }); 
    await Then('form pengajuan di tab baru sudah berisi ringkasan kasus dari AI', null, { page, world }); 
  });

  test('Dokumen sumber jawaban AI dapat dibuka sampai naskah resminya', { tag: ['@sit', '@tanya-ai', '@precondition:login-klien', '@AI-015', '@stub'] }, async ({ Given, When, Then, And, network, page, tanyaAiPage, world }) => { 
    await Given('AI akan membalas dengan jawaban bersumber', null, { network, page, world }); 
    await And('pengguna berada di halaman tanya AI', null, { page, world }); 
    await When('pengguna mengirim pertanyaan hukum ke AI', null, { page, tanyaAiPage, world }); 
    await Then('AI menampilkan dokumen sumber di bawah jawaban', null, { page, tanyaAiPage, world }); 
    await When('pengguna membuka dokumen sumber itu', null, { network, page, tanyaAiPage, world }); 
    await Then('isi pasal yang dirujuk tampil beserta tautan naskah resminya', null, { network, page, tanyaAiPage, world }); 
    await When('pengguna beralih ke naskah resmi', null, { page, tanyaAiPage, world }); 
    await Then('naskah resmi peraturan ditampilkan di dalam pratinjau', null, { page, tanyaAiPage, world }); 
  });

  test('Jawaban cepat dapat dipilih saat AI menanyakan bukti', { tag: ['@sit', '@tanya-ai', '@precondition:login-klien', '@AI-009', '@stub'] }, async ({ Given, When, Then, And, network, page, tanyaAiPage, world }) => { 
    await Given('AI akan membalas dengan pertanyaan tentang bukti', null, { network, page, world }); 
    await And('pengguna berada di halaman tanya AI', null, { page, world }); 
    await When('pengguna mengirim pertanyaan hukum ke AI', null, { page, tanyaAiPage, world }); 
    await And('pengguna memilih jawaban cepat bahwa ia punya bukti', null, { page, tanyaAiPage, world }); 
    await Then('jawaban cepat itu dikirim sebagai pertanyaan berikutnya', null, { network, page, world }); 
  });

  test('Jawaban AI berisi konten berbahaya tidak dijalankan browser', { tag: ['@sit', '@tanya-ai', '@precondition:login-klien', '@AI-010', '@stub'] }, async ({ Given, When, Then, And, dialogs, network, page, tanyaAiPage, world }) => { 
    await Given('AI akan membalas dengan konten berbahaya', null, { network, page, world }); 
    await And('pengguna berada di halaman tanya AI', null, { page, world }); 
    await When('pengguna mengirim pertanyaan hukum ke AI', null, { page, tanyaAiPage, world }); 
    await Then('konten berbahaya dalam jawaban AI dinetralkan', null, { page, tanyaAiPage, world }); 
    await And('tidak ada dialog yang muncul', null, { dialogs, page, world }); 
  });

  test('Pertanyaan baru tidak dikirim selama AI masih menjawab', { tag: ['@sit', '@tanya-ai', '@precondition:login-klien', '@AI-011', '@stub'] }, async ({ Given, When, Then, And, network, page, tanyaAiPage, world }) => { 
    await Given('AI akan membalas dengan jawaban biasa setelah beberapa saat', null, { network, page, world }); 
    await And('pengguna berada di halaman tanya AI', null, { page, world }); 
    await When('pengguna mengirim dua pertanyaan tanpa menunggu jawaban', null, { page, tanyaAiPage, world }); 
    await Then('hanya ada 1 permintaan tanya AI yang dikirim ke backend', null, { network, page, world }); 
  });

  test('Klien membuka sesi lama, menghapus sesi lain, lalu memulai percakapan baru', { tag: ['@sit', '@tanya-ai', '@precondition:login-klien', '@AI-012'] }, async ({ Given, When, Then, And, network, page, tanyaAiPage, world }) => { 
    await Given('klien punya dua sesi percakapan lama dengan AI', null, { page, world }); 
    await And('pengguna berada di halaman tanya AI', null, { page, world }); 
    await When('pengguna membuka salah satu sesi lama dari riwayat', null, { page, tanyaAiPage, world }); 
    await Then('isi percakapan sesi itu tampil kembali', null, { page, world }); 
    await When('pengguna menghapus sesi lama yang lain', null, { network, page, tanyaAiPage, world }); 
    await Then('sesi itu terhapus dari riwayat dan dari database', null, { page, tanyaAiPage, world }); 
    await When('pengguna memulai percakapan baru', null, { page, tanyaAiPage, world }); 
    await Then('Tanya AI kembali menampilkan sambutan', null, { page, tanyaAiPage, world }); 
  });

  test('Riwayat percakapan tetap terbaca tanpa font ikon', { tag: ['@sit', '@tanya-ai', '@precondition:login-klien', '@AI-013'] }, async ({ Given, When, Then, And, page, tanyaAiPage, world }) => { 
    await Given('klien punya dua sesi percakapan lama dengan AI', null, { page, world }); 
    await And('font ikon tidak dapat dimuat', null, { page, world }); 
    await And('pengguna berada di halaman tanya AI', null, { page, world }); 
    await When('pengguna membuka riwayat percakapan', null, { page, tanyaAiPage, world }); 
    await Then('judul sesi lama tetap terbaca', null, { page, world }); 
  });

});

// == technical section ==

test.beforeAll('BeforeAll Hooks', ({ $runBeforeAllHooks }) => $runBeforeAllHooks(test, {  }, bddFileData));
test.afterAll('AfterAll Hooks', ({ $registerAfterAllHooks }) => $registerAfterAllHooks(test, {  }, bddFileData));
test.beforeEach('BeforeEach Hooks', ({ $runScenarioHooks, auth, page, world }) => $runScenarioHooks('before', { auth, page, world }));
test.afterEach('AfterEach Hooks', ({ $runScenarioHooks, dialogs, network, page, world }) => $runScenarioHooks('after', { dialogs, network, page, world }));

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\tanya-ai\\tanya-ai.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":10,"tags":["@sit","@tanya-ai","@precondition:login-klien","@AI-001","@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":11,"keywordType":"Action","textWithKeyword":"When pengguna membuka halaman tanya AI","stepMatchArguments":[{"group":{"start":25,"value":"tanya AI"},"parameterTypeName":"halaman"}]},{"pwStepLine":8,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"Then Tanya AI menampilkan sambutan dan menunggu pertanyaan","stepMatchArguments":[]}]},
  {"pwTestLine":11,"pickleLine":15,"tags":["@sit","@tanya-ai","@precondition:login-klien","@AI-002","@critical","@layanan-eksternal"],"steps":[{"pwStepLine":12,"gherkinStepLine":16,"keywordType":"Context","textWithKeyword":"Given klien belum punya percakapan dengan AI","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":17,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman tanya AI","stepMatchArguments":[{"group":{"start":27,"value":"tanya AI"},"parameterTypeName":"halaman"}]},{"pwStepLine":14,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"When pengguna mengirim pertanyaan hukum ke AI","stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then pertanyaan itu tampil di percakapan selagi AI menyiapkan jawaban","stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"And AI membalas pertanyaan itu","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":21,"keywordType":"Outcome","textWithKeyword":"And percakapan tersimpan sebagai sesi klien uji","stepMatchArguments":[]}]},
  {"pwTestLine":20,"pickleLine":24,"tags":["@sit","@tanya-ai","@precondition:login-klien","@AI-003","@stub"],"steps":[{"pwStepLine":21,"gherkinStepLine":25,"keywordType":"Context","textWithKeyword":"Given AI akan membalas dengan jawaban biasa","stepMatchArguments":[{"group":{"start":24,"value":"jawaban biasa"},"parameterTypeName":"jawabanAi"}]},{"pwStepLine":22,"gherkinStepLine":26,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman tanya AI","stepMatchArguments":[{"group":{"start":27,"value":"tanya AI"},"parameterTypeName":"halaman"}]},{"pwStepLine":23,"gherkinStepLine":27,"keywordType":"Action","textWithKeyword":"When pengguna mengirim dua pertanyaan berturut-turut","stepMatchArguments":[]},{"pwStepLine":24,"gherkinStepLine":28,"keywordType":"Outcome","textWithKeyword":"Then pertanyaan kedua dikirim dalam sesi yang sama","stepMatchArguments":[]}]},
  {"pwTestLine":27,"pickleLine":31,"tags":["@sit","@tanya-ai","@precondition:login-klien","@AI-004"],"steps":[{"pwStepLine":28,"gherkinStepLine":32,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman tanya AI","stepMatchArguments":[{"group":{"start":27,"value":"tanya AI"},"parameterTypeName":"halaman"}]},{"pwStepLine":29,"gherkinStepLine":33,"keywordType":"Action","textWithKeyword":"When pengguna menulis pertanyaan dua baris","stepMatchArguments":[]},{"pwStepLine":30,"gherkinStepLine":34,"keywordType":"Outcome","textWithKeyword":"Then pertanyaan itu belum dikirim ke AI","stepMatchArguments":[]}]},
  {"pwTestLine":33,"pickleLine":37,"tags":["@sit","@tanya-ai","@precondition:login-klien","@AI-004"],"steps":[{"pwStepLine":34,"gherkinStepLine":38,"keywordType":"Context","textWithKeyword":"Given pengguna berada di halaman tanya AI","stepMatchArguments":[{"group":{"start":27,"value":"tanya AI"},"parameterTypeName":"halaman"}]},{"pwStepLine":35,"gherkinStepLine":39,"keywordType":"Action","textWithKeyword":"When pengguna mengirim pertanyaan yang hanya berisi spasi","stepMatchArguments":[]},{"pwStepLine":36,"gherkinStepLine":40,"keywordType":"Outcome","textWithKeyword":"Then tidak ada permintaan tanya AI yang dikirim ke backend","stepMatchArguments":[{"group":{"start":21,"value":"tanya AI"},"parameterTypeName":"layanan"}]}]},
  {"pwTestLine":39,"pickleLine":43,"tags":["@sit","@tanya-ai","@precondition:login-klien","@AI-005"],"steps":[{"pwStepLine":40,"gherkinStepLine":44,"keywordType":"Context","textWithKeyword":"Given layanan AI sedang kebanjiran permintaan","stepMatchArguments":[{"group":{"start":18,"value":"kebanjiran permintaan"},"parameterTypeName":"gangguanAi"}]},{"pwStepLine":41,"gherkinStepLine":45,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman tanya AI","stepMatchArguments":[{"group":{"start":27,"value":"tanya AI"},"parameterTypeName":"halaman"}]},{"pwStepLine":42,"gherkinStepLine":46,"keywordType":"Action","textWithKeyword":"When pengguna mengirim pertanyaan hukum ke AI","stepMatchArguments":[]},{"pwStepLine":43,"gherkinStepLine":47,"keywordType":"Outcome","textWithKeyword":"Then AI menampilkan pesan gangguan yang sesuai dan klien dapat bertanya lagi","stepMatchArguments":[]}]},
  {"pwTestLine":46,"pickleLine":50,"tags":["@sit","@tanya-ai","@precondition:login-klien","@AI-006"],"steps":[{"pwStepLine":47,"gherkinStepLine":51,"keywordType":"Context","textWithKeyword":"Given layanan AI sedang mengalami galat internal","stepMatchArguments":[{"group":{"start":18,"value":"mengalami galat internal"},"parameterTypeName":"gangguanAi"}]},{"pwStepLine":48,"gherkinStepLine":52,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman tanya AI","stepMatchArguments":[{"group":{"start":27,"value":"tanya AI"},"parameterTypeName":"halaman"}]},{"pwStepLine":49,"gherkinStepLine":53,"keywordType":"Action","textWithKeyword":"When pengguna mengirim pertanyaan hukum ke AI","stepMatchArguments":[]},{"pwStepLine":50,"gherkinStepLine":54,"keywordType":"Outcome","textWithKeyword":"Then AI menampilkan pesan gangguan yang sesuai dan klien dapat bertanya lagi","stepMatchArguments":[]}]},
  {"pwTestLine":53,"pickleLine":57,"tags":["@sit","@tanya-ai","@precondition:login-klien","@AI-007"],"steps":[{"pwStepLine":54,"gherkinStepLine":58,"keywordType":"Context","textWithKeyword":"Given layanan AI sedang tidak dapat dihubungi","stepMatchArguments":[{"group":{"start":18,"value":"tidak dapat dihubungi"},"parameterTypeName":"gangguanAi"}]},{"pwStepLine":55,"gherkinStepLine":59,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman tanya AI","stepMatchArguments":[{"group":{"start":27,"value":"tanya AI"},"parameterTypeName":"halaman"}]},{"pwStepLine":56,"gherkinStepLine":60,"keywordType":"Action","textWithKeyword":"When pengguna mengirim pertanyaan hukum ke AI","stepMatchArguments":[]},{"pwStepLine":57,"gherkinStepLine":61,"keywordType":"Outcome","textWithKeyword":"Then AI menampilkan pesan gangguan yang sesuai dan klien dapat bertanya lagi","stepMatchArguments":[]}]},
  {"pwTestLine":60,"pickleLine":64,"tags":["@sit","@tanya-ai","@precondition:login-klien","@AI-008","@stub"],"steps":[{"pwStepLine":61,"gherkinStepLine":65,"keywordType":"Context","textWithKeyword":"Given AI akan membalas dengan rekomendasi konsultan","stepMatchArguments":[{"group":{"start":24,"value":"rekomendasi konsultan"},"parameterTypeName":"jawabanAi"}]},{"pwStepLine":62,"gherkinStepLine":66,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman tanya AI","stepMatchArguments":[{"group":{"start":27,"value":"tanya AI"},"parameterTypeName":"halaman"}]},{"pwStepLine":63,"gherkinStepLine":67,"keywordType":"Action","textWithKeyword":"When pengguna mengirim pertanyaan hukum ke AI","stepMatchArguments":[]},{"pwStepLine":64,"gherkinStepLine":68,"keywordType":"Outcome","textWithKeyword":"Then AI menampilkan konsultan uji sebagai rekomendasi","stepMatchArguments":[]},{"pwStepLine":65,"gherkinStepLine":69,"keywordType":"Action","textWithKeyword":"When pengguna memilih menjadwalkan konsultan yang direkomendasikan","stepMatchArguments":[]},{"pwStepLine":66,"gherkinStepLine":70,"keywordType":"Outcome","textWithKeyword":"Then profil konsultan uji terbuka di tab baru","stepMatchArguments":[]}]},
  {"pwTestLine":69,"pickleLine":73,"tags":["@sit","@tanya-ai","@precondition:login-klien","@AI-014","@stub"],"steps":[{"pwStepLine":70,"gherkinStepLine":74,"keywordType":"Context","textWithKeyword":"Given AI akan membalas dengan draft pengajuan konsultasi","stepMatchArguments":[{"group":{"start":24,"value":"draft pengajuan konsultasi"},"parameterTypeName":"jawabanAi"}]},{"pwStepLine":71,"gherkinStepLine":75,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman tanya AI","stepMatchArguments":[{"group":{"start":27,"value":"tanya AI"},"parameterTypeName":"halaman"}]},{"pwStepLine":72,"gherkinStepLine":76,"keywordType":"Action","textWithKeyword":"When pengguna mengirim pertanyaan hukum ke AI","stepMatchArguments":[]},{"pwStepLine":73,"gherkinStepLine":77,"keywordType":"Outcome","textWithKeyword":"Then AI menampilkan ringkasan kasus sebagai draft pengajuan","stepMatchArguments":[]},{"pwStepLine":74,"gherkinStepLine":78,"keywordType":"Action","textWithKeyword":"When pengguna memilih menjadwalkan konsultan yang direkomendasikan","stepMatchArguments":[]},{"pwStepLine":75,"gherkinStepLine":79,"keywordType":"Outcome","textWithKeyword":"Then form pengajuan di tab baru sudah berisi ringkasan kasus dari AI","stepMatchArguments":[]}]},
  {"pwTestLine":78,"pickleLine":82,"tags":["@sit","@tanya-ai","@precondition:login-klien","@AI-015","@stub"],"steps":[{"pwStepLine":79,"gherkinStepLine":83,"keywordType":"Context","textWithKeyword":"Given AI akan membalas dengan jawaban bersumber","stepMatchArguments":[{"group":{"start":24,"value":"jawaban bersumber"},"parameterTypeName":"jawabanAi"}]},{"pwStepLine":80,"gherkinStepLine":84,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman tanya AI","stepMatchArguments":[{"group":{"start":27,"value":"tanya AI"},"parameterTypeName":"halaman"}]},{"pwStepLine":81,"gherkinStepLine":85,"keywordType":"Action","textWithKeyword":"When pengguna mengirim pertanyaan hukum ke AI","stepMatchArguments":[]},{"pwStepLine":82,"gherkinStepLine":86,"keywordType":"Outcome","textWithKeyword":"Then AI menampilkan dokumen sumber di bawah jawaban","stepMatchArguments":[]},{"pwStepLine":83,"gherkinStepLine":87,"keywordType":"Action","textWithKeyword":"When pengguna membuka dokumen sumber itu","stepMatchArguments":[]},{"pwStepLine":84,"gherkinStepLine":88,"keywordType":"Outcome","textWithKeyword":"Then isi pasal yang dirujuk tampil beserta tautan naskah resminya","stepMatchArguments":[]},{"pwStepLine":85,"gherkinStepLine":89,"keywordType":"Action","textWithKeyword":"When pengguna beralih ke naskah resmi","stepMatchArguments":[]},{"pwStepLine":86,"gherkinStepLine":90,"keywordType":"Outcome","textWithKeyword":"Then naskah resmi peraturan ditampilkan di dalam pratinjau","stepMatchArguments":[]}]},
  {"pwTestLine":89,"pickleLine":93,"tags":["@sit","@tanya-ai","@precondition:login-klien","@AI-009","@stub"],"steps":[{"pwStepLine":90,"gherkinStepLine":94,"keywordType":"Context","textWithKeyword":"Given AI akan membalas dengan pertanyaan tentang bukti","stepMatchArguments":[{"group":{"start":24,"value":"pertanyaan tentang bukti"},"parameterTypeName":"jawabanAi"}]},{"pwStepLine":91,"gherkinStepLine":95,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman tanya AI","stepMatchArguments":[{"group":{"start":27,"value":"tanya AI"},"parameterTypeName":"halaman"}]},{"pwStepLine":92,"gherkinStepLine":96,"keywordType":"Action","textWithKeyword":"When pengguna mengirim pertanyaan hukum ke AI","stepMatchArguments":[]},{"pwStepLine":93,"gherkinStepLine":97,"keywordType":"Action","textWithKeyword":"And pengguna memilih jawaban cepat bahwa ia punya bukti","stepMatchArguments":[]},{"pwStepLine":94,"gherkinStepLine":98,"keywordType":"Outcome","textWithKeyword":"Then jawaban cepat itu dikirim sebagai pertanyaan berikutnya","stepMatchArguments":[]}]},
  {"pwTestLine":97,"pickleLine":101,"tags":["@sit","@tanya-ai","@precondition:login-klien","@AI-010","@stub"],"steps":[{"pwStepLine":98,"gherkinStepLine":102,"keywordType":"Context","textWithKeyword":"Given AI akan membalas dengan konten berbahaya","stepMatchArguments":[{"group":{"start":24,"value":"konten berbahaya"},"parameterTypeName":"jawabanAi"}]},{"pwStepLine":99,"gherkinStepLine":103,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman tanya AI","stepMatchArguments":[{"group":{"start":27,"value":"tanya AI"},"parameterTypeName":"halaman"}]},{"pwStepLine":100,"gherkinStepLine":104,"keywordType":"Action","textWithKeyword":"When pengguna mengirim pertanyaan hukum ke AI","stepMatchArguments":[]},{"pwStepLine":101,"gherkinStepLine":105,"keywordType":"Outcome","textWithKeyword":"Then konten berbahaya dalam jawaban AI dinetralkan","stepMatchArguments":[]},{"pwStepLine":102,"gherkinStepLine":106,"keywordType":"Outcome","textWithKeyword":"And tidak ada dialog yang muncul","stepMatchArguments":[]}]},
  {"pwTestLine":105,"pickleLine":109,"tags":["@sit","@tanya-ai","@precondition:login-klien","@AI-011","@stub"],"steps":[{"pwStepLine":106,"gherkinStepLine":110,"keywordType":"Context","textWithKeyword":"Given AI akan membalas dengan jawaban biasa setelah beberapa saat","stepMatchArguments":[{"group":{"start":24,"value":"jawaban biasa"},"parameterTypeName":"jawabanAi"}]},{"pwStepLine":107,"gherkinStepLine":111,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman tanya AI","stepMatchArguments":[{"group":{"start":27,"value":"tanya AI"},"parameterTypeName":"halaman"}]},{"pwStepLine":108,"gherkinStepLine":112,"keywordType":"Action","textWithKeyword":"When pengguna mengirim dua pertanyaan tanpa menunggu jawaban","stepMatchArguments":[]},{"pwStepLine":109,"gherkinStepLine":113,"keywordType":"Outcome","textWithKeyword":"Then hanya ada 1 permintaan tanya AI yang dikirim ke backend","stepMatchArguments":[{"group":{"start":10,"value":"1"},"parameterTypeName":"int"},{"group":{"start":23,"value":"tanya AI"},"parameterTypeName":"layanan"}]}]},
  {"pwTestLine":112,"pickleLine":116,"tags":["@sit","@tanya-ai","@precondition:login-klien","@AI-012"],"steps":[{"pwStepLine":113,"gherkinStepLine":117,"keywordType":"Context","textWithKeyword":"Given klien punya dua sesi percakapan lama dengan AI","stepMatchArguments":[]},{"pwStepLine":114,"gherkinStepLine":118,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman tanya AI","stepMatchArguments":[{"group":{"start":27,"value":"tanya AI"},"parameterTypeName":"halaman"}]},{"pwStepLine":115,"gherkinStepLine":119,"keywordType":"Action","textWithKeyword":"When pengguna membuka salah satu sesi lama dari riwayat","stepMatchArguments":[]},{"pwStepLine":116,"gherkinStepLine":120,"keywordType":"Outcome","textWithKeyword":"Then isi percakapan sesi itu tampil kembali","stepMatchArguments":[]},{"pwStepLine":117,"gherkinStepLine":121,"keywordType":"Action","textWithKeyword":"When pengguna menghapus sesi lama yang lain","stepMatchArguments":[]},{"pwStepLine":118,"gherkinStepLine":122,"keywordType":"Outcome","textWithKeyword":"Then sesi itu terhapus dari riwayat dan dari database","stepMatchArguments":[]},{"pwStepLine":119,"gherkinStepLine":123,"keywordType":"Action","textWithKeyword":"When pengguna memulai percakapan baru","stepMatchArguments":[]},{"pwStepLine":120,"gherkinStepLine":124,"keywordType":"Outcome","textWithKeyword":"Then Tanya AI kembali menampilkan sambutan","stepMatchArguments":[]}]},
  {"pwTestLine":123,"pickleLine":127,"tags":["@sit","@tanya-ai","@precondition:login-klien","@AI-013"],"steps":[{"pwStepLine":124,"gherkinStepLine":128,"keywordType":"Context","textWithKeyword":"Given klien punya dua sesi percakapan lama dengan AI","stepMatchArguments":[]},{"pwStepLine":125,"gherkinStepLine":129,"keywordType":"Context","textWithKeyword":"And font ikon tidak dapat dimuat","stepMatchArguments":[]},{"pwStepLine":126,"gherkinStepLine":130,"keywordType":"Context","textWithKeyword":"And pengguna berada di halaman tanya AI","stepMatchArguments":[{"group":{"start":27,"value":"tanya AI"},"parameterTypeName":"halaman"}]},{"pwStepLine":127,"gherkinStepLine":131,"keywordType":"Action","textWithKeyword":"When pengguna membuka riwayat percakapan","stepMatchArguments":[]},{"pwStepLine":128,"gherkinStepLine":132,"keywordType":"Outcome","textWithKeyword":"Then judul sesi lama tetap terbaca","stepMatchArguments":[]}]},
]; // bdd-data-end
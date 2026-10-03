# 🧪 LangkahLegal E2E Testing Suite

End-to-End tests for LangkahLegal using [Playwright](https://playwright.dev/) with Page Object Model pattern.

## Full E2E & Regression Suite (`regression/` + `live/`)

Suite lengkap (251 test case, 36 fitur) yang **tidak membutuhkan akun/database**: frontend build produksi
dijalankan di browser dan seluruh panggilan `/api/v1/*` di-mock di level jaringan (`regression/support/mock-api.js`).
Laporan hasil: [`../../../E2E_REGRESSION_REPORT.md`](../../../E2E_REGRESSION_REPORT.md).

```bash
npm run build                    # sekali; suite memakai `next start -p 3100`
npm run test:regression          # desktop + mobile (Pixel 7)
npm run test:regression:smoke    # subset @smoke
npm run test:live-api            # live API non-destruktif (backend harus jalan di :8000)
npm run test:regression:report   # regenerasi E2E_REGRESSION_REPORT.md dari hasil terakhir
```

| Path | Isi |
| --- | --- |
| `regression/specs/01..10-*.spec.js` | Skenario per fitur (publik, auth, guard, client, pembayaran, bursa, konsultan, AI, pengaturan, admin) |
| `regression/support/fixtures.js` | Fixture `api` (MockApi), `loginAs(role)`, `dialogs` (alert/confirm), `pageErrors`, helper `tc()` & `knownDefect()` |
| `regression/support/mock-data.js` | Data mock yang meniru response FastAPI (tanggal relatif ke hari ini) |
| `regression/support/findings.js` | Daftar defect + severity untuk laporan |
| `live/api.live.spec.js` | Uji kontrak & keamanan API backend sungguhan (hanya request yang tidak mengubah data) |

- Defect yang sudah terkonfirmasi ditandai `knownDefect("BUG-xx")` → suite tetap hijau, dan test akan berstatus
  *unexpected pass* ketika bug diperbaiki (hapus penandanya). Jalankan dengan `E2E_STRICT=1` untuk melihat kegagalan apa adanya.
- `E2E_WORKERS` mengatur paralelisme (default 2; di Windows >2 browser membuat aset `/_next/static` menggantung).
- `E2E_OFFLINE=1` memblokir Google Fonts untuk menguji tampilan tanpa CDN.
- Isi `.env.e2e` (lihat `.env.e2e.example`) agar test live terautentikasi (LIVE-020/021) ikut berjalan.

## Prerequisites

- **Node.js** >= 20
- **Running frontend** (`npm run dev` in `/frontend`)
- **Running backend** (`uvicorn main:app` in `/backend`)
- Test accounts configured in `.env.e2e`

## Quick Setup

```bash
# 1. Install dependencies
cd frontend
npm install

# 2. Install Playwright browsers
npx playwright install chromium

# 3. Configure test accounts
cp .env.e2e .env.e2e.local  # Edit with real credentials

# 4. Start services (in separate terminals)
# Terminal 1: Backend
cd backend && uvicorn main:app --reload

# Terminal 2: Frontend
cd frontend && npm run dev

# 5. Run tests
npm run test:e2e
```

## Running Tests

| Command                         | Description                    |
| ------------------------------- | ------------------------------ |
| `npm run test:e2e`              | Run all E2E tests (headless)   |
| `npm run test:e2e:headed`       | Run with visible browser       |
| `npm run test:e2e:ui`           | Interactive UI mode            |
| `npm run test:e2e:debug`        | Debug mode with inspector      |
| `npm run test:e2e:auth`         | Auth tests only                |
| `npm run test:e2e:explore`      | Explore/directory tests only   |
| `npm run test:e2e:consultation` | Consultation tests only        |
| `npm run test:e2e:schedule`     | Schedule tests only            |
| `npm run test:e2e:bursa`        | Bursa Kasus Probono tests only |
| `npm run test:e2e:profile`      | Profile tests only             |
| `npm run test:e2e:payment`      | Payment flow tests only        |
| `npm run test:e2e:chatbot`      | AI Chatbot tests only          |
| `npm run test:e2e:admin`        | Admin dashboard tests only     |
| `npm run test:e2e:report`       | Open HTML report               |

## Project Structure

```
tests/e2e/
├── fixtures/          # Reusable test fixtures (auth sessions)
│   ├── auth.fixture.js    # Pre-authenticated page contexts
│   └── index.js           # Barrel export
├── pom/               # Page Object Models
│   ├── LoginPage.js
│   ├── SignupPage.js
│   ├── RolePage.js
│   ├── ExplorePage.js
│   ├── ConsultantDetailPage.js
│   ├── ProfilePage.js
│   ├── DashboardPage.js
│   ├── DashboardPage.js
│   ├── SchedulePage.js
│   ├── BursaPage.js
│   ├── BursaPostPage.js
│   ├── PaymentPage.js
│   ├── ChatbotPage.js
│   └── AdminDashboardPage.js
├── specs/             # Test specifications
│   ├── auth.spec.js       # Authentication & role tests
│   ├── profile.spec.js    # Profile management tests
│   ├── explore.spec.js    # Consultant directory tests
│   ├── consultation.spec.js # Booking flow tests
│   ├── schedule.spec.js   # Schedule management tests
│   ├── bursa.spec.js       # Bursa Kasus Probono tests
│   ├── payment.spec.js    # Payment flow tests
│   ├── chatbot.spec.js    # AI Chatbot tests
│   └── admin.spec.js      # Admin dashboard tests
├── utils/             # Shared utilities
│   ├── api-helper.js      # API-based login & session injection
│   ├── selectors.js       # Centralized data-testid selectors
│   └── test-data.js       # Test accounts & sample data
└── results/           # Test output (gitignored)
    └── html-report/
```

## Environment Variables

Create `.env.e2e` with:

```env
PLAYWRIGHT_BASE_URL=http://localhost:3000
PLAYWRIGHT_API_URL=http://127.0.0.1:8000/api/v1
E2E_CLIENT_EMAIL=...
E2E_CLIENT_PASSWORD=...
E2E_CONSULTANT_EMAIL=...
E2E_CONSULTANT_PASSWORD=...
E2E_ADMIN_EMAIL=...
E2E_ADMIN_PASSWORD=...
```

## Adding New Tests

1. **New page?** Create a POM in `pom/` with locators and action methods
2. **New selector?** Add `data-testid` to the component, then register in `utils/selectors.js`
3. **New spec?** Create in `specs/`, use fixtures for authenticated tests
4. **Tag with** `@featurename` in `describe` for filtered runs

## CI/CD

Tests run automatically via GitHub Actions on push/PR to `main`/`develop`. See `.github/workflows/e2e.yml`.

Required GitHub Secrets:

- `E2E_CLIENT_EMAIL`, `E2E_CLIENT_PASSWORD`
- `E2E_CONSULTANT_EMAIL`, `E2E_CONSULTANT_PASSWORD`
- `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`
- `SUPABASE_URL`, `SUPABASE_KEY`

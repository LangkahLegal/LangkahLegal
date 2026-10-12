# 01 — Backend Architecture Review

> **Note (2026-10-12):** This review describes the backend before the layered refactor. The logic has since moved out of `backend/routers/*.py` into `backend/services/`, `backend/repositories/`, `backend/helpers/`, `backend/core/` and `backend/docs/`, so the file and line links below point to the old locations. Findings still open should be re-located by function name.

Scope: `backend/` only (FastAPI service). Frontend (`frontend/`, Next.js) is referenced only where it affects backend design decisions (CORS, cookie flags, base URL).

## 1. Stack summary

| Aspect | Value | Source |
|---|---|---|
| Language / runtime | Python. CI pins **Python 3.11** | [.github/workflows/ci.yml:95](../../.github/workflows/ci.yml#L95), [.github/workflows/test.yml:21](../../.github/workflows/test.yml#L21) |
| Web framework | FastAPI `0.135.2` | [backend/requirements.txt:15](../../backend/requirements.txt#L15) |
| ASGI server | uvicorn `0.42.0` (declared as a dependency; no explicit run command committed — see §5) | [backend/requirements.txt:58](../../backend/requirements.txt#L58) |
| Database / BaaS | Supabase (hosted Postgres + Auth + Storage), accessed via `supabase-py` `2.28.3` | [backend/requirements.txt:51](../../backend/requirements.txt#L51), [backend/database.py](../../backend/database.py) |
| Package manager | pip, single `requirements.txt` (no `pyproject.toml`, no lockfile, no pinned transitive hashes) | [backend/requirements.txt](../../backend/requirements.txt) |
| AI providers | Google Gemini (`google-genai`) for chat/metadata generation, Voyage AI (`voyageai`) for embeddings | [backend/rag_service.py:17-19](../../backend/rag_service.py#L17-L19) |
| Payments | Midtrans (`midtransclient`) | [backend/routers/payments.py:4](../../backend/routers/payments.py#L4) |
| Email | Brevo transactional email HTTP API (not SMTP — see comment) | [backend/services/email_service.py:8-16](../../backend/services/email_service.py#L8-L16) |
| Image upload | ImgBB (`imgbb` package + custom `httpx` calls) — **appears unused**, see §6 | [backend/services/__init__.py:11-68](../../backend/services/__init__.py#L11-L68) |
| Rate limiting | `slowapi` (in-memory, per-process) | [backend/limiter.py](../../backend/limiter.py) |
| Testing | `pytest` + `fastapi.testclient.TestClient`, Supabase fully mocked | [backend/tests/conftest.py](../../backend/tests/conftest.py), [backend/tests/TESTING.md](../../backend/tests/TESTING.md) |

## 2. Module / folder structure

```
backend/
├── main.py              # FastAPI app instance, CORS, router registration, /health
├── config.py             # Settings dataclass, loaded once via lru_cache
├── database.py            # Supabase client factory + health check
├── dependencies.py         # get_current_user() — auth dependency
├── limiter.py             # slowapi Limiter instance
├── rag_service.py          # Chatbot RAG + agentic pipeline (no router-level split)
├── requirements.txt
├── routers/               # One file per feature area, FastAPI APIRouter
│   ├── auth.py            # Signup/login/OTP/OAuth/session, proxies Supabase Auth REST API directly
│   ├── cases.py            # "Bursa Kasus" (anonymous case marketplace)
│   ├── consultants.py        # Consultant catalog, schedules, dashboard stats
│   ├── consultations.py       # Consultation request lifecycle, documents, ratings
│   ├── payments.py          # Midtrans Snap transactions + webhook
│   ├── users.py            # Profile settings
│   ├── admin.py            # Admin dashboard stats + consultant verification
│   ├── admin_docs.py         # RAG knowledge-base document management (PDF ingestion)
│   └── chatbot.py           # Chat sessions + /triage endpoint (calls rag_service.triage)
├── schemas/               # Pydantic request/response models, one file per router
├── services/
│   ├── __init__.py          # File upload helpers (ImgBB, Supabase Storage)
│   ├── doc_processing.py       # PDF → text → chunks → embeddings pipeline (used by admin_docs)
│   └── email_service.py       # Brevo email sending
└── tests/                 # pytest suite, Supabase fully mocked (see 03-technical-debt.md)
```

**Separation of concerns**: the codebase is *not* layered into routing/business-logic/data-access tiers. Routers in `routers/*.py` directly construct Supabase queries, apply authorization checks, run business rules (e.g. schedule-conflict detection, pricing math), and send emails, all inline in the endpoint function. There is no repository/service layer between the router and the database client except for file upload (`services/__init__.py`) and the RAG pipeline (`rag_service.py`, `services/doc_processing.py`), which are the only two areas with a dedicated service module. This is a reasonable pattern for a small student-scale project but means business logic is duplicated across endpoints (see `03-technical-debt.md` for concrete duplication).

## 3. Request flow

1. `main.py` builds the `FastAPI` app, attaches a custom HTTPS-scheme-forcing middleware ([main.py:39-43](../../backend/main.py#L39-L43)), CORS middleware with a regex allow-list ([main.py:45-51](../../backend/main.py#L45-L51)), and a `slowapi` rate-limit exception handler.
2. All business routers are mounted under `/api/v1/*` ([main.py:75-83](../../backend/main.py#L75-L83)); `/health` is mounted at the root, unauthenticated ([main.py:60-73](../../backend/main.py#L60-L73)).
3. Auth: almost every protected endpoint depends on `get_current_user` ([backend/dependencies.py:81-145](../../backend/dependencies.py#L81-L145)), which validates the bearer token (or `ll_token` cookie) via `supabase.auth.get_user(token)`, then looks up the local `users` row by `auth_user_id` (falling back to lookup-by-email and self-healing `auth_user_id` if it doesn't match — see `03-technical-debt.md`).
4. Data access: routers call the Supabase Python client directly (`db.table(...).select(...).eq(...).execute()`), i.e. PostgREST over HTTP. There is no local ORM, no connection pooling code, and no SQL written in this repo — all business logic that would normally be a SQL `JOIN`/`WHERE` is expressed via PostgREST's embedded-resource syntax (e.g. `konsultan(nama_lengkap, tarif_per_sesi)`).
5. External calls (Supabase Auth REST API, Midtrans, Gemini, Voyage AI, Brevo) are made synchronously via `httpx`/vendor SDKs from inside request handlers; only the RAG pipeline and PDF ingestion have background/async structure (`BackgroundTasks` in `admin_docs.py`).

## 4. External services and libraries

| Service | Purpose | Client library | Config source |
|---|---|---|---|
| Supabase (Postgres + Auth + Storage) | Primary datastore, auth, file storage | `supabase-py` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Google Gemini | Chat generation (`gemini-2.5-flash` w/ fallbacks), auto-title generation, PDF metadata extraction | `google-genai` | `GOOGLE_API_KEY` |
| Voyage AI | Text embeddings (`voyage-law-2`, 1024-dim) for RAG | `voyageai` | `VOYAGE_API_KEY` |
| Midtrans | Payment (Snap + Core API), webhook notifications | `midtransclient` | `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION` |
| Brevo | Transactional email over HTTPS (chosen specifically because Railway blocks outbound SMTP ports — see [email_service.py:11-14](../../backend/services/email_service.py#L11-L14)) | raw `httpx` calls | `BREVO_API_KEY`, `BREVO_FROM_EMAIL` |
| ImgBB | Image hosting for profile photos | `imgbb` package (unused) + custom `httpx` | `IMGBB_API_KEY` — **defined but the code path that uses it is never called from any router (see §6)** |

## 5. Environment variables

Reconstructed from [backend/.env.example](../../backend/.env.example) and [backend/config.py](../../backend/config.py). "Used?" reflects whether the variable is actually read anywhere in `backend/`.

| Variable | In `.env.example`? | Used in `config.py`/code? | Notes |
|---|---|---|---|
| `APP_ENV` | ✅ | ✅ [config.py:53](../../backend/config.py#L53) | Drives cookie `secure`/`samesite` flags and default frontend URL fallback |
| `APP_NAME` | ✅ | ✅ [config.py:54](../../backend/config.py#L54) | Cosmetic, shown in `/health` |
| `SUPABASE_URL` | ✅ | ✅ **required**, raises `RuntimeError` if missing | [config.py:47-50](../../backend/config.py#L47-L50) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ **required** (or `SUPABASE_KEY` fallback) | [config.py:34](../../backend/config.py#L34) — note the fallback env-var name `SUPABASE_KEY` is not itself documented in `.env.example` |
| `SUPABASE_JWT_SECRET` | ✅ | ❌ not referenced anywhere in `backend/` | Dead/stale entry — see §6 |
| `SUPABASE_PORTOFOLIO_BUCKET` | ✅ | ✅ [config.py:36](../../backend/config.py#L36) | Defaults to `"portofolio"` |
| `SUPABASE_ANON_KEY` | ✅ | ❌ not referenced anywhere in `backend/` | Dead/stale entry — see §6 |
| `SUPABASE_BERKAS_PENDUKUNG_BUCKET` | ✅ | ✅ [config.py:37](../../backend/config.py#L37) | Defaults to `"berkas-pendukung"` |
| `SUPABASE_KNOWLEDGE_BUCKET` | ❌ **missing from `.env.example`** | ✅ loaded, but never actually used to upload/read a file (grep found zero call sites for `supabase_knowledge_bucket` outside `config.py`/tests) | Effectively dead config |
| `IMGBB_API_KEY` | ✅ | ✅ loaded, but the only consumer (`services/__init__.py: update_user_profile_photo`) is never imported by any router — see §6 | |
| `FRONTEND_URL` | ✅ | ✅ [config.py:31](../../backend/config.py#L31), used for cookie domain defaults and email links | |
| `COOKIE_DOMAIN` | ✅ | ✅ [config.py:32](../../backend/config.py#L32) | |
| `MIDTRANS_SERVER_KEY` / `MIDTRANS_CLIENT_KEY` / `MIDTRANS_IS_PRODUCTION` | ✅ | ✅ | Used to build the Snap/Core API clients |
| `PASAL_API_TOKEN` | ✅ | ❌ not referenced anywhere in `backend/` | Dead/stale entry — likely leftover from an earlier design (e.g. an external "pasal" lookup API before the RAG pipeline existed) — see §6 |
| `GOOGLE_API_KEY` | ✅ | ✅ | Gemini client key |
| `VOYAGE_API_KEY` | ✅ | ✅ loaded into settings, but `rag_service.py`/`doc_processing.py` instantiate `voyageai.Client()` with **no arguments**, relying on the SDK reading `VOYAGE_API_KEY` from the process environment directly rather than from `settings.voyage_api_key` | [rag_service.py:144](../../backend/rag_service.py#L144), [doc_processing.py:291](../../backend/services/doc_processing.py#L291) — inconsistent config pattern, see `03-technical-debt.md` |
| `BREVO_API_KEY` / `BREVO_FROM_EMAIL` | ✅ | ✅ | |
| `SUPABASE_KEY` (fallback name for service role key) | ❌ not in `.env.example` | ✅ used as fallback in `config.py:34` and `dependencies.py:12` | Should be documented or removed |

**Frontend env vars** (for completeness, [frontend/.env.example](../../frontend/.env.example)): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`, `COOKIE_DOMAIN`, `NEXT_PUBLIC_IMGBB_API_KEY`. Note `NEXT_PUBLIC_SUPABASE_ANON_KEY` is declared but grep of `frontend/src` found no direct Supabase client usage outside auth token pass-through — **unclear from codebase** whether the frontend calls Supabase directly anywhere (no `@supabase/supabase-js` client instantiation was found in `frontend/src` during this review; it is listed as a dependency in `frontend/package.json` but a construction call was not located).

## 6. Dead / duplicated / abandoned code found during this review

| Item | Location | Evidence |
|---|---|---|
| `get_db()` generator | [backend/database.py:15-16](../../backend/database.py#L15-L16) | Defined but never imported/used anywhere; all routers use `get_supabase_client` directly as the FastAPI dependency instead. |
| `_get_supabase_user()` helper | [backend/dependencies.py:25-76](../../backend/dependencies.py#L25-L76) | A full alternate implementation of "validate token via Supabase Auth REST endpoint, then look up local profile", parallel to `get_current_user()` in the same file. Never called from anywhere in the codebase (grep confirms only its own definition matches). Looks like a superseded first draft left in place — the docstring on `get_current_user` even says `"Refactor: Validasi token menggunakan API resmi Supabase."` ([dependencies.py:87](../../backend/dependencies.py#L87)), suggesting `get_current_user` replaced this function but the old one wasn't deleted. |
| `upload_to_imgbb()` / `update_user_profile_photo()` | [backend/services/__init__.py:11-99](../../backend/services/__init__.py#L11-L99) | Full ImgBB upload flow, but no router imports `update_user_profile_photo`. Actual profile-photo updates go through `users.py: update_profile`, which just accepts a raw `foto_profil` string field ([routers/users.py:73](../../backend/routers/users.py#L73)) — the frontend evidently uploads elsewhere (e.g. directly to ImgBB from the browser using `NEXT_PUBLIC_IMGBB_API_KEY`) and only sends the resulting URL to the backend. `IMGBB_API_KEY` on the backend is therefore unused. |
| `CaseCreate` schema | [backend/schemas/cases.py](../../backend/schemas/cases.py) | Defined but never imported. `routers/cases.py: posting_kasus_anonim` takes the same fields as individual `Form(...)` parameters instead of using this Pydantic model, so validation constraints declared on `CaseCreate` (if any were added later) would never take effect. |
| `ConsultationCreate`, `ConsultationRespond` schemas | [backend/schemas/consultations.py](../../backend/schemas/consultations.py), imported at [routers/consultations.py:6](../../backend/routers/consultations.py#L6) | Imported but never used as a parameter type anywhere in the router. `ConsultationRespond` in particular implies a `/respond` endpoint that does not exist in the current router (see mismatch in `02-schema-and-api.md`) — likely a leftover from a renamed/removed endpoint (`PUT /{id}/status` appears to be its replacement). |
| CD pipeline (Docker build) | [.github/workflows/cd.yml](../../.github/workflows/cd.yml) | References `frontend/Dockerfile` and `backend/Dockerfile`, both gated behind `hashFiles(...) != ''`. **Neither Dockerfile exists in the repository** (confirmed via `find`), so every build/push step in this workflow currently no-ops. Either the Dockerfiles were removed after switching deployment strategy (comments in `email_service.py` reference Railway, and `frontend/src/lib/axios.js:23` hardcodes a Railway production URL, suggesting the actual deploy path is Railway's native buildpack rather than these Docker images) or the workflow is aspirational/unfinished. |
| `SUPABASE_JWT_SECRET`, `SUPABASE_ANON_KEY`, `PASAL_API_TOKEN` | [.env.example](../../backend/.env.example) | Declared in the example env file but not read anywhere in `backend/`. Either stale from an earlier design or reserved for a not-yet-implemented feature — **unclear from codebase**. |
| `SUPABASE_KNOWLEDGE_BUCKET` setting | [config.py:19,38,61](../../backend/config.py) | Loaded into `Settings` but never used to build a storage path anywhere; PDF ingestion in `admin_docs.py`/`doc_processing.py` extracts text and discards the original file — no bucket write occurs. |

## 7. How the app is started

- **Dev**: No `Procfile`, no `if __name__ == "__main__": uvicorn.run(...)` block in `main.py`, and no dev-start script was found in the repo. `uvicorn` is a pinned dependency ([requirements.txt:58](../../backend/requirements.txt#L58)), so the implied command is `uvicorn main:app --reload` run from inside `backend/`, but this is **not documented anywhere in the repository** (no root README covering backend startup was found — only `frontend/README.md`, which is the default Next.js template README and doesn't mention the backend). Confirm with the previous team before onboarding new developers.
- **Prod**: No Dockerfile, `Procfile`, or `railway.json`/`railway.toml` exists in the repo despite comments in `email_service.py` and a hardcoded URL in `frontend/src/lib/axios.js:23` (`https://langkahlegal-production.up.railway.app`) indicating the backend is deployed on **Railway**. The actual start command/build configuration therefore lives in the Railway dashboard, not in version control — **unclear from codebase**; recommend pulling the Railway service settings into a committed config (e.g. `railway.json` or a `Procfile`) so it's reviewable.
- **CI** ([.github/workflows/ci.yml](../../.github/workflows/ci.yml), [test.yml](../../.github/workflows/test.yml)): installs `backend/requirements.txt` under Python 3.11 and runs `pytest backend/tests`. No lint step (no `flake8`/`ruff`/`black` config found for the backend), no type-check step (no `mypy.ini`/`pyproject.toml` `[tool.mypy]`), no dependency-vulnerability scan for Python deps (CodeQL workflow exists at [.github/workflows/codeql.yml](../../.github/workflows/codeql.yml) but its language coverage was not verified in this pass — **unclear from codebase**, worth confirming it actually scans Python).

## 8. Summary for a new backend developer

- This is a **thin FastAPI wrapper around Supabase**, not a traditional layered backend — there is no local schema/migrations directory, no SQL in the repo, and business rules live inline in router functions.
- The RAG chatbot (`rag_service.py` + `admin_docs.py` + `services/doc_processing.py`) is architecturally the most distinct subsystem — it's the only part with a real multi-stage pipeline, background jobs, and multi-provider AI calls. See `04-chatbot-integration.md`.
- Treat `.env.example` with some skepticism: three declared variables are dead, and one used setting (`SUPABASE_KNOWLEDGE_BUCKET`) isn't documented in it at all. Cross-check against `config.py` before assuming a variable does something.
- Before making infra changes, get written confirmation from the previous team (or Railway dashboard access) on the actual prod start command — it is not in version control.

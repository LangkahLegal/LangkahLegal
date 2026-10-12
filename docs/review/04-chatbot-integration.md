# 04 — Chatbot "Triase Hukum" Integration Review

The feature is branded "Kia"/"Visi" in different places (system prompt calls the persona "Kia" — [rag_service.py:55](../../backend/rag_service.py#L55) — while the frontend page calls it "Visi" — [frontend/src/app/ai/page.js:16,225](../../frontend/src/app/ai/page.js#L16)). **This naming inconsistency is itself worth flagging** — confirm with product/design which name is current before the next UI change.

## 1. End-to-end flow

```
Frontend (frontend/src/app/ai/page.js)
  │  POST /api/v1/chatbot/triage  { query, session_id, kategori }
  ▼
routers/chatbot.py: chatbot_triage()
  │  1. resolve/create chat_sessions row
  │  2. load chat_history from chat_messages (DB)
  │  3. call rag_service.triage(query, supabase, kategori, chat_history)
  ▼
rag_service.py: triage()
  │  1. rewrite_query()      — Gemini, only if query < 5 words
  │  2. embed_query()        — Voyage AI (voyage-law-2)
  │  3. retrieve_pasals()    — Supabase RPC match_dokumen_hukum (vector search)
  │  4. agentic_generate()   — Gemini with a search_consultants tool, up to 3 tool-loop iterations
  ▼
routers/chatbot.py: chatbot_triage() (continued)
  │  4. save user message + AI message to chat_messages
  │  5. if first message in session: _auto_generate_title() (another Gemini call)
  ▼
Response: TriageResponse { session_id, type, jawaban, pasal_referensi, consultants?, disclaimer }
```

## 2. Endpoint

`POST /api/v1/chatbot/triage` ([backend/routers/chatbot.py:257-389](../../backend/routers/chatbot.py#L257-L389)):
- **Auth**: required (`get_current_user`) — chatbot use is restricted to logged-in users, no anonymous trial.
- **Rate limit**: `@limiter.limit("3/minute")` ([chatbot.py:272](../../backend/routers/chatbot.py#L272)), keyed by remote IP (`slowapi`'s `get_remote_address`, [limiter.py:1-4](../../backend/limiter.py#L1-L4) — note this is a **separate `Limiter` instance** from the one registered on `app.state.limiter` in `main.py`; both use the same in-memory backend so behavior is equivalent today, but it's worth noting the router doesn't reuse the shared instance, see §6).
- **Request** (`TriageRequest`, [schemas/chatbot.py:31-46](../../backend/schemas/chatbot.py#L31-L46)): `query` (3–2000 chars, required), `session_id` (optional — null creates a new session), `kategori` (optional filter, not validated against the RAG tool's enum at this layer).
- **Response** (`TriageResponse`, [schemas/chatbot.py:67-74](../../backend/schemas/chatbot.py#L67-L74)): `session_id`, `type` (`"text"` or `"consultant_list"`), `jawaban` (answer text), `pasal_referensi` (list of cited articles with similarity scores), `consultants` (populated only for `type="consultant_list"`), `disclaimer` (static string).

Supporting CRUD endpoints (`/chatbot/sessions*`) manage session/message history — see full inventory in `02-schema-and-api.md`.

## 3. Prompt construction

Two distinct prompts are used, both defined in `rag_service.py`:

1. **Query rewriter** ([QUERY_REWRITER_PROMPT, rag_service.py:40-53](../../backend/rag_service.py#L40-L53)) — only invoked when the raw user query is under 5 words ([rag_service.py:509-514](../../backend/rag_service.py#L509-L514)), to save API quota on longer, already-specific queries. Translates colloquial Indonesian into legal search terms and folds in the last 6 turns of chat history ([rewrite_query, rag_service.py:154-189](../../backend/rag_service.py#L154-L189)).
2. **System prompt / persona** ([SYSTEM_PROMPT, rag_service.py:55-99](../../backend/rag_service.py#L55-L99)) — defines the "Kia" persona and a mandatory 4-step interview SOP (gather chronology → legal analysis → evidence check → offer a consultant via tool call), plus explicit instructions not to leak internal source labels ("Sumber 1") or call the `search_consultants` tool prematurely.

The final prompt sent to Gemini per turn is assembled by `_build_contents()` ([rag_service.py:288-330](../../backend/rag_service.py#L288-L330)):
- Full DB-backed chat history is replayed as alternating `user`/`model` `Content` objects (role `"ai"` in the DB is mapped to Gemini's `"model"` role).
- Any prior AI turn whose metadata marks it `type="consultant_list"` gets a short synthetic note appended (`"[Konteks internal: Ditemukan N konsultan: ...]"`) so Gemini remembers it already made a recommendation, without replaying the full structured list ([_summarize_consultants, rag_service.py:280-285](../../backend/rag_service.py#L280-L285)).
- The current turn's user query is appended, with retrieved pasal context concatenated as a second `Part` under a `"KONTEKS PASAL HUKUM YANG RELEVAN:"` header ([rag_service.py:321-328](../../backend/rag_service.py#L321-L328)).
- `_smart_truncate()` then trims from the **oldest** history messages first if total history exceeds `MAX_HISTORY_CHARS = 60_000` chars (~15k tokens, [rag_service.py:33](../../backend/rag_service.py#L33)); the newest user message is never trimmed ([_smart_truncate, rag_service.py:333-359](../../backend/rag_service.py#L333-L359)).

Retrieved legal context is built by `_build_context()` ([rag_service.py:221-235](../../backend/rag_service.py#L221-L235)), which numbers each retrieved pasal as `[Sumber N]` with its law name, article, chapter title, and similarity percentage, then the raw article text — this is the block the system prompt explicitly tells the model not to expose the internal `[Sumber N]` labels for.

## 4. AI providers and models

| Purpose | Provider | Model(s) | Notes |
|---|---|---|---|
| Query rewriting | Google Gemini | `gemini-2.5-flash` (hardcoded `LLM_MODEL`, [rag_service.py:30](../../backend/rag_service.py#L30)) | No fallback model list for this call specifically |
| Embeddings | Voyage AI | `voyage-law-2`, 1024-dim ([rag_service.py:28-29](../../backend/rag_service.py#L28-L29)) | Same model used for both query embedding and document embedding (asymmetric `input_type="query"` vs `"document"`, correctly differentiated at [rag_service.py:197](../../backend/rag_service.py#L197) and [doc_processing.py:281](../../backend/services/doc_processing.py#L281)) |
| Main answer generation (agentic) | Google Gemini | Tries `gemini-2.5-flash` → `gemini-2.0-flash` → `gemini-2.0-flash-lite` in order, with up to 2 retries across the whole model list on 429/503/`UNAVAILABLE` ([AVAILABLE_MODELS, rag_service.py:393](../../backend/rag_service.py#L393), retry loop at [rag_service.py:401-426](../../backend/rag_service.py#L401-L426)) | The only call site with real fallback/retry logic |
| Session auto-title | Google Gemini | `gemini-2.5-flash` only, no fallback ([chatbot.py:93-99](../../backend/routers/chatbot.py#L93-L99)) | Best-effort — failure is caught and logged as a warning, doesn't affect the main response |
| Admin PDF metadata extraction (ingestion, not chat) | Google Gemini | `gemini-2.5-flash` → `gemini-2.0-flash` → `""` (empty string, likely a bug — see §6) ([doc_processing.py:206](../../backend/services/doc_processing.py#L206)) | Part of the knowledge-base ingestion pipeline, not the live chat path, but shares the same Gemini account/quota |

## 5. API key supply

- **Gemini**: `genai.Client(api_key=settings.google_api_key)` — reads `GOOGLE_API_KEY` through the app's `Settings`/`get_settings()` layer ([rag_service.py:147-149](../../backend/rag_service.py#L147-L149)). Consistent pattern.
- **Voyage AI**: `voyageai.Client()` — called with **no arguments** in both `rag_service.py:144` and `services/doc_processing.py:291`, so the Voyage SDK reads `VOYAGE_API_KEY` directly from the OS environment rather than through `settings.voyage_api_key`. This works today (both end up reading the same env var) but is an inconsistent pattern vs. every other provider client in the codebase — flagged in `03-technical-debt.md` (S2).
- Both keys come from the single shared `.env` / Railway environment — there is no separate "chatbot" credential scope, key rotation mechanism, or per-feature API key found in the codebase.

## 6. Response parsing and the agentic tool loop

`agentic_generate()` ([rag_service.py:364-484](../../backend/rag_service.py#L364-L484)) drives up to `MAX_TOOL_LOOP = 3` ([rag_service.py:34](../../backend/rag_service.py#L34)) rounds:

1. Call Gemini with the `search_consultants` tool declared ([CONSULTANT_TOOL, rag_service.py:103-138](../../backend/rag_service.py#L103-L138) — parameters `kategori` (required enum of 6 legal categories) and `max_budget` (optional int)).
2. If the response has no `function_calls`, break out and use `response.text` as the final answer.
3. If Gemini requests `search_consultants`, execute it via `_execute_tool()` ([rag_service.py:254-275](../../backend/rag_service.py#L254-L275)), which calls the Supabase RPC `search_consultants_by_category` — **the only "search" the model can perform; it cannot call the pasal-retrieval RPC directly** (that already happened once, up front, before the agentic loop starts).
4. The tool result is fed back to Gemini as a `FunctionResponse` content block ([rag_service.py:452-463](../../backend/rag_service.py#L452-L463)), and the loop continues so Gemini can compose a natural-language answer around the returned consultant list.
5. If the loop exhausts all 3 iterations without Gemini producing a final text-only turn, it logs a warning and falls through using whatever `response` was last set ([rag_service.py:464-466](../../backend/rag_service.py#L464-L466)).

The **type** of the final response (`"text"` vs `"consultant_list"`) is decided purely by whether `_execute_tool` was ever called with `search_consultants` during the loop ([rag_service.py:477-484](../../backend/rag_service.py#L477-L484)) — not by inspecting the final Gemini output text.

`chatbot_triage()` then wraps `result["jawaban"]` and structured metadata into the `TriageResponse` and, separately, persists an abbreviated `ai_metadata` dict (`type`, `pasal_referensi`, `disclaimer`, and `consultants` only if applicable) alongside the raw answer text in `chat_messages.metadata` ([chatbot.py:341-355](../../backend/routers/chatbot.py#L341-L355)).

## 7. Data persistence, retention, and PII

| What | Where | Detail |
|---|---|---|
| Every user question | `chat_messages.content`, `role="user"` | Full raw text of what the user typed, indefinitely retained — no TTL, no anonymization, no confirmed cascade-delete guarantee (see `02-schema-and-api.md`, `chat_messages` FK note). |
| Every AI answer | `chat_messages.content`, `role="ai"`, plus `metadata` jsonb (type, cited pasal, disclaimer, and — for consultant recommendations — the **full consultant list returned by the tool**, including `id_konsultan`, name, specialization, rate, etc.) | Same retention profile as above. |
| Session titles | `chat_sessions.title` | Auto-generated from the **first user message**, via a third-party LLM call — meaning a snippet of what may be sensitive legal/personal content becomes the session's list-view label, visible in the session sidebar. |
| Deletion | `DELETE /chatbot/sessions/{id}` ([chatbot.py:184-208](../../backend/routers/chatbot.py#L184-L208)) | Deletes the `chat_sessions` row and (per the docstring) relies on the DB to cascade-delete `chat_messages`. **Whether a real `ON DELETE CASCADE` FK exists cannot be confirmed from this repo** — if it doesn't, deleted "sessions" would leave orphaned message rows still containing the user's content in the DB, contradicting the deletion. This is worth verifying directly against the Supabase schema before telling users their chat is deleted. |
| PII/retention policy | — | **No retention policy, TTL, or anonymization job was found anywhere in the codebase.** Given the domain (users describe potentially sensitive legal situations — the system prompt explicitly anticipates topics like domestic violence and sexual assault, [rag_service.py:48-50](../../backend/rag_service.py#L48-L50)), this is a real gap if the product/legal team hasn't already addressed it outside the code (**unclear from codebase** whether a policy exists at the infra/Supabase-RLS level — worth explicitly confirming, not assuming absence). |

## 8. Error and timeout handling

- **Model-level retry**: only the main `agentic_generate` call has retry/fallback logic (model list + up to 2 retries with `2*(retry+1)`-second backoff, [rag_service.py:401-426](../../backend/rag_service.py#L401-L426)). The query-rewrite and auto-title Gemini calls have **no retry** — a single transient failure just falls back to using the raw query (rewrite) or skips the title (auto-title), both handled gracefully via `try/except`.
- **No explicit per-call timeout** was found configured on the `google-genai` or `voyageai` client calls anywhere in `rag_service.py` — both SDKs' own default timeouts apply, which are **not documented in this repo** (unclear from codebase; would need to check each SDK's defaults).
- **Pipeline-level error handling**: `triage()` wraps its whole body in `try/except`, tagging the failing stage via a `current_step` string (`rewrite`/`embed`/`retrieve`/`build_context`/`agentic_generate`) and re-raising as a `RuntimeError` with that context ([rag_service.py:504-557](../../backend/rag_service.py#L504-L557)) — a genuinely good diagnostic pattern, and it's mirrored again one layer up in `chatbot_triage()` with its own `current_step` tracker ([chatbot.py:290-389](../../backend/routers/chatbot.py#L290-L389)).
- **User-facing degradation**: `chatbot_triage()` specifically catches quota/availability errors (`"429"`, `"503"`, `"UNAVAILABLE"`, `"RESOURCE_EXHAUSTED"` substrings in the exception string) and returns a friendly Indonesian message asking the user to wait ~30 seconds, as a `200`-style `TriageResponse` with `type="error"` rather than propagating an HTTP error status ([chatbot.py:373-382](../../backend/routers/chatbot.py#L373-L382)). All other exceptions surface as a genuine HTTP 500 with truncated exception detail in the body (see E3 in `03-technical-debt.md` for the info-disclosure angle).
- **Timeout on the outer HTTP request**: no request-level timeout was found configured for the FastAPI endpoint itself; if Gemini/Voyage hang, the request would hang until the underlying SDK's own timeout (if any) fires or the client/proxy gives up.

## 9. Rate limiting and cost controls

- **Rate limiting**: `3/minute` per IP on `/chatbot/triage` only ([chatbot.py:272](../../backend/routers/chatbot.py#L272)). No rate limit on the session CRUD endpoints (`/sessions`, `/sessions/{id}/messages`), though those don't call any AI provider so the cost exposure there is just DB load.
- **No per-user daily/monthly quota** was found — the only throttle is the per-minute IP-based limiter, which:
  - Is per-process/in-memory (see A7 in `03-technical-debt.md`) — multi-instance deployment would multiply the effective limit.
  - Is keyed by IP, not by authenticated user id, even though the endpoint already requires auth — two users behind the same NAT/office network share a quota, while a single user rotating IPs (or behind a rotating proxy) is not meaningfully throttled at all.
- **No token/spend budget, no per-request cost cap, no circuit breaker** tied to actual Gemini/Voyage billing was found anywhere in the backend. The only implicit cost control is the `MAX_TOOL_LOOP = 3` cap (bounds worst-case Gemini calls per user turn to 3) and the `<5 words → rewrite` heuristic that skips one Gemini call for longer queries.
- **PDF ingestion cost control** (adjacent system, `services/doc_processing.py`): does have real rate-limit handling — `generate_embeddings()` batches text and sleeps `BATCH_DELAY_SECONDS = 21.0` between Voyage batches to respect "free tier: ~3 RPM" ([doc_processing.py:33](../../backend/services/doc_processing.py#L33)), and `_embed_batch_with_retry` uses `tenacity` exponential backoff on 429s ([doc_processing.py:273-286](../../backend/services/doc_processing.py#L273-L286)). This is markedly more defensive than the live chat path, presumably because ingestion runs unattended in a background task and a stalled/failed batch is more costly to redo.

**Bottom line on this section: rate limiting exists but is coarse (IP-based, single endpoint) and there is no cost/budget control at all tied to the three paid external APIs (Gemini, Voyage, and indirectly Brevo for notification emails triggered by chat-adjacent flows). This should be treated as an open risk, not an oversight that's "probably fine" — a scripted loop hitting `/chatbot/triage` from a rotating IP pool could run up API costs with no backend circuit breaker.**

## 10. Things that would block extending this feature

1. **No tests for the pipeline logic itself** (`rag_service.py`, `services/doc_processing.py` — see T1/T2 in `03-technical-debt.md`). Any change to prompt construction, the tool loop, or truncation logic has no automated regression check; `test_chatbot.py` only verifies the HTTP layer around a mocked `triage()`.
2. **In-memory ingestion job store**: `admin_docs.py`'s `_jobs: dict[str, dict] = {}` module-level dict ([admin_docs.py:46](../../backend/routers/admin_docs.py#L46)) tracks PDF-upload background job status. This is lost on process restart and not shared across multiple worker processes/instances — polling `/admin/documents/jobs/{job_id}` from a different worker than the one that started the job would return 404. Any change that scales the backend horizontally (more than one uvicorn worker/instance) needs this moved to the DB or a shared cache (Redis) first.
3. **Hardcoded model list and category enum**: `AVAILABLE_MODELS` ([rag_service.py:393](../../backend/rag_service.py#L393)) and the `search_consultants` tool's `kategori` enum (6 hardcoded values, [rag_service.py:117-124](../../backend/rag_service.py#L117-L124)) are Python literals, not sourced from `schemas/admin_docs.py`'s much larger 18-value `KategoriHukum` enum used for the knowledge base itself. Adding a new legal category to the knowledge base ingestion side would **not** automatically make it reachable via the chatbot's consultant-search tool — the two enums would need to be kept in sync manually.
4. **No separation between the "chat" system prompt and the "ingestion" AI-metadata-extraction prompt** in terms of provider/quota isolation — both share the same `GOOGLE_API_KEY`/Gemini account with no visible per-feature quota split, so a large PDF ingestion batch running in the background could compete for the same rate limit as live user chat traffic.
5. **No confirmed pgvector/RPC contract test**: `match_dokumen_hukum` and `search_consultants_by_category` are Postgres functions that live only in Supabase, not in this repo (see `02-schema-and-api.md`). Any change to their signature or return shape on the Supabase side would silently break `rag_service.py` with no compile-time or CI signal — recommend exporting their SQL definitions into this repo as a first step before further chatbot work.
6. **Naming/persona inconsistency** ("Kia" in the system prompt vs. "Visi" in the UI, noted at the top of this document) should be resolved before writing user-facing documentation or marketing copy referencing the assistant's name.

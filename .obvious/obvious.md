# Scout — obvious.md

**Scout** is an intelligent code review system: a FastAPI backend that reviews code
diffs with a local LLM (Ollama / llama3.1:8b), stores suggestions and feedback in a
ChromaDB vector store, and learns from accept/reject feedback. A static frontend
(plain HTML/JS/CSS) is served by the same backend.

## Stack

- **Backend:** Python 3.8+ (verified on 3.13), FastAPI + Uvicorn
- **LLM:** Ollama 0.34.4 with `llama3.1:8b` (4.9 GB, runs on CPU in this sandbox)
- **Vector store:** ChromaDB (embedded, on disk at `./chroma_db` — no external DB)
- **Frontend:** static HTML/JS/CSS served by FastAPI (no build step)
- **Package manager:** pip (`requirements.txt`); venv at `.venv/`
- **No Docker/Compose/Makefile; no test suite or linter configured**

## Commands

```bash
# Dependencies
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt

# Ollama LLM (required before starting the app for reviews to work)
ollama serve &                 # API on 127.0.0.1:11434
ollama pull llama3.1:8b        # ~4.9 GB, one-time

# Start the dev server (canonical entrypoint; port 8000, binds 0.0.0.0)
.venv/bin/python run.py

# Quick health check
curl -s http://localhost:8000/api/stats
```

Config lives in `.env` (copy from `env.example`; both names are referenced in docs —
QUICKSTART uses `env.example`, README says `.env.example`). Defaults work locally;
`GITHUB_TOKEN` is optional (only needed for the GitHub PR review source).

## Codebase map

| Path | Purpose |
|---|---|
| `backend/main.py` | FastAPI app: routers, CORS, serves `frontend/` static files |
| `backend/api/` | Routers: `review.py`, `feedback.py`, `stats.py` (all under `/api`) |
| `backend/services/review_service.py` | LLM review generation (LangChain + Ollama) |
| `backend/services/vector_store.py` | ChromaDB: suggestions/reviews collections, feedback updates |
| `backend/services/feedback_service.py` | Accept/reject/edit processing |
| `backend/services/diff_parser.py` | Parses unified diffs (unidiff) |
| `backend/services/github_service.py` | GitHub PR fetching (PyGithub) |
| `backend/services/stats_service.py` | Learning statistics |
| `backend/models.py` | Pydantic models |
| `frontend/` | Static UI (`index.html`, `app.js`, `styles.css`) |
| `run.py` | Dev entrypoint (loads `.env`, starts Uvicorn with reload) |

## Key API endpoints

- `POST /api/review` — body `{"source":"diff","content":"<diff>"}` or `{"source":"github","url":...}`; LLM review takes ~60–90 s on CPU
- `POST /api/feedback` — `{"review_id","suggestion_id","action":"accept|reject|edit"}` (optional `reason`)
- `GET /api/reviews`, `GET /api/stats`, `GET /docs` (OpenAPI UI)

## Local verification

1. `curl -s http://localhost:8000/` → serves the UI (HTTP 200); `/app.js`, `/styles.css`, `/docs` → 200
2. `POST /api/review` with a well-formed diff → 200 with LLM suggestions (~60–90 s)
3. `POST /api/feedback` accepting a suggestion → `{"success":true}`
4. `GET /api/stats` → `total_feedback` ≥ 1 with acceptance breakdown

**Validation Summary (2026-09-24):** all four steps passed on a fresh run.
Review `POST` 200 with real llama3.1:8b suggestions; feedback write persisted to
ChromaDB; stats returned `total_feedback: 1, acceptance_rate: 100`. Backend
`py_compile` clean. Two startup bugs were fixed during onboarding (see skills/local-dev).

## Sandbox snapshot

- **Snapshot ID:** `5rlz3k2imw09xmb6a403:default` (captured 2026-09-24T19:10:53Z)
- Contains: Python venv with dependencies installed, Ollama 0.34.4 + `llama3.1:8b`
  pulled, server running on port 8000, working local-dev setup for `Adjoshi06/scout`.

## Known quirks / TODO(confirm)

- App is bound to the port from `API_PORT` (default 8000) — parsed from startup output, not assumed.
- Diff content must be a *well-formed* unified diff (hunk header line counts must match body);
  malformed hunks return HTTP 500 `"Hunk is shorter than expected"`.
- `GET /api/stats` returns a different shape than the README documents (flat keys
  `accepts/rejects/edits` instead of nested counts).
- No tests, linter, or CI configured — nothing to run beyond the manual flow above.

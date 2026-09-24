---
name: local-dev
description: How to bring the Scout local dev stack up in the sandbox, with the fixes applied during onboarding
captured: 2026-09-24
---

# local-dev — Scout (FastAPI + Ollama + ChromaDB)

## Stack discovered during onboarding

- Python (repo says 3.8+; sandbox verified on 3.13.14), pip, venv at `.venv/`
- FastAPI + Uvicorn, LangChain, ChromaDB (embedded, `./chroma_db`), unidiff, PyGithub
- Ollama 0.34.4 with `llama3.1:8b` (4.9 GB) — the only external runtime service
- No Docker/Compose/Makefile, no DB migrations, no test suite or linter

## Steps that produced a healthy stack (2026-09-24)

1. `python3 -m venv .venv && .venv/bin/pip install -r requirements.txt`
2. Install Ollama: needs `zstd` first (`sudo apt-get install -y zstd`, then
   `curl -fsSL https://ollama.com/install.sh | sh`). Verify with
   `curl -s http://127.0.0.1:11434/api/version` (start `ollama serve` if absent).
3. `ollama pull llama3.1:8b` (~4.9 GB; finished in <2 min in this sandbox)
4. `cp env.example .env` — defaults work; `GITHUB_TOKEN` optional (only for the
   GitHub PR review source; no secret was required for local verification)
5. `.venv/bin/python run.py` → server on port **8000** (from `API_PORT`, default 8000;
   parse the banner "Starting Code Review Agent on port 8000...", don't assume)

## Startup bugs fixed during onboarding (needed for the app to boot / learn)

1. **`backend/services/feedback_service.py:4`** — `from services.vector_store import
   VectorStore` → must be `from backend.services.vector_store import VectorStore`.
   The bad path crashes app startup with `ModuleNotFoundError: No module named 'services'`.
2. **`backend/services/vector_store.py` `store_feedback()`** — ChromaDB (current
   versions) rejects a multi-key plain-dict `where` clause. Changed to
   `where={"$and": [{"review_id": ...}, {"suggestion_id": ...}]}`. Without this, the
   feedback write silently failed (caught exception) and the learning loop never persisted.

Both fixes ship in the onboarding PR — without them `run.py` cannot start and
feedback never stores, so any future re-setup must keep them.

## Verified primary flow (evidence)

- `POST /api/review` `{"source":"diff","content":<well-formed diff>}` → 200 in ~60–90 s
  (CPU llama3.1:8b) with real suggestions and a `review_id`
- `POST /api/feedback` accept on a suggestion → `{"success":true}`
- `GET /api/stats` → `total_feedback: 1, acceptance_rate: 100`, category/confidence
  breakdown populated — learning loop confirmed persisted
- `GET /`, `/app.js`, `/styles.css`, `/docs` all HTTP 200; `py_compile` clean on all modules

## Gotchas

- Diffs must be well-formed: hunk header counts (`@@ -x,y +a,b @@`) must match the
  body, or the API returns 500 `"Hunk is shorter than expected"` (unidiff parser).
- LLM review is slow on CPU — run the request detached (tmux) and poll.
- ChromaDB downloads its embedding model (`all-MiniLM-L6-v2`, 79 MB) on first
  review; cached at `~/.cache/chroma/`.
- `env.example` is the actual tracked template name (README references
  `.env.example`, which does not exist) — both point to the same content.
- `.env` and `chroma_db/` are gitignored — regenerate or re-pull as needed.

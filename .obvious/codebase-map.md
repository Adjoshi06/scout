# Codebase Map — scout

Depth-2 overview. Small single-app repo (no sub-apps); also inlined in `obvious.md`.

| Path | Purpose | Key files |
|---|---|---|
| `backend/` | FastAPI application (all server logic) | `main.py`, `models.py` |
| `backend/api/` | HTTP routers mounted under `/api` | `review.py`, `feedback.py`, `stats.py` |
| `backend/services/` | Core services: LLM review, ChromaDB storage, feedback loop, diff parsing, GitHub fetch, stats | `review_service.py`, `vector_store.py`, `feedback_service.py`, `diff_parser.py`, `github_service.py`, `stats_service.py` |
| `frontend/` | Static UI served by the backend (no build step) | `index.html`, `app.js`, `styles.css` |
| `.obvious/` | Agent contract (this onboarding) | `obvious.md`, `config.yml`, `skills/local-dev/SKILL.md` |
| root | Entry point, deps, env template, docs | `run.py`, `requirements.txt`, `env.example`, `README.md`, `QUICKSTART.md` |

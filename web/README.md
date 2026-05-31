# Web UI (local-first)

Graphical interface for translating SRT subtitles. **Local mode** uses [Ollama](https://ollama.com/) on your machine by default; optional **Cloud API** mode uses OpenAI.

## Prerequisites

- Node.js **20+**
- [Ollama](https://ollama.com/) running locally (`ollama serve`)
- At least one model installed, e.g. `ollama pull gemma4` (default preference: `gemma4:latest`)

## Quick start

From the **repository root**:

```bash
npm install
npm run web:install
npm run web:dev
```

Open **http://localhost:3000** (no `/chatgpt-subtitle-translator` path in local builds).

If styles look broken after a refresh, stop the dev server, run `rm -rf .next`, and start again (`npm run dev`). Do not use `output: export` during development — local `npm run build` sets `NEXT_STATIC_EXPORT=1` only for the static `out/` folder.

### Production build (static files)

```bash
npm run web:build
npm run web:serve
```

Again open **http://localhost:3000**.

## Scripts

| Command (root) | Command (`web/`) | Purpose |
|----------------|------------------|---------|
| `npm run web:dev` | `npm run dev` | Development server |
| `npm run web:build` | `npm run build` | Static export to `web/out/` |
| `npm run web:serve` | `npm run serve` | Serve `web/out/` on port 3000 |
| — | `npm run build:pages` | Build for GitHub Pages (`/chatgpt-subtitle-translator` base path) |

## Local-first behavior

- **Default provider:** Ollama at `http://localhost:11434/v1`
- **Models:** Loaded from `GET http://localhost:11434/api/tags` (Refresh to reload)
- **Default model:** `gemma4:latest` if installed; otherwise the first model in Ollama’s list
- **Validation:** Only installed models appear in the dropdown; Start is disabled until a valid model is selected
- **Cloud API:** Toggle “Cloud API (OpenAI)” to use your API key and a cloud model name

## GitHub Pages build

```bash
cd web && npm run build:pages && npm run serve:pages
```

Published site: https://cerlancism.github.io/chatgpt-subtitle-translator

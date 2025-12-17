# Claude Context & Guidelines

This document provides context for AI assistants working on the `himmah-downloader` project.

## Project Context
**LPM HIMMAH Digital Archive** is a web-based viewing platform for historical student press publications. 
- **Goal**: digitize and display magazines/bulletins from 1967-present.
- **Style**: Modern, premium "Newspaper" aesthetic.

## Architecture Guidelines

### 1. Frontend (Vanilla)
- **No Frameworks**: We use pure HTML/CSS/JS. No React/Vue/Svelte.
- **CSS**: Located in `index.css`. Uses CSS variables (root) for theming.
  - Colors: Red (`#C41E3A`) and White palette.
  - dark mode is NOT currently implemented but structure allows it.
- **JS**: `app.js` handles everything.
  - `loadPublications()`: Fetches JSON data.
  - `renderPublications()`: DOM manipulation for the grid.
  - `initPDFReader()`: PDF.js integration.

### 2. Data & Assets
- **Database**: `data/publications.json`. Flat JSON file.
  - Schema: `{ id, title, category, year, pages, issuu_url, pdf_file }`.
- **Storage**: Cloudflare R2 bucket `himmah-pdfs`.
  - PDFs -> `R2_ROOT/{id}.pdf`
  - Thumbnails -> `R2_ROOT/thumbnails/{id}.jpg`
- **Why R2?**: PDFs are too large for GitHub repo size limits.

### 3. Tooling (Python)
Scripts in `tools/` maintain the dataset.
- Always use `sync_all_publications.py` to update the JSON listing when new files are added.
- `generate_thumbnails.py` requires `poppler`.

### 4. Git Rules
- **DO NOT COMMIT**:
  - `pdfs/` (Large binary files)
  - `thumbnails/` (Large binary files)
  - `.wrangler/` (Local state)
  - `node_modules/`
- **ALWAYS COMMIT**:
  - `data/publications.json` (Source of truth for frontend)
  - Source code (`html`, `css`, `js`, `py`)

## Common Tasks

### Adding a new magazine
1. Download PDF to `pdfs/`.
2. Run `python3 tools/sync_all_publications.py`.
3. Run `python3 tools/generate_thumbnails.py`.
4. Upload PDF + Thumbnail to R2.
5. Commit `data/publications.json`.

### Deploying
- Run `npx wrangler pages deploy dist`.
- Ensure `dist/` contains all static assets (but exclude large PDFs).

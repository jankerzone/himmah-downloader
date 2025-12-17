# LPM HIMMAH - Digital Archive (Arsip Digital)

A modern, digital archive platform for **LPM HIMMAH UII** (Universitas Islam Indonesia), preserving student press history since 1967. This project serves as a digital library for magazines (`MUHIBBAH`, `HIMMAH`) and bulletins (`KOBARKobari`).

## 🚀 Features

- **Digital Archive**: Access to 50+ publications spanning decades.
- **Interactive Reader**: Custom paper-style PDF reader built with PDF.js.
- **Search & Filter**: Real-time filtering by category and search by title/year.
- **Responsive Design**: Mobile-friendly "newspaper" aesthetic using CSS variables and modern layout.
- **Cloud Infrastructure**: Cloudflare Pages for hosting, R2 for PDF/thumbnail storage.

## 🛠 Tech Stack

- **Frontend**: Vanilla HTML5, CSS3 (Glassmorphism, Grid/Flexbox), JavaScript (ES6+).
- **PDF Engine**: [PDF.js](https://mozilla.github.io/pdf.js/) for rendering.
- **Backend/Storage**: 
  - **Cloudflare Pages**: Static site hosting.
  - **Cloudflare R2**: Object storage for large PDF files and thumbnails.
- **Tools (Python)**:
  - `issuu_downloader.py`: Scrapes and downloads publications from Issuu.
  - `generate_thumbnails.py`: Generates JPEG thumbnails from PDF covers.
  - `sync_all_publications.py`: Syncs downloaded PDFs to `publications.json`.

## 📂 Project Structure

```
himmah-downloader/
├── app.js                  # Main frontend logic (Reader, Search, UI)
├── index.css               # Global styles & variables
├── index.html              # Main entry point
├── data/
│   └── publications.json   # Metadata database for all publications
├── pdfs/                   # (Local only) Downloaded PDF files
├── thumbnails/             # (Local only) Generated thumbnails
├── tools/                  # Python utility scripts
│   ├── generate_thumbnails.py
│   ├── issuu_downloader.py
│   ├── sync_all_publications.py
│   └── update_publications.py
└── wrangler.toml           # Cloudflare deployment config
```

## ⚡️ Setup & Usage

### Prerequisites
- Python 3.9+
- Node.js (for Wrangler)
- `poppler` (for thumbnail generation: `brew install poppler`)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/jankerzone/himmah-downloader.git
   cd himmah-downloader
   ```

2. **Run locally using Wrangler**
   ```bash
   npx wrangler pages dev .
   ```

### Managing Data

1. **Download Publications** (Optional - if fetching new data)
   ```bash
   python3 tools/issuu_downloader.py
   ```

2. **Sync Database**
   Refreshes `publications.json` based on downloaded PDFs.
   ```bash
   python3 tools/sync_all_publications.py
   ```

3. **Generate Thumbnails**
   Creates cover images for the UI.
   ```bash
   python3 tools/generate_thumbnails.py
   ```

### 🚀 Deployment

The project is configured for **Cloudflare Pages**.

1. **Upload Assets to R2** (PDFs & Thumbnails)
   Use the Wrangler CLI helper or dashboard.
   ```bash
   # Example upload loop
   for f in thumbnails/*.jpg; do npx wrangler r2 object put "himmah-pdfs/thumbnails/$(basename "$f")" --file "$f" --remote; done
   ```

2. **Deploy Site**
   ```bash
   npx wrangler pages deploy dist --project-name himmah-arsip
   ```

## 📄 License
Internal use for LPM HIMMAH UII.

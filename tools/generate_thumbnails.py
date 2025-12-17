#!/usr/bin/env python3
"""
Generate thumbnail images from PDF files.
Requires: pip install pdf2image Pillow
Also requires poppler: brew install poppler (macOS)
"""

import os
import json
from pathlib import Path

try:
    from pdf2image import convert_from_path
    from PIL import Image
except ImportError:
    print("Please install required packages:")
    print("  pip install pdf2image Pillow")
    print("  brew install poppler  # macOS")
    exit(1)

# Configuration
PDF_DIR = Path(__file__).parent.parent / "pdfs"
THUMB_DIR = Path(__file__).parent.parent / "thumbnails"
DATA_FILE = Path(__file__).parent.parent / "data" / "publications.json"
THUMB_WIDTH = 400  # pixels
JPEG_QUALITY = 85

def generate_thumbnails():
    """Generate thumbnails for all PDFs."""

    # Create thumbnails directory
    THUMB_DIR.mkdir(exist_ok=True)

    # Load publications data
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        publications = json.load(f)

    # Get list of PDF files
    pdf_files = list(PDF_DIR.glob("*.pdf"))
    print(f"Found {len(pdf_files)} PDF files")

    generated = 0
    skipped = 0
    failed = 0

    for pdf_path in pdf_files:
        pub_id = pdf_path.stem
        thumb_path = THUMB_DIR / f"{pub_id}.jpg"

        # Skip if thumbnail already exists
        if thumb_path.exists():
            print(f"  [SKIP] {pub_id} - thumbnail exists")
            skipped += 1
            continue

        try:
            print(f"  [GEN] {pub_id}...", end=" ", flush=True)

            # Convert first page of PDF to image
            images = convert_from_path(
                pdf_path,
                first_page=1,
                last_page=1,
                dpi=72  # Lower DPI for thumbnails
            )

            if images:
                img = images[0]

                # Calculate new height maintaining aspect ratio
                aspect_ratio = img.height / img.width
                new_height = int(THUMB_WIDTH * aspect_ratio)

                # Resize image
                img_resized = img.resize(
                    (THUMB_WIDTH, new_height),
                    Image.Resampling.LANCZOS
                )

                # Convert to RGB (in case of RGBA)
                if img_resized.mode != 'RGB':
                    img_resized = img_resized.convert('RGB')

                # Save as JPEG
                img_resized.save(thumb_path, 'JPEG', quality=JPEG_QUALITY, optimize=True)

                file_size = thumb_path.stat().st_size / 1024
                print(f"OK ({file_size:.1f} KB)")
                generated += 1
            else:
                print("FAILED (no pages)")
                failed += 1

        except Exception as e:
            print(f"FAILED ({e})")
            failed += 1

    print(f"\nDone! Generated: {generated}, Skipped: {skipped}, Failed: {failed}")
    print(f"Thumbnails saved to: {THUMB_DIR}")

    # List generated thumbnails
    thumbs = list(THUMB_DIR.glob("*.jpg"))
    total_size = sum(t.stat().st_size for t in thumbs) / (1024 * 1024)
    print(f"Total thumbnails: {len(thumbs)} ({total_size:.2f} MB)")

    print("\nNext steps:")
    print("1. Upload thumbnails folder to R2:")
    print("   npx wrangler r2 object put himmah-pdfs/thumbnails/ --file thumbnails/*.jpg")
    print("   OR use Cloudflare Dashboard to upload the thumbnails folder")
    print("2. The app will automatically use them!")

if __name__ == "__main__":
    generate_thumbnails()

#!/usr/bin/env python3
"""
Sync all downloaded PDFs from download_results.json to publications.json
"""

import json
import os
import re
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
DOWNLOAD_RESULTS = BASE_DIR / "pdfs" / "download_results.json"
PUBLICATIONS_FILE = BASE_DIR / "data" / "publications.json"

def parse_title(title):
    """Extract category and year from title."""
    # Determine category
    if 'MUHIBBAH' in title.upper():
        category = 'muhibbah'
    elif 'KOBARKobari' in title or 'KOBAR' in title:
        category = 'kobarkobari'
    else:
        category = 'himmah'
    
    # Extract year
    year_match = re.search(r'(\d{4})', title)
    year = int(year_match.group(1)) if year_match else 2000
    
    return category, year

def main():
    # Load download results
    with open(DOWNLOAD_RESULTS, 'r', encoding='utf-8') as f:
        results = json.load(f)
    
    # Build new publications list
    publications = []
    for item in results.get('downloaded', []):
        title = item['title']
        abs_path = item['path']
        filename = os.path.basename(abs_path)
        pub_id = os.path.splitext(filename)[0]
        
        category, year = parse_title(title)
        
        pub = {
            'id': pub_id,
            'title': title,
            'category': category,
            'year': year,
            'pages': 20,
            'issuu_url': f'https://issuu.com/lpmhimmahuii/docs/{pub_id}',
            'pdf_file': f'./pdfs/{filename}'
        }
        publications.append(pub)
    
    # Sort by year descending, then title
    publications.sort(key=lambda x: (-x['year'], x['title']))
    
    # Save
    with open(PUBLICATIONS_FILE, 'w', encoding='utf-8') as f:
        json.dump(publications, f, indent=4, ensure_ascii=False)
    
    # Summary
    muhibbah = sum(1 for p in publications if p['category'] == 'muhibbah')
    himmah = sum(1 for p in publications if p['category'] == 'himmah')
    kobarkobari = sum(1 for p in publications if p['category'] == 'kobarkobari')
    
    print(f"✅ Generated {len(publications)} publication entries")
    print(f"   - MUHIBBAH: {muhibbah}")
    print(f"   - HIMMAH: {himmah}")
    print(f"   - KOBARKobari: {kobarkobari}")
    print(f"\nSaved to: {PUBLICATIONS_FILE}")

if __name__ == "__main__":
    main()

import json
import os

def update_publications():
    # Load publications
    with open('data/publications.json', 'r') as f:
        pubs = json.load(f)
    
    # Load download results
    with open('pdfs/download_results.json', 'r') as f:
        results = json.load(f)
    
    # Create lookup map from results (title -> path)
    downloaded_map = {item['title']: item['path'] for item in results.get('downloaded', [])}
    
    updated_count = 0
    
    for pub in pubs:
        title = pub['title']
        if title in downloaded_map:
            # key found, update pdf_file
            abs_path = downloaded_map[title]
            # Convert abs_path to relative path "./pdfs/filename.pdf"
            filename = os.path.basename(abs_path)
            pub['pdf_file'] = f'./pdfs/{filename}'
            updated_count += 1
            print(f"Updated: {title} -> ./pdfs/{filename}")
        else:
            print(f"Not found in downloads: {title}")
            
    # Save back
    with open('data/publications.json', 'w') as f:
        json.dump(pubs, f, indent=4)
        
    print(f"\nTotal updated: {updated_count}/{len(pubs)}")

if __name__ == "__main__":
    update_publications()

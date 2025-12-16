#!/usr/bin/env python3
"""
LPM HIMMAH - Issuu Publication Downloader v3
=============================================
A safe, transparent tool to download publications from Issuu.
Uses Issuu's reader3 API to get page images and creates PDFs.

Author: Created for LPM HIMMAH UII
License: MIT
"""

import os
import sys
import json
import re
import time
import argparse
from urllib.parse import urlparse
from pathlib import Path

try:
    import requests
    from PIL import Image
    import img2pdf
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Please run: pip install -r requirements.txt")
    sys.exit(1)


class IssuuDownloader:
    """Download publications from Issuu and convert to PDF."""
    
    # Known publication URLs from LPM HIMMAH profile
    LPMHIMMAH_PUBLICATIONS = [
        {"title": "Majalah MUHIBBAH No. 01/Thn. XV/1981 – Reuni NU", "url": "https://issuu.com/lpmhimmahuii/docs/majalah_muhibbah_no._1_th._ke_xv_1981_reuni_nu"},
        {"title": "Majalah MUHIBBAH No. 02/Thn. XV/1981 – Mahasiswa Bicara Indonesia", "url": "https://issuu.com/lpmhimmahuii/docs/majalah_muhibbah_no._2_th._ke_xv_1981"},
        {"title": "Majalah MUHIBBAH No. 04/Thn. XVI/1982 – BBM Naik", "url": "https://issuu.com/lpmhimmahuii/docs/majalah_muhibbah_no._4_th._ke_xvi_1982_bbm_naik"},
        {"title": "Majalah MUHIBBAH No. 07/Thn. IX/1975 - Egoisme Bicara dan Kerja", "url": "https://issuu.com/lpmhimmahuii/docs/majalah_muhibbah_no._7_th._ke_ix_1974_egoisme_bi"},
        {"title": "Majalah MUHIBBAH No. 04/Thn. V/1971 - Pembaharuan Administrasi", "url": "https://issuu.com/lpmhimmahuii/docs/muhibbah_4_1971"},
        {"title": "Majalah HIMMAH No. 01/Thn. XXXIV/2002 - Di Bawah Bendera Globalisasi", "url": "https://issuu.com/lpmhimmahuii/docs/majalah_himmah_edisi_01xxxiv2002_-_di_bawah_bender"},
        {"title": "Majalah HIMMAH No. 03/Thn. XXXV/2003 - Balada Utang Kita", "url": "https://issuu.com/lpmhimmahuii/docs/majalah_himmah_edisi_03_thn._xxxv_2003_-_balada_ut"},
        {"title": "Majalah HIMMAH No. 01/Thn. XXXVII/2004 - Air Mengalir Makin Menjauh", "url": "https://issuu.com/lpmhimmahuii/docs/majalah_himmah_edisi_01_thn._xxxvii_2004_-_air_men"},
        {"title": "Majalah HIMMAH No. 02/Thn. XLVI/2013 - Mega Proyek Terlantar", "url": "https://issuu.com/lpmhimmahuii/docs/majalah_himmah_edisi_02_thn._xlvi_2013_-_mega_proy"},
        {"title": "Majalah HIMMAH No. 02/Thn. XXXIV/2002 - Antara Kuasa dan Kemuliaan", "url": "https://issuu.com/lpmhimmahuii/docs/majalah_himmah_edisi_02_thn._xxxiv_2002_-_antara_k"},
        {"title": "Majalah HIMMAH No. 02/Thn. XXXVII/2005 - Jagad Mal Jogja", "url": "https://issuu.com/lpmhimmahuii/docs/jagad_maal"},
        {"title": "Buletin KOBARKobari Edisi PEKTA/XV/September 2014 - Imbas Regulasi Dikti", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_pekta_tahun_ke-15_september_2014_-_imbas_r"},
        {"title": "Buletin KOBARKobari Edisi PESTA/XV/September 2014 - Berjejalan di Kampus Perjuangan", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_pesta_tahun_ke-15_september_2014_-_berjeja"},
        {"title": "Buletin KOBARKobari Edisi 137/XII/Agustus 2009 - Pintar pun Bergulir", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_137_tahun_ke-12_agustus_2009_-_pintar_pu"},
        {"title": "Buletin KOBARKobari Edisi 145/XIII/Oktober 2010 - Ketika Pers Mahasiswa Tidak Lagi Bebas", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_145_tahun_ke-13_oktober_2010_-_ketika_pe"},
        {"title": "Buletin KOBARKobari Edisi 147/XIV/Januari 2011 - Terlalu Banyak Jadi Tidak Maksimal", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_146_tahun_ke-14_januari_2011_-_terlalu_b"},
        {"title": "Buletin KOBARKobari Edisi 134/XII/Februari 2009 - PESTA yang Belum Usai", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_134_tahun_ke-12_februari_2009_-_pesta_"},
        {"title": "Buletin KOBARKobari Edisi 153/XIV/November 2011 - Janji DPM yang Dinantikan", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_153_tahun_ke-14_november_2011_-_janji_dp"},
        {"title": "Buletin KOBARKobari Edisi 152/XIV/Oktober 2011 - Kerjasama di Balik Atribut Pesta", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_152_tahun_ke-14_oktober_2011_-_kerjasama"},
        {"title": "Buletin KOBARKobari Edisi 141/XIII/April 2010 - ISO: Antara Gengsi dan Prestasi", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_141_tahun_ke-13_april_2010_-_iso_antara"},
        {"title": "Buletin KOBARKobari Edisi 148/XIV/Maret 2011 - Balada Arif Johar", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_148_tahun_ke-14_maret_2011_-_balada_arif"},
        {"title": "Buletin KOBARKobari Edisi 135/XII/Juli 2009 - Melirik Dana Hibah Penelitian", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_135_tahun_ke-12_juli_2009_-_melirik_dana"},
        {"title": "Buletin KOBARKobari Edisi 154/XIV/Desember 2011 - Terkatung-katungnya Penjual Kantin Psikologi", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_154_tahun_ke-14_desember_2011-_terkatung"},
        {"title": "Buletin KOBARKobari Edisi 144/XIII/Agustus 2010 - Aksi Sosial dan Demonstrasi Mewarnai Pesta 2010", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_144_tahun_ke-13_agustus_2010_-_aksi_sosi"},
        {"title": "Buletin KOBARKobari Edisi 149/XIV/Mei 2011 - Lunaskah Hutang Kita", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_149_tahun_ke-14_mei_2011_-_lunaskah_huta"},
        {"title": "Buletin KOBARKobari Edisi PESTA/XV/Agustus 2012 - PESTA (Masih) Dihiasi Masalah", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_pesta_tahun_ke-15_agustus_2012_-_pesta_"},
        {"title": "Buletin KOBARKobari Edisi 147/XIV/Februari 2011 - Menunggu Asa dari Prabuningrat", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_147_tahun_ke-14_februari_2011_-_menunggu"},
        {"title": "Buletin KOBARKobari Edisi Khusus/XIV/Juni 2012 - Gugatan KM UII", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_khusus_tahun_ke-14_juni_2012_-_gugatan_k"},
        {"title": "Buletin KOBARKobari Edisi 140/XIII/Januari 2010 - Pemilwa Sepi Pemilih", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_140_tahun_ke-13_januari_2010_-_pemilwa_s"},
        {"title": "Buletin KOBARKobari Edisi PEKTA/XVI/September 2013 - Organ Ekstra dan Intra Berkolega", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_pekta_tahun_ke-16_september_2013_-_organ"},
        {"title": "Buletin KOBARKobari Edisi PESTA/XIX/Agustus 2017 - Langkah Awal Menata Kepekaan Sosial", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_pesta_tahun_ke-19_agustus_2017_-_menata_ke"},
        {"title": "Buletin KOBARKobari Edisi 133/XI/Desember 2008 - Jalan Terjal Menuju Kampus Riset", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_133_tahun_ke-11_desember_2008_-_jalan_te"},
        {"title": "Buletin KOBARKobari Edisi 136/XII/Agustus 2009 - Dampak Mundurnya Pemilwa", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_136_tahun_ke-12_agustus_2009_-_dampak_mu"},
        {"title": "Buletin KOBARKobari Edisi PESTA/XIV/Agustus 2011 - Pesta di Bulan Suci", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_pesta_tahun_ke-14_agustus_2011_-_pesta_d"},
        {"title": "Buletin KOBARKobari Edisi PEKTA/XV/September 2012 - Baku Hantam Menyisakan Luka", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_pekta_tahun_ke-15_september_2012_-_baku_"},
        {"title": "Buletin KOBARKobari Edisi PESTA/XVIII/Agustus 2016 - Kenaikan Biaya Kuliah 10% Dianggap Kurang", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_pesta_tahun_ke-18_agustus_2016_-_kenaikan_"},
        {"title": "Buletin KOBARKobari Edisi 160/XIV/November 2012 - Di Balik Jadwal Kuliah Farmasi", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_160_tahun_ke-14_november_2012_-_di_balik"},
        {"title": "Buletin KOBARKobari Edisi 157/XIV/Mei 2012 - Rapor Merah DPM U", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_157_tahun_ke-14_mei_2012_-_rapor_merah_d"},
        {"title": "Buletin KOBARKobari Edisi 162/XV/Februari 2013 - Ambisi Jurnal Bersambut Aral", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_162_tahun_ke-15_februari_2013_-_ambisi_j"},
        {"title": "Buletin KOBARKobari Edisi 164/XV/Mei 2013 - Bakal Caleg Berguguran di Tangan KPU", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_164_tahun_ke-15_mei_2013_-_bakal_caleg_b"},
        {"title": "Buletin KOBARKobari Edisi 159/XIV/Oktober 2012 - Beda Janji, Beda Realisasi", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_159_tahun_ke-14_oktober_2012_-_beda_janj"},
        {"title": "Buletin KOBARKobari Edisi 166/XV/November 2013 - FE dan FH Bakal Pindah", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_166_tahun_ke-15_november_2013_-_fe_dan_f"},
        {"title": "Buletin KOBARKobari Edisi 163/XV/Maret 2013 - Pesantrenisasi UII", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_163_tahun_ke-15_maret_2013_-_pesantrenis"},
        {"title": "Buletin KOBARKobari Edisi 168/XV/Januari 2014 - Silang Pendapat Informasi SPP", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_168_tahun_ke-15_januari_2014_-_silang_pe"},
        {"title": "Buletin KOBARKobari Edisi 183/XIX/Maret 2017 - Kronik TGC-37", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_183_tahun_ke-19_maret_2017_-_kronik_tgc-37"},
        {"title": "Buletin KOBARKobari Edisi 184/XIX/Juni 2017 - Terkekang Izin Perkuliahan", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_184_tahun_ke-19_juni_2017_-_terkekang_izin"},
        {"title": "Buletin KOBARKobari Edisi 167/XV/Januari 2014 - Keamanan Ulil Albab Dipertanyakan", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_167_tahun_ke-15_januari_2014_-_keamanan_"},
        {"title": "Buletin KOBARKobari Edisi 180/XVII/Mei 2016 - Peringkat Anjlok, UII Jalankan Strategi Baru", "url": "https://issuu.com/lpmhimmahuii/docs/edisi_180_tahun_ke-15_mei_2016_-_peringkat_anjlo"},
    ]
    
    def __init__(self, output_dir="pdfs", verbose=True):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.verbose = verbose
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://issuu.com/'
        })
    
    def log(self, message, end='\n'):
        """Print message if verbose mode is enabled."""
        if self.verbose:
            print(message, end=end, flush=True)
    
    def get_publication_list(self, profile_url=None):
        """Get all publication URLs from LPM HIMMAH profile."""
        return self.LPMHIMMAH_PUBLICATIONS
    
    def parse_issuu_url(self, publication_url):
        """
        Parse Issuu URL to extract username and document slug.
        URL format: https://issuu.com/username/docs/document_slug
        """
        url_parts = urlparse(publication_url)
        path_parts = url_parts.path.strip('/').split('/')
        
        if len(path_parts) >= 3 and path_parts[1] == 'docs':
            return {
                'username': path_parts[0],
                'doc_slug': path_parts[2]
            }
        return None
    
    def get_reader_data(self, username, doc_slug):
        """
        Fetch document data from Issuu reader3 API.
        Returns document info including page image URLs.
        """
        api_url = f"https://reader3.isu.pub/{username}/{doc_slug}/reader3_4.json"
        
        try:
            self.log(f"  Fetching: {api_url}")
            response = self.session.get(api_url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 0 and 'document' in data:
                    return data['document']
            else:
                self.log(f"  API returned status: {response.status_code}")
        except Exception as e:
            self.log(f"  API error: {e}")
        
        return None
    
    def download_page_image(self, image_uri, page_num, temp_dir):
        """Download a single page image."""
        # Add https:// if missing
        if not image_uri.startswith('http'):
            image_uri = f"https://{image_uri}"
        
        try:
            response = self.session.get(image_uri, timeout=60)
            if response.status_code == 200 and len(response.content) > 1000:
                image_path = temp_dir / f"page_{page_num:04d}.jpg"
                with open(image_path, 'wb') as f:
                    f.write(response.content)
                return image_path
        except requests.RequestException as e:
            self.log(f"\n  Error downloading page {page_num}: {e}")
        
        return None
    
    def download_publication(self, publication_url, output_filename=None):
        """
        Download a complete publication and save as PDF.
        """
        # Parse URL
        url_info = self.parse_issuu_url(publication_url)
        if not url_info:
            self.log("Could not parse Issuu URL")
            return None
        
        username = url_info['username']
        doc_slug = url_info['doc_slug']
        
        self.log(f"\nDownloading: {doc_slug}")
        self.log(f"URL: {publication_url}")
        
        # Fetch document data from reader API
        doc_data = self.get_reader_data(username, doc_slug)
        
        if not doc_data or 'pages' not in doc_data:
            self.log("  Could not fetch document data from API")
            return None
        
        pages = doc_data['pages']
        self.log(f"  Found {len(pages)} pages")
        
        # Create temporary directory
        temp_dir = self.output_dir / f"temp_{doc_slug}"
        temp_dir.mkdir(exist_ok=True)
        
        # Download all pages
        downloaded_pages = []
        for i, page in enumerate(pages, 1):
            image_uri = page.get('imageUri')
            if not image_uri:
                self.log(f"\n  Page {i} has no image URI, skipping")
                continue
            
            self.log(f"\r  Downloading page {i}/{len(pages)}...", end='')
            image_path = self.download_page_image(image_uri, i, temp_dir)
            
            if image_path:
                downloaded_pages.append(image_path)
            
            time.sleep(0.3)  # Be polite to the server
        
        self.log('')  # New line
        
        if not downloaded_pages:
            self.log("  No pages could be downloaded")
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)
            return None
        
        self.log(f"  Downloaded {len(downloaded_pages)} pages")
        
        # Create PDF
        if not output_filename:
            safe_slug = re.sub(r'[<>:"/\\|?*]', '_', doc_slug)
            output_filename = f"{safe_slug[:100]}.pdf"
        
        pdf_path = self.output_dir / output_filename
        self.log(f"  Creating PDF: {pdf_path}")
        
        try:
            downloaded_pages.sort()
            
            # Convert to RGB JPEGs for PDF
            image_list = []
            for img_path in downloaded_pages:
                img = Image.open(img_path)
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                rgb_path = img_path.with_suffix('.rgb.jpg')
                img.save(rgb_path, 'JPEG', quality=95)
                image_list.append(str(rgb_path))
                img.close()
            
            # Create PDF
            with open(pdf_path, 'wb') as f:
                f.write(img2pdf.convert(image_list))
            
            self.log("  ✓ PDF created successfully!")
            
        except Exception as e:
            self.log(f"  Error creating PDF: {e}")
            pdf_path = None
        
        # Cleanup
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)
        
        return pdf_path
    
    def download_all(self, profile_url=None):
        """Download all publications from LPM HIMMAH."""
        publications = self.get_publication_list(profile_url)
        
        self.log(f"Found {len(publications)} publications")
        
        downloaded = []
        failed = []
        
        for i, pub in enumerate(publications, 1):
            self.log(f"\n{'='*60}")
            self.log(f"[{i}/{len(publications)}] {pub['title']}")
            self.log('='*60)
            
            pdf_path = self.download_publication(pub['url'])
            
            if pdf_path:
                downloaded.append({'title': pub['title'], 'path': str(pdf_path)})
            else:
                failed.append(pub)
            
            time.sleep(2)
        
        # Summary
        self.log(f"\n{'='*60}")
        self.log("DOWNLOAD COMPLETE")
        self.log('='*60)
        self.log(f"Successfully downloaded: {len(downloaded)}")
        self.log(f"Failed: {len(failed)}")
        
        if failed:
            self.log("\nFailed publications:")
            for pub in failed:
                self.log(f"  - {pub['title']}")
        
        # Export results
        results_path = self.output_dir / 'download_results.json'
        with open(results_path, 'w', encoding='utf-8') as f:
            json.dump({'downloaded': downloaded, 'failed': failed}, f, indent=2, ensure_ascii=False)
        
        return downloaded
    
    def export_for_website(self):
        """
        Export publication data as JSON for the website.
        Maps downloaded PDFs to publication metadata.
        """
        publications = []
        
        for pub in self.LPMHIMMAH_PUBLICATIONS:
            url_info = self.parse_issuu_url(pub['url'])
            if not url_info:
                continue
            
            doc_slug = url_info['doc_slug']
            safe_slug = re.sub(r'[<>:"/\\|?*]', '_', doc_slug)
            pdf_filename = f"{safe_slug[:100]}.pdf"
            pdf_path = self.output_dir / pdf_filename
            
            # Determine category
            title_lower = pub['title'].lower()
            if 'muhibbah' in title_lower and 'kobarkobari' not in title_lower:
                category = 'muhibbah'
            elif 'himmah' in title_lower and 'kobarkobari' not in title_lower:
                category = 'himmah'
            elif 'kobarkobari' in title_lower or 'kobar' in title_lower:
                category = 'kobarkobari'
            else:
                category = 'other'
            
            # Extract year from title
            year_match = re.search(r'/(\d{4})', pub['title'])
            year = int(year_match.group(1)) if year_match else 2000
            
            publications.append({
                'id': doc_slug,
                'title': pub['title'],
                'category': category,
                'year': year,
                'issuu_url': pub['url'],
                'pdf_file': f"./pdfs/{pdf_filename}" if pdf_path.exists() else None
            })
        
        output_path = self.output_dir.parent / 'data' / 'publications.json'
        output_path.parent.mkdir(exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(publications, f, indent=2, ensure_ascii=False)
        
        self.log(f"Exported {len(publications)} publications to {output_path}")
        return output_path


def main():
    parser = argparse.ArgumentParser(
        description='Download Issuu publications from LPM HIMMAH and convert to PDF',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Download a SINGLE publication
  python issuu_downloader.py --url "https://issuu.com/lpmhimmahuii/docs/muhibbah_4_1971"
  
  # List all known publications
  python issuu_downloader.py --list
  
  # Download ALL publications (this takes a while!)
  python issuu_downloader.py --all
  
  # Export publication list for website
  python issuu_downloader.py --export
        """
    )
    
    parser.add_argument('--url', help='Download a single publication from this URL')
    parser.add_argument('--list', action='store_true', help='List all known publications')
    parser.add_argument('--all', action='store_true', help='Download ALL publications')
    parser.add_argument('--export', action='store_true', help='Export publication list for website')
    parser.add_argument('--output', '-o', default='../pdfs', help='Output directory (default: ../pdfs)')
    parser.add_argument('--quiet', '-q', action='store_true', help='Suppress output')
    
    args = parser.parse_args()
    
    if not any([args.url, args.list, args.all, args.export]):
        parser.print_help()
        return
    
    downloader = IssuuDownloader(output_dir=args.output, verbose=not args.quiet)
    
    if args.list:
        publications = downloader.get_publication_list()
        print(f"\nKnown LPM HIMMAH Publications ({len(publications)} total):")
        print('='*60)
        for i, pub in enumerate(publications, 1):
            print(f"{i:2}. {pub['title']}")
    
    elif args.url:
        pdf_path = downloader.download_publication(args.url)
        if pdf_path:
            print(f"\n{'='*60}")
            print(f"✓ Success! PDF saved to: {pdf_path}")
        else:
            print("\n✗ Failed to download publication")
            sys.exit(1)
    
    elif args.all:
        print(f"\nThis will download {len(downloader.LPMHIMMAH_PUBLICATIONS)} publications.")
        print("This may take 30-60 minutes depending on your connection.")
        confirmation = input("Continue? (y/n): ")
        if confirmation.lower() == 'y':
            downloaded = downloader.download_all()
            print(f"\n✓ Downloaded {len(downloaded)} PDFs to {downloader.output_dir}")
        else:
            print("Cancelled")
    
    elif args.export:
        downloader.export_for_website()


if __name__ == '__main__':
    main()

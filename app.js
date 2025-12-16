/**
 * LPM HIMMAH - Arsip Digital
 * Application JavaScript
 */

// ========================================
// Configuration
// ========================================
const CONFIG = {
    dataPath: './data/publications.json',
    pdfPath: './pdfs/',
    thumbnailPath: './thumbnails/'
};

// ========================================
// State Management
// ========================================
let publications = [];
let currentFilter = 'all';
let searchQuery = '';

// ========================================
// DOM Elements
// ========================================
const elements = {
    grid: document.getElementById('publicationsGrid'),
    loadingState: document.getElementById('loadingState'),
    noResults: document.getElementById('noResults'),
    searchInput: document.getElementById('searchInput'),
    filterButtons: document.querySelectorAll('.filter-btn'),
    modal: document.getElementById('readerModal'),
    modalOverlay: document.getElementById('modalOverlay'),
    modalClose: document.getElementById('modalClose'),
    modalTitle: document.getElementById('modalTitle'),
    pdfFrame: document.getElementById('pdfFrame'),
    downloadLink: document.getElementById('downloadLink'),
    totalPublications: document.getElementById('totalPublications')
};

// ========================================
// Data Loading
// ========================================
async function loadPublications() {
    try {
        const response = await fetch(CONFIG.dataPath);
        if (!response.ok) {
            throw new Error('Failed to load publications');
        }
        publications = await response.json();
        
        // Update stats
        elements.totalPublications.textContent = publications.length + '+';
        
        renderPublications();
    } catch (error) {
        console.error('Error loading publications:', error);
        // Use fallback demo data if file doesn't exist
        loadDemoData();
    }
}

function loadDemoData() {
    // Demo data based on actual Issuu publications
    publications = [
        {
            id: 'majalah_muhibbah_no._1_th._ke_xv_1981_reuni_nu',
            title: 'Majalah MUHIBBAH No. 01/Thn. XV/1981 – Reuni NU',
            category: 'muhibbah',
            year: 1981,
            pages: 40,
            issuu_url: 'https://issuu.com/lpmhimmahuii/docs/majalah_muhibbah_no._1_th._ke_xv_1981_reuni_nu'
        },
        {
            id: 'majalah_muhibbah_no._2_th._ke_xv_1981',
            title: 'Majalah MUHIBBAH No. 02/Thn. XV/1981 – Mahasiswa Bicara Indonesia',
            category: 'muhibbah',
            year: 1981,
            pages: 36,
            issuu_url: 'https://issuu.com/lpmhimmahuii/docs/majalah_muhibbah_no._2_th._ke_xv_1981'
        },
        {
            id: 'majalah_muhibbah_no._4_th._ke_xvi_1982_bbm_naik',
            title: 'Majalah MUHIBBAH No. 04/Thn. XVI/1982 – BBM Naik',
            category: 'muhibbah',
            year: 1982,
            pages: 44,
            issuu_url: 'https://issuu.com/lpmhimmahuii/docs/majalah_muhibbah_no._4_th._ke_xvi_1982_bbm_naik'
        },
        {
            id: 'majalah_muhibbah_no._7_th._ke_ix_1974_egoisme_bi',
            title: 'Majalah MUHIBBAH No. 07/Thn. IX/1975 - Egoisme Bicara dan Kerja',
            category: 'muhibbah',
            year: 1975,
            pages: 32,
            issuu_url: 'https://issuu.com/lpmhimmahuii/docs/majalah_muhibbah_no._7_th._ke_ix_1974_egoisme_bi'
        },
        {
            id: 'muhibbah_4_1971',
            title: 'Majalah MUHIBBAH No. 04/Thn. V/1971 - Pembaharuan Administrasi',
            category: 'muhibbah',
            year: 1971,
            pages: 28,
            issuu_url: 'https://issuu.com/lpmhimmahuii/docs/muhibbah_4_1971'
        },
        {
            id: 'majalah_himmah_edisi_01xxxiv2002_-_di_bawah_bender',
            title: 'Majalah HIMMAH No. 01/Thn. XXXIV/2002 - Di Bawah Bendera Globalisasi',
            category: 'himmah',
            year: 2002,
            pages: 52,
            issuu_url: 'https://issuu.com/lpmhimmahuii/docs/majalah_himmah_edisi_01xxxiv2002_-_di_bawah_bender'
        },
        {
            id: 'majalah_himmah_edisi_03_thn._xxxv_2003_-_balada_ut',
            title: 'Majalah HIMMAH No. 03/Thn. XXXV/2003 - Balada Utang Kita',
            category: 'himmah',
            year: 2003,
            pages: 48,
            issuu_url: 'https://issuu.com/lpmhimmahuii/docs/majalah_himmah_edisi_03_thn._xxxv_2003_-_balada_ut'
        },
        {
            id: 'majalah_himmah_edisi_01_thn._xxxvii_2004_-_air_men',
            title: 'Majalah HIMMAH No. 01/Thn. XXXVII/2004 - Air Mengalir Makin Menjauh',
            category: 'himmah',
            year: 2004,
            pages: 56,
            issuu_url: 'https://issuu.com/lpmhimmahuii/docs/majalah_himmah_edisi_01_thn._xxxvii_2004_-_air_men'
        },
        {
            id: 'majalah_himmah_edisi_02_thn._xlvi_2013_-_mega_proy',
            title: 'Majalah HIMMAH No. 02/Thn. XLVI/2013 - Mega Proyek Terlantar',
            category: 'himmah',
            year: 2013,
            pages: 60,
            issuu_url: 'https://issuu.com/lpmhimmahuii/docs/majalah_himmah_edisi_02_thn._xlvi_2013_-_mega_proy'
        },
        {
            id: 'majalah_himmah_edisi_02_thn._xxxiv_2002_-_antara_k',
            title: 'Majalah HIMMAH No. 02/Thn. XXXIV/2002 - Antara Kuasa dan Kemuliaan',
            category: 'himmah',
            year: 2002,
            pages: 48,
            issuu_url: 'https://issuu.com/lpmhimmahuii/docs/majalah_himmah_edisi_02_thn._xxxiv_2002_-_antara_k'
        },
        {
            id: 'jagad_maal',
            title: 'Majalah HIMMAH No. 02/Thn. XXXVII/2005 - Jagad Mal Jogja',
            category: 'himmah',
            year: 2005,
            pages: 52,
            issuu_url: 'https://issuu.com/lpmhimmahuii/docs/jagad_maal'
        },
        {
            id: 'edisi_133_tahun_ke-11_desember_2008_-_jalan_te',
            title: 'Buletin KOBARKobari Edisi 133/XI/Desember 2008 - Jalan Terjal Menuju Kampus Riset',
            category: 'kobarkobari',
            year: 2008,
            pages: 16,
            issuu_url: 'https://issuu.com/lpmhimmahuii/docs/edisi_133_tahun_ke-11_desember_2008_-_jalan_te'
        },
        {
            id: 'edisi_134_tahun_ke-12_februari_2009_-_pesta_',
            title: 'Buletin KOBARKobari Edisi 134/XII/Februari 2009 - \'PESTA\' yang Belum Usai',
            category: 'kobarkobari',
            year: 2009,
            pages: 16,
            issuu_url: 'https://issuu.com/lpmhimmahuii/docs/edisi_134_tahun_ke-12_februari_2009_-_pesta_'
        },
        {
            id: 'edisi_137_tahun_ke-12_agustus_2009_-_pintar_pu',
            title: 'Buletin KOBARKobari Edisi 137/XII/Agustus 2009 - Pintar pun Bergulir',
            category: 'kobarkobari',
            year: 2009,
            pages: 16,
            issuu_url: 'https://issuu.com/lpmhimmahuii/docs/edisi_137_tahun_ke-12_agustus_2009_-_pintar_pu'
        },
        {
            id: 'edisi_145_tahun_ke-13_oktober_2010_-_ketika_pe',
            title: 'Buletin KOBARKobari Edisi 145/XIII/Oktober 2010 - Ketika Pers Mahasiswa Tidak Lagi Bebas',
            category: 'kobarkobari',
            year: 2010,
            pages: 16,
            issuu_url: 'https://issuu.com/lpmhimmahuii/docs/edisi_145_tahun_ke-13_oktober_2010_-_ketika_pe'
        },
        {
            id: 'edisi_153_tahun_ke-14_november_2011_-_janji_dp',
            title: 'Buletin KOBARKobari Edisi 153/XIV/November 2011 - Janji DPM yang Dinantikan',
            category: 'kobarkobari',
            year: 2011,
            pages: 16,
            issuu_url: 'https://issuu.com/lpmhimmahuii/docs/edisi_153_tahun_ke-14_november_2011_-_janji_dp'
        },
        {
            id: 'edisi_pesta_tahun_ke-15_agustus_2012_-_pesta_',
            title: 'Buletin KOBARKobari Edisi PESTA/XV/Agustus 2012 - PESTA (Masih) Dihiasi Masalah',
            category: 'kobarkobari',
            year: 2012,
            pages: 24,
            issuu_url: 'https://issuu.com/lpmhimmahuii/docs/edisi_pesta_tahun_ke-15_agustus_2012_-_pesta_'
        },
        {
            id: 'edisi_183_tahun_ke-19_maret_2017_-_kronik_tgc-37',
            title: 'Buletin KOBARKobari Edisi 183/XIX/Maret 2017 - Kronik TGC-37',
            category: 'kobarkobari',
            year: 2017,
            pages: 20,
            issuu_url: 'https://issuu.com/lpmhimmahuii/docs/edisi_183_tahun_ke-19_maret_2017_-_kronik_tgc-37'
        },
        {
            id: 'edisi_184_tahun_ke-19_juni_2017_-_terkekang_izin',
            title: 'Buletin KOBARKobari Edisi 184/XIX/Juni 2017 - Terkekang Izin Perkuliahan',
            category: 'kobarkobari',
            year: 2017,
            pages: 20,
            issuu_url: 'https://issuu.com/lpmhimmahuii/docs/edisi_184_tahun_ke-19_juni_2017_-_terkekang_izin'
        },
        {
            id: 'edisi_pesta_tahun_ke-19_agustus_2017_-_menata_ke',
            title: 'Buletin KOBARKobari Edisi PESTA/XIX/Agustus 2017 - Langkah Awal Menata Kepekaan Sosial',
            category: 'kobarkobari',
            year: 2017,
            pages: 24,
            issuu_url: 'https://issuu.com/lpmhimmahuii/docs/edisi_pesta_tahun_ke-19_agustus_2017_-_menata_ke'
        }
    ];
    
    elements.totalPublications.textContent = publications.length + '+';
    renderPublications();
}

// ========================================
// Rendering
// ========================================
function renderPublications() {
    // Filter publications
    let filtered = publications.filter(pub => {
        // Category filter
        if (currentFilter !== 'all' && pub.category !== currentFilter) {
            return false;
        }
        
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchTitle = pub.title.toLowerCase().includes(query);
            const matchYear = pub.year.toString().includes(query);
            const matchCategory = pub.category.toLowerCase().includes(query);
            return matchTitle || matchYear || matchCategory;
        }
        
        return true;
    });
    
    // Sort by year (newest first)
    filtered.sort((a, b) => b.year - a.year);
    
    // Hide loading state
    elements.loadingState.style.display = 'none';
    
    // Show/hide no results
    if (filtered.length === 0) {
        elements.noResults.style.display = 'block';
        elements.grid.innerHTML = '';
        return;
    }
    
    elements.noResults.style.display = 'none';
    
    // Render cards
    elements.grid.innerHTML = filtered.map(pub => createPublicationCard(pub)).join('');
    
    // Add click handlers
    elements.grid.querySelectorAll('.publication-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            openPublication(id);
        });
    });
}

function createPublicationCard(pub) {
    const categoryLabel = getCategoryLabel(pub.category);
    const icon = getCategoryIcon(pub.category);
    
    return `
        <article class="publication-card" data-id="${pub.id}">
            <div class="card-thumbnail">
                <div class="card-placeholder">${icon}</div>
                <span class="card-category ${pub.category}">${categoryLabel}</span>
            </div>
            <div class="card-content">
                <h3 class="card-title">${pub.title}</h3>
                <div class="card-meta">
                    <span class="card-year">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        ${pub.year}
                    </span>
                    ${pub.pages ? `<span>${pub.pages} halaman</span>` : ''}
                </div>
            </div>
        </article>
    `;
}

function getCategoryLabel(category) {
    const labels = {
        muhibbah: 'MUHIBBAH',
        himmah: 'HIMMAH',
        kobarkobari: 'KOBARKobari'
    };
    return labels[category] || category;
}

function getCategoryIcon(category) {
    const icons = {
        muhibbah: '📖',
        himmah: '📰',
        kobarkobari: '📋'
    };
    return icons[category] || '📄';
}

// ========================================
// Modal & PDF Viewer
// ========================================
function openPublication(id) {
    const pub = publications.find(p => p.id === id);
    if (!pub) return;
    
    elements.modalTitle.textContent = pub.title;
    
    // Check if PDF exists locally
    const pdfPath = `${CONFIG.pdfPath}${pub.id}.pdf`;
    
    // For now, link to Issuu (will use local PDF after download)
    if (pub.pdf_file) {
        elements.pdfFrame.src = pub.pdf_file;
        elements.downloadLink.href = pub.pdf_file;
    } else {
        // Embed Issuu reader or show message
        elements.pdfFrame.src = pub.issuu_url;
        elements.downloadLink.href = pub.issuu_url;
        elements.downloadLink.removeAttribute('download');
        elements.downloadLink.target = '_blank';
        elements.downloadLink.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            Buka di Issuu
        `;
    }
    
    elements.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    elements.modal.classList.remove('active');
    elements.pdfFrame.src = '';
    document.body.style.overflow = '';
}

// ========================================
// Event Listeners
// ========================================
function initEventListeners() {
    // Search
    elements.searchInput.addEventListener('input', debounce((e) => {
        searchQuery = e.target.value.trim();
        renderPublications();
    }, 300));
    
    // Filter buttons
    elements.filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderPublications();
        });
    });
    
    // Modal close
    elements.modalClose.addEventListener('click', closeModal);
    elements.modalOverlay.addEventListener('click', closeModal);
    
    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.modal.classList.contains('active')) {
            closeModal();
        }
    });
    
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            // Simple toggle - could expand to full mobile menu
            document.querySelector('.nav-links').classList.toggle('mobile-open');
        });
    }
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ========================================
// Utilities
// ========================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ========================================
// Initialize
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    loadPublications();
});

/**
 * LPM HIMMAH - Arsip Digital
 * Application JavaScript
 * Paper-Style PDF Reader with PDF.js
 */

// ========================================
// Configuration
// ========================================
const CONFIG = {
    dataPath: './data/publications.json',
    pdfPath: 'https://pub-c06db3ecd804497e8176675294956415.r2.dev/',
    thumbnailPath: 'https://pub-c06db3ecd804497e8176675294956415.r2.dev/thumbnails/',
    pdfWorkerSrc: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
};

// ========================================
// State Management
// ========================================
let publications = [];
let currentFilter = 'all';
let searchQuery = '';
let currentPDF = null;
let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.0;
let isDragging = false;
let startX, startY, scrollLeft, scrollTop;

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
    downloadLink: document.getElementById('downloadLink'),
    totalPublications: document.getElementById('totalPublications'),
    pdfContainer: document.getElementById('pdfContainer'),
    pdfLoading: document.getElementById('pdfLoading')
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
        loadDemoData();
    }
}

function loadDemoData() {
    publications = [
        {
            id: 'majalah_muhibbah_no._1_th._ke_xv_1981_reuni_nu',
            title: 'Majalah MUHIBBAH No. 01/Thn. XV/1981 – Reuni NU',
            category: 'muhibbah',
            year: 1981,
            pages: 40,
            issuu_url: 'https://issuu.com/lpmhimmahuii/docs/majalah_muhibbah_no._1_th._ke_xv_1981_reuni_nu'
        }
    ];

    elements.totalPublications.textContent = publications.length + '+';
    renderPublications();
}

// ========================================
// Rendering
// ========================================
function renderPublications() {
    let filtered = publications.filter(pub => {
        if (currentFilter !== 'all' && pub.category !== currentFilter) {
            return false;
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchTitle = pub.title.toLowerCase().includes(query);
            const matchYear = pub.year.toString().includes(query);
            const matchCategory = pub.category.toLowerCase().includes(query);
            return matchTitle || matchYear || matchCategory;
        }

        return true;
    });

    filtered.sort((a, b) => b.year - a.year);

    elements.loadingState.style.display = 'none';

    if (filtered.length === 0) {
        elements.noResults.style.display = 'block';
        elements.grid.innerHTML = '';
        return;
    }

    elements.noResults.style.display = 'none';

    elements.grid.innerHTML = filtered.map(pub => createPublicationCard(pub)).join('');

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
    const thumbUrl = `${CONFIG.thumbnailPath}${pub.id}.jpg`;

    return `
        <article class="publication-card" data-id="${pub.id}">
            <div class="card-thumbnail">
                <div class="card-placeholder" id="placeholder-${pub.id}">${icon}</div>
                <img
                    class="card-thumb-img"
                    src="${thumbUrl}"
                    alt="${pub.title}"
                    loading="lazy"
                    onload="this.style.opacity='1'; document.getElementById('placeholder-${pub.id}').style.display='none';"
                    onerror="this.style.display='none';"
                >
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
// Paper-Style PDF Reader
// ========================================
function openPublication(id) {
    const pub = publications.find(p => p.id === id);
    if (!pub) return;

    const pdfUrl = `${CONFIG.pdfPath}${pub.id}.pdf`;
    openPDFReader(pub, pdfUrl);
}

function openPDFReader(pub, pdfUrl) {
    currentPDF = pub;
    currentPage = 1;
    scale = 1.0;

    // Update modal title
    elements.modalTitle.textContent = pub.title;

    // Update download link
    elements.downloadLink.href = pdfUrl;
    elements.downloadLink.download = `${pub.id}.pdf`;

    // Show modal
    elements.modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Create paper-style reader UI
    createPaperReader(pdfUrl);
}

function createPaperReader(pdfUrl) {
    const container = elements.pdfContainer;

    // Create reader HTML structure
    container.innerHTML = `
        <div class="paper-reader">
            <div class="paper-desk">
                <div class="paper-shadow"></div>
                <div class="paper-stack">
                    <canvas id="pdfCanvas" class="paper-page"></canvas>
                </div>
                <div class="page-curl"></div>
            </div>
            <div class="reader-controls">
                <div class="controls-left">
                    <button class="control-btn" id="zoomOut" title="Perkecil">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                        </svg>
                    </button>
                    <span class="zoom-level" id="zoomLevel">100%</span>
                    <button class="control-btn" id="zoomIn" title="Perbesar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="11" y1="8" x2="11" y2="14"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                        </svg>
                    </button>
                    <button class="control-btn" id="fitWidth" title="Sesuaikan lebar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <polyline points="9 21 3 21 3 15"></polyline>
                            <line x1="21" y1="3" x2="14" y2="10"></line>
                            <line x1="3" y1="21" x2="10" y2="14"></line>
                        </svg>
                    </button>
                </div>
                <div class="controls-center">
                    <button class="control-btn nav-btn" id="prevPage" title="Halaman sebelumnya">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <div class="page-info">
                        <input type="number" id="pageInput" class="page-input" value="1" min="1">
                        <span class="page-separator">/</span>
                        <span id="totalPages">-</span>
                    </div>
                    <button class="control-btn nav-btn" id="nextPage" title="Halaman berikutnya">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </div>
                <div class="controls-right">
                    <button class="control-btn" id="fullscreenBtn" title="Layar penuh">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <polyline points="9 21 3 21 3 15"></polyline>
                            <polyline points="21 15 21 21 15 21"></polyline>
                            <polyline points="3 9 3 3 9 3"></polyline>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
        <div class="paper-loading" id="paperLoading">
            <div class="loading-book">
                <div class="book-page"></div>
                <div class="book-page"></div>
                <div class="book-page"></div>
            </div>
            <p>Membuka arsip...</p>
        </div>
    `;

    // Initialize PDF.js and load PDF
    initPDFReader(pdfUrl);

    // Setup controls
    setupReaderControls();
}

async function initPDFReader(pdfUrl) {
    const loading = document.getElementById('paperLoading');
    loading.style.display = 'flex';

    try {
        // Load PDF.js library dynamically
        if (!window.pdfjsLib) {
            await loadPDFJS();
        }

        // Configure worker
        if (window.pdfjsLib) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = CONFIG.pdfWorkerSrc;
        }

        // Load PDF document
        const loadingTask = pdfjsLib.getDocument({
            url: pdfUrl,
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
            cMapPacked: true,
        });

        pdfDoc = await loadingTask.promise;
        totalPages = pdfDoc.numPages;

        // Update page count
        document.getElementById('totalPages').textContent = totalPages;
        document.getElementById('pageInput').max = totalPages;

        // Render first page
        await renderPage(1);

        loading.style.display = 'none';
    } catch (error) {
        console.error('Error loading PDF:', error);
        loading.innerHTML = `
            <div class="load-error">
                <div class="error-icon">📄</div>
                <h3>Gagal memuat PDF</h3>
                <p>Error: ${error.message || 'Unknown error'}</p>
                <div class="error-actions">
                    <a href="${pdfUrl}" class="btn btn-primary" target="_blank">Buka PDF</a>
                    ${currentPDF?.issuu_url ? `<a href="${currentPDF.issuu_url}" target="_blank" class="btn btn-secondary">Buka di Issuu</a>` : ''}
                </div>
            </div>
        `;
    }
}

function loadPDFJS() {
    return new Promise((resolve, reject) => {
        // Use the legacy build for better compatibility
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
            console.log('PDF.js loaded:', window.pdfjsLib);
            resolve();
        };
        script.onerror = (e) => {
            console.error('Failed to load PDF.js:', e);
            reject(new Error('Failed to load PDF.js library'));
        };
        document.head.appendChild(script);
    });
}

async function renderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
        return;
    }

    pageRendering = true;
    currentPage = num;

    // Update page input
    document.getElementById('pageInput').value = num;

    // Update navigation buttons
    document.getElementById('prevPage').disabled = num <= 1;
    document.getElementById('nextPage').disabled = num >= totalPages;

    try {
        const page = await pdfDoc.getPage(num);

        const canvas = document.getElementById('pdfCanvas');
        const ctx = canvas.getContext('2d');

        // Calculate scale to fit WIDTH (not height) - this makes PDFs readable
        const desk = document.querySelector('.paper-desk');
        const deskWidth = desk.clientWidth - 60; // Minimal padding
        const deskHeight = desk.clientHeight - 40;

        const viewport = page.getViewport({ scale: 1 });

        // Fit to width by default for better readability
        let fitScale = deskWidth / viewport.width;

        // But don't exceed container height too much (max 1.5x height)
        const maxHeightScale = (deskHeight * 1.5) / viewport.height;
        if (fitScale > maxHeightScale) {
            fitScale = maxHeightScale;
        }

        // Apply user zoom on top of fit-width
        const finalScale = fitScale * scale;
        const scaledViewport = page.getViewport({ scale: finalScale });

        // Set canvas dimensions
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        // Render page
        const renderContext = {
            canvasContext: ctx,
            viewport: scaledViewport
        };

        await page.render(renderContext).promise;

        // Add paper texture effect
        addPaperTexture(canvas);

        pageRendering = false;

        if (pageNumPending !== null) {
            renderPage(pageNumPending);
            pageNumPending = null;
        }
    } catch (error) {
        console.error('Error rendering page:', error);
        pageRendering = false;
    }
}

function addPaperTexture(canvas) {
    // Add subtle paper texture overlay
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(250, 248, 245, 0.03)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
}

function setupReaderControls() {
    // Navigation
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            renderPage(currentPage - 1);
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        if (currentPage < totalPages) {
            renderPage(currentPage + 1);
        }
    });

    // Page input
    const pageInput = document.getElementById('pageInput');
    pageInput.addEventListener('change', (e) => {
        let page = parseInt(e.target.value);
        if (page >= 1 && page <= totalPages) {
            renderPage(page);
        } else {
            e.target.value = currentPage;
        }
    });

    // Zoom controls
    document.getElementById('zoomIn').addEventListener('click', () => {
        if (scale < 3) {
            scale += 0.25;
            updateZoom();
        }
    });

    document.getElementById('zoomOut').addEventListener('click', () => {
        if (scale > 0.5) {
            scale -= 0.25;
            updateZoom();
        }
    });

    document.getElementById('fitWidth').addEventListener('click', () => {
        scale = 1.0;
        updateZoom();
    });

    // Fullscreen
    document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);

    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboard);

    // Touch/mouse drag for panning
    const desk = document.querySelector('.paper-desk');
    desk.addEventListener('mousedown', startDrag);
    desk.addEventListener('mousemove', drag);
    desk.addEventListener('mouseup', endDrag);
    desk.addEventListener('mouseleave', endDrag);

    // Touch events
    desk.addEventListener('touchstart', (e) => startDrag(e.touches[0]));
    desk.addEventListener('touchmove', (e) => {
        e.preventDefault();
        drag(e.touches[0]);
    });
    desk.addEventListener('touchend', endDrag);

    // Mouse wheel zoom
    desk.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY < 0 && scale < 3) {
            scale += 0.1;
        } else if (e.deltaY > 0 && scale > 0.5) {
            scale -= 0.1;
        }
        updateZoom();
    });
}

function updateZoom() {
    document.getElementById('zoomLevel').textContent = Math.round(scale * 100) + '%';
    renderPage(currentPage);
}

function toggleFullscreen() {
    const modal = elements.modal;
    if (!document.fullscreenElement) {
        modal.requestFullscreen().catch(err => {
            console.log('Fullscreen error:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

function handleKeyboard(e) {
    if (!elements.modal.classList.contains('active')) return;

    switch(e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
            if (currentPage > 1) renderPage(currentPage - 1);
            break;
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
            if (currentPage < totalPages) renderPage(currentPage + 1);
            break;
        case 'Escape':
            closeModal();
            break;
        case '+':
        case '=':
            if (scale < 3) {
                scale += 0.25;
                updateZoom();
            }
            break;
        case '-':
            if (scale > 0.5) {
                scale -= 0.25;
                updateZoom();
            }
            break;
        case '0':
            scale = 1.0;
            updateZoom();
            break;
    }
}

function startDrag(e) {
    if (scale > 1) {
        isDragging = true;
        const desk = document.querySelector('.paper-desk');
        startX = e.pageX - desk.offsetLeft;
        startY = e.pageY - desk.offsetTop;
        scrollLeft = desk.scrollLeft;
        scrollTop = desk.scrollTop;
        desk.style.cursor = 'grabbing';
    }
}

function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    const desk = document.querySelector('.paper-desk');
    const x = e.pageX - desk.offsetLeft;
    const y = e.pageY - desk.offsetTop;
    const walkX = (x - startX) * 1.5;
    const walkY = (y - startY) * 1.5;
    desk.scrollLeft = scrollLeft - walkX;
    desk.scrollTop = scrollTop - walkY;
}

function endDrag() {
    isDragging = false;
    const desk = document.querySelector('.paper-desk');
    if (desk) desk.style.cursor = scale > 1 ? 'grab' : 'default';
}

function closeModal() {
    elements.modal.classList.remove('active');
    document.body.style.overflow = '';

    // Cleanup
    if (elements.pdfContainer) {
        elements.pdfContainer.innerHTML = '';
    }

    // Remove keyboard listener
    document.removeEventListener('keydown', handleKeyboard);

    pdfDoc = null;
    currentPDF = null;
    currentPage = 1;
    totalPages = 0;
    scale = 1.0;
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

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
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

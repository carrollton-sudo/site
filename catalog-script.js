/* --- DATA SOURCE --- */
const BASE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRf0MVI2PeSQXePcPhrCiQ9Jr12LbIz2EnkrD5K1zt2ZODy2iS1gTUIcsS45rsce3AjCldPtjmYqrqT/pub?output=csv";

// Tab IDs (gid). 0 is usually the first tab. 
// If your metadata is the second tab, the URL needs that specific ID.
const ALBUM_SHEET_URL = BASE_URL + "&gid=0"; 
const METADATA_SHEET_URL = BASE_URL + "&gid=1330310243"; // This is the standard ID for a second tab, but &gid=0 works for the first.

let photoData = {}; 
let currentAlbum = { start: 0, end: 0, folder: '' };
let currentIndex = 0;
let scale = 1;
let isDragging = false;
let startX, startY, translateX = 0, translateY = 0;

/* --- DOM ELEMENTS --- */
const albumList = document.getElementById('album-list');
const photoStream = document.getElementById('photo-stream');
const catalogTitle = document.getElementById('catalog-title');
const navLink = document.getElementById('nav-link');
const modal = document.getElementById('photo-modal');
const modalImg = document.getElementById('modal-img');
const zoomLevelText = document.getElementById('zoom-level');
const exifDisplay = document.getElementById('exif-data');
const frameDisplay = document.getElementById('frame-num');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

/* --- INITIALIZATION --- */
window.onload = function() {
    loadData();
};

async function loadData() {
    // 1. Load Metadata First
    Papa.parse(METADATA_SHEET_URL, {
        download: true,
        header: true,
        complete: function(results) {
            results.data.forEach(row => {
                if (row.id) photoData[row.id] = row.exif_data;
            });
            // 2. Load Albums after metadata is ready
            loadAlbums();
        }
    });
}

function loadAlbums() {
    Papa.parse(ALBUM_SHEET_URL, {
        download: true,
        header: true,
        complete: function(results) {
            renderAlbums(results.data);
        }
    });
}

function renderAlbums(data) {
    albumList.innerHTML = '';
    data.forEach(row => {
        if (!row.title) return; // Skip empty rows

        const card = document.createElement('div');
        card.className = 'album-card';
        card.onclick = () => openAlbum(
            row.folder, 
            parseInt(row.start), 
            parseInt(row.end), 
            row.title
        );

        card.innerHTML = `
            <div class="album-cover" style="background-image: url('${row.folder}/${row.cover_img}');">
                <div class="inner-border"></div>
            </div>
            <div class="album-info">
                <h3>${row.title}</h3>
                <p>${parseInt(row.end) - parseInt(row.start) + 1} exposures</p>
            </div>
        `;
        albumList.appendChild(card);
    });
}

/* --- ALBUM LOGIC --- */
function openAlbum(folder, start, end, title) {
    currentAlbum = { start, end, folder };
    photoStream.innerHTML = '';
    
    const loader = document.getElementById('creative-loader');
    const loaderBar = document.getElementById('loader-bar');
    loader.classList.remove('hidden', 'opening');
    loaderBar.style.width = '0%';
    
    let loadedImages = 0;
    const totalImages = end - start + 1;
    let currentSheet = null;
    let currentStrip = null;
    let framesCount = 0;
    
    for (let i = start; i <= end; i++) {
        if (framesCount % 12 === 0) {
            currentSheet = document.createElement('div');
            currentSheet.className = 'contact-sheet';
            photoStream.appendChild(currentSheet);
        }

        if (framesCount % 4 === 0) {
            currentStrip = document.createElement('div');
            currentStrip.className = 'film-strip';
            currentSheet.appendChild(currentStrip);
        }

        const frameDiv = document.createElement('div');
        frameDiv.className = 'contact-frame';

        const img = document.createElement('img');
        img.src = `${folder}/${i}.webp`;
        img.className = 'stream-img';
        img.loading = 'lazy';
        
        img.onload = () => {
            img.classList.add('loaded');
            loadedImages++;
            loaderBar.style.width = `${(loadedImages / totalImages) * 100}%`;
            if (loadedImages >= Math.min(totalImages, 6)) {
                setTimeout(() => loader.classList.add('opening'), 400);
                setTimeout(() => loader.classList.add('hidden'), 1000);
            }
        };

        img.onclick = () => openModal(i);

        const frameNum = document.createElement('div');
        frameNum.className = 'frame-number';
        frameNum.innerText = (i - start + 1).toString().padStart(2, '0') + "A";

        frameDiv.appendChild(img);
        frameDiv.appendChild(frameNum);
        currentStrip.appendChild(frameDiv);
        framesCount++;
    }
    
    catalogTitle.innerText = title;
    navLink.innerText = "← CLOSE ALBUM";
    navLink.onclick = (e) => { e.preventDefault(); closeAlbum(); };
    
    albumList.classList.add('hidden');
    photoViewer.classList.remove('hidden');
    document.querySelector('.layout-toggle').style.display = 'none';
    window.scrollTo(0,0);
}

function closeAlbum() {
    catalogTitle.innerText = "FULL CATALOG";
    navLink.innerText = "← RETURN";
    navLink.onclick = null;
    albumList.classList.remove('hidden');
    photoViewer.classList.add('hidden');
    document.querySelector('.layout-toggle').style.display = 'flex';
}

/* --- MODAL ENGINE --- */
function openModal(index) {
    currentIndex = index;
    modalImg.classList.remove('loaded');
    modalImg.src = `${currentAlbum.folder}/${index}.webp`;
    modalImg.onload = () => modalImg.classList.add('loaded');
    
    exifDisplay.innerText = photoData[index] || "METADATA NOT FOUND";
    frameDisplay.innerText = `EXP ${index.toString().padStart(2, '0')}`;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    resetZoom();
    updateModalControls();
}

function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function updateModalControls() {
    prevBtn.disabled = currentIndex <= currentAlbum.start;
    nextBtn.disabled = currentIndex >= currentAlbum.end;
}

/* --- ZOOM/PAN --- */
function updateTransform() {
    modalImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    zoomLevelText.innerText = `${Math.round(scale * 100)}%`;
    modalImg.style.cursor = scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default';
}

function resetZoom() {
    scale = 1; translateX = 0; translateY = 0;
    updateTransform();
}

document.getElementById('zoom-in').onclick = () => { scale = Math.min(scale + 0.5, 4); updateTransform(); };
document.getElementById('zoom-out').onclick = () => { scale = Math.max(scale - 0.5, 1); updateTransform(); };
document.getElementById('close-btn').onclick = closeModal;
prevBtn.onclick = () => { if (currentIndex > currentAlbum.start) openModal(currentIndex - 1); };
nextBtn.onclick = () => { if (currentIndex < currentAlbum.end) openModal(currentIndex + 1); };

function setLayout(mode) {
    if (mode === 'list') albumList.classList.add('list-mode');
    else albumList.classList.remove('list-mode');
}

/* --- DATA SOURCE --- */
// Base link from your "Publish to Web" settings
const SPREADSHEET_ID = "2PACX-1vRf0MVI2PeSQXePcPhrCiQ9Jr12LbIz2EnkrD5K1zt2ZODy2iS1gTUIcsS45rsce3AjCldPtjmYqrqT";

// Tab IDs: '0' is usually the 1st tab, '1330310243' is usually the 2nd.
const ALBUM_URL = `https://docs.google.com/spreadsheets/d/e/${SPREADSHEET_ID}/pub?gid=0&output=csv`;
const METADATA_URL = `https://docs.google.com/spreadsheets/d/e/${SPREADSHEET_ID}/pub?gid=1330310243&output=csv`;

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

function loadData() {
    // First, load EXIF metadata
    Papa.parse(METADATA_URL, {
        download: true,
        header: true,
        complete: function(results) {
            results.data.forEach(row => {
                if (row.id) photoData[row.id.trim()] = row.exif_data;
            });
            // After metadata is in memory, load the albums
            loadAlbums();
        },
        error: function(err) {
            console.error("Metadata Load Error:", err);
            loadAlbums(); // Try to load albums anyway
        }
    });
}

function loadAlbums() {
    Papa.parse(ALBUM_URL, {
        download: true,
        header: true,
        complete: function(results) {
            renderAlbums(results.data);
        },
        error: function(err) {
            console.error("Album Load Error:", err);
            albumList.innerHTML = "<p style='text-align:center; padding: 50px;'>Error loading catalog. Please check your spreadsheet connection.</p>";
        }
    });
}

function renderAlbums(data) {
    albumList.innerHTML = '';
    data.forEach(row => {
        if (!row.title || !row.folder) return; 

        const card = document.createElement('div');
        card.className = 'album-card';
        
        // Convert spreadsheet strings to numbers
        const start = parseInt(row.start);
        const end = parseInt(row.end);

        card.onclick = () => openAlbum(row.folder, start, end, row.title);

        card.innerHTML = `
            <div class="album-cover" style="background-image: url('${row.folder}/${row.cover_img}');">
                <div class="inner-border"></div>
            </div>
            <div class="album-info">
                <h3>${row.title}</h3>
                <p>${(end - start) + 1} exposures</p>
            </div>
        `;
        albumList.appendChild(card);
    });
}

/* --- ALBUM VIEWER LOGIC --- */
function openAlbum(folder, start, end, title) {
    currentAlbum = { start, end, folder };
    photoStream.innerHTML = '';
    
    const loader = document.getElementById('creative-loader');
    const loaderBar = document.getElementById('loader-bar');
    loader.classList.remove('hidden', 'opening');
    loaderBar.style.width = '0%';
    
    let loadedImages = 0;
    const totalImages = (end - start) + 1;
    let currentSheet = null;
    let currentStrip = null;
    
    for (let i = start; i <= end; i++) {
        const relativeIndex = i - start;
        
        if (relativeIndex % 12 === 0) {
            currentSheet = document.createElement('div');
            currentSheet.className = 'contact-sheet';
            photoStream.appendChild(currentSheet);
        }
        if (relativeIndex % 4 === 0) {
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
        frameNum.innerText = (relativeIndex + 1).toString().padStart(2, '0') + "A";

        frameDiv.appendChild(img);
        frameDiv.appendChild(frameNum);
        currentStrip.appendChild(frameDiv);
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

/* --- MODAL / ZOOM --- */
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

function updateTransform() {
    modalImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    zoomLevelText.innerText = `${Math.round(scale * 100)}%`;
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

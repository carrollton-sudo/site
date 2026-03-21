/* --- STATE & DATA --- */
const photoData = {
    1: "Canon EOS 2000D / Canon EF-S 18-55mm IS II \n ISO1600, 33mm, f/4.5, 1/20s",
    2: "Canon EOS 2000D / Canon EF-S 18-55mm IS II \n ISO800, 30mm, f/5.6, 1/30s",
    3: "Canon EOS 2000D / Canon EF-S 18-55mm IS II \n ISO1600, 27mm, f/5.6, 1/30s",
    4: "Canon EOS 2000D / Canon EF-S 18-55mm IS II \n ISO6400, 50mm, f/5.6, 1/40s",
    5: "Canon EOS 2000D / Canon EF-S 18-55mm IS II \n ISO3200, 34mm, f/8, 1/200s",
    6: "Canon EOS 2000D / Canon EF-S 18-55m IS II \n ISO100, 49mm, f/14, 1/125s",
    7: "Canon EOS M50 / Canon EF-S 18-55mm IS II \n ISO8000, 53mm, f/8, 1/125s",
    8: "Canon EOS M50 / Canon EF-S 18-55mm IS II \n ISO8000, 55mm, f/8, 1/125s",
    9: "Canon EOS M50 / Canon EF-M 15-45mm \n ISO3200, 39mm, f/8, 1/80s",
    10: "Canon EOS M50 / Canon EF-M 15-45mm IS STM\n ISO200, 19mm, f/6.3, 1/125s",
    11: "Canon EOS M50 / Canon EF-M 15-45mm IS STM \n ISO200, 24mm, f/6.3, 1/125s",
    12: "Canon EOS M50 / Canon EF-M 15-45mm IS STM \n ISO3200, 24mm, f/6.3, 1/125s",
    13: "Canon EOS M50 / Canon EF-M 15-45mm IS STM \n ISO3200, 19mm, f/6.3, 1/125s",
    14: "Canon EOS 2000D / Canon EF-S 18-55mm IS II \n ISO800, 18mm, f/5.6, 1/125s",
    15: "Canon EOS M50 / Canon EF-M 15-45mm IS STM \n ISO800, 27mm, f/4.5, 1/100s",
    16: "Canon EOS M50 / Canon EF-M 15-45mm IS STM \n ISO800, 15mm, f/3.5, 1/100s",
    17: "Canon EOS M50 / Canon EF-M 15-45mm IS STM \n ISO200, 45mm, f/6.3, 1/125s",
    18: "Canon EOS M50 / Canon EF-M 15-45mm IS STM \n ISO2000, 31mm, f/5.6, 1/25s",
    19: "Canon EOS 2000D / Canon EF-S 18-55mm IS II \n ISO250, 29mm, f/5.6, 1/160s",
    20: "Canon EOS 2000D / Canon EF-S 18-55mm IS II \n ISO3200, 48mm, f/5.6, 1/160s"
};

let currentAlbum = { start: 0, end: 0, folder: '' };
let currentIndex = 0;
let scale = 1;
let isDragging = false;
let startX, startY, translateX = 0, translateY = 0;

/* --- DOM ELEMENTS --- */
const photoStream = document.getElementById('photo-stream');
const albumList = document.getElementById('album-list');
const photoViewer = document.getElementById('photo-viewer');
const catalogTitle = document.getElementById('catalog-title');
const navLink = document.getElementById('nav-link');
const modal = document.getElementById('photo-modal');
const modalImg = document.getElementById('modal-img');
const zoomLevelText = document.getElementById('zoom-level');
const exifDisplay = document.getElementById('exif-data');
const frameDisplay = document.getElementById('frame-num');

/* --- LAYOUT CONTROLS --- */
function setLayout(mode) {
    const gridBtn = document.getElementById('grid-btn');
    const listBtn = document.getElementById('list-btn');
    if (mode === 'list') {
        albumList.classList.add('list-mode');
        listBtn.classList.add('active');
        gridBtn.classList.remove('active');
    } else {
        albumList.classList.remove('list-mode');
        gridBtn.classList.add('active');
        listBtn.classList.remove('active');
    }
}

/* --- ALBUM NAVIGATION --- */
function openAlbum(folder, start, end, title) {
    currentAlbum = { start, end, folder };
    photoStream.innerHTML = '';
    
    for (let i = start; i <= end; i++) {
        const img = document.createElement('img');
        img.src = `${folder}/${i}.webp`;
        img.className = 'stream-img';
        img.onclick = () => openModal(i);
        photoStream.appendChild(img);
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
    modalImg.src = `${currentAlbum.folder}/${index}.webp`;
    exifDisplay.innerText = photoData[index] || "METADATA \n UNAVAILABLE";
    frameDisplay.innerText = `EXP ${index.toString().padStart(2, '0')}`;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    resetZoom();
}

function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

/* --- ZOOM & PAN SYSTEM --- */
function updateTransform() {
    modalImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    zoomLevelText.innerText = `${Math.round(scale * 100)}%`;
}

function resetZoom() {
    scale = 1; translateX = 0; translateY = 0;
    updateTransform();
}

document.getElementById('zoom-in').onclick = () => { scale = Math.min(scale + 0.5, 4); updateTransform(); };
document.getElementById('zoom-out').onclick = () => { scale = Math.max(scale - 0.5, 0.5); updateTransform(); };

const viewport = document.getElementById('viewport');
viewport.onmousedown = (e) => {
    if (scale <= 1) return;
    isDragging = true;
    modalImg.classList.add('dragging');
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
};

window.onmousemove = (e) => {
    if (!isDragging) return;
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    updateTransform();
};

window.onmouseup = () => {
    isDragging = false;
    modalImg.classList.remove('dragging');
};

/* --- GLOBAL LISTENERS --- */
document.getElementById('prev-btn').onclick = () => { if (currentIndex > currentAlbum.start) openModal(currentIndex - 1); };
document.getElementById('next-btn').onclick = () => { if (currentIndex < currentAlbum.end) openModal(currentIndex + 1); };
document.getElementById('close-btn').onclick = closeModal;

window.onkeydown = (e) => {
    if (modal.classList.contains('hidden')) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft") document.getElementById('prev-btn').click();
    if (e.key === "ArrowRight") document.getElementById('next-btn').click();
};

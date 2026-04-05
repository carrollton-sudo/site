import { injectSpeedInsights } from '@vercel/speed-insights';

// Initialize Vercel Speed Insights
injectSpeedInsights();

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
    9: "Canon EOS M50 / Canon EF-M 15-45mm IS STM \n ISO3200, 39mm, f/8, 1/80s",
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
    20: "Canon EOS 2000D / Canon EF-S 18-55mm IS II \n ISO3200, 48mm, f/5.6, 1/160s",
    21: "Canon EOS 2000D / Canon EF-S 18-55mm IS II \n ISO800, 36mm, f/5.6, 1/160s"
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
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

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

/* --- ALBUM NAVIGATION & CREATIVE LOADER --- */
function openAlbum(folder, start, end, title) {
    currentAlbum = { start, end, folder };
    photoStream.innerHTML = '';
    
    // Trigger Creative Loader
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
        // Create a new Contact Sheet Page every 12 images (3 strips of 4)
        if (framesCount % 12 === 0) {
            currentSheet = document.createElement('div');
            currentSheet.className = 'contact-sheet';
            
            // Randomly tilt the entire sheet to make it feel authentic
            const sheetRot = (Math.random() * 2 - 1).toFixed(2); // between -1 and 1 degree
            currentSheet.style.transform = `rotate(${sheetRot}deg)`;
            
            photoStream.appendChild(currentSheet);
        }

        // Create a new Film Strip every 4 images
        if (framesCount % 4 === 0) {
            currentStrip = document.createElement('div');
            currentStrip.className = 'film-strip';
            
            // Randomly offset/tilt the strips slightly inside the sheet like manually cut strips
            const stripRot = (Math.random() * 1 - 0.5).toFixed(2); 
            const stripOffsetY = (Math.random() * 4 - 2).toFixed(2);
            currentStrip.style.transform = `rotate(${stripRot}deg) translateY(${stripOffsetY}px)`;
            
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
            
            // "Shutter open"
            if (loadedImages === totalImages || loadedImages >= 4) {
                setTimeout(() => loader.classList.add('opening'), 400);
                setTimeout(() => loader.classList.add('hidden'), 1000); 
            }
        };
        
        img.onerror = () => { loadedImages++; };
        img.onclick = () => openModal(i);

        // Frame indicator like '01A', '02A'
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
function updateModalControls() {
    prevBtn.disabled = currentIndex <= currentAlbum.start;
    nextBtn.disabled = currentIndex >= currentAlbum.end;
}

function openModal(index) {
    currentIndex = index;
    modalImg.classList.remove('loaded');
    
    // Preload full resolution invisibly
    const tempImg = new Image();
    tempImg.src = `${currentAlbum.folder}/${index}.webp`;
    tempImg.onload = () => {
        modalImg.src = tempImg.src;
        modalImg.classList.add('loaded');
    };

    exifDisplay.innerText = photoData[index] || "METADATA \n UNAVAILABLE";
    frameDisplay.innerText = `EXP ${index.toString().padStart(2, '0')}`;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    updateModalControls();
    resetZoom();
}

function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

/* --- ZOOM & PAN SYSTEM --- */
function updateTransform() {
    const viewWidth = viewport.clientWidth;
    const viewHeight = viewport.clientHeight;
    
    const scaledWidth = modalImg.clientWidth * scale;
    const scaledHeight = modalImg.clientHeight * scale;
    
    const maxTx = Math.max(0, (scaledWidth - viewWidth) / 2);
    const maxTy = Math.max(0, (scaledHeight - viewHeight) / 2);
    
    translateX = Math.max(-maxTx, Math.min(maxTx, translateX));
    translateY = Math.max(-maxTy, Math.min(maxTy, translateY));

    modalImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    zoomLevelText.innerText = `${Math.round(scale * 100)}%`;
    
    if (scale > 1) {
        modalImg.style.cursor = isDragging ? 'grabbing' : 'grab';
    } else {
        modalImg.style.cursor = 'default';
    }
}

function resetZoom() {
    scale = 1; translateX = 0; translateY = 0;
    updateTransform();
}

document.getElementById('zoom-in').onclick = () => { scale = Math.min(scale + 0.5, 4); updateTransform(); };
document.getElementById('zoom-out').onclick = () => { scale = Math.max(scale - 0.5, 1); updateTransform(); }; 

modalImg.ondblclick = () => {
    if (scale > 1) {
        resetZoom();
    } else {
        scale = 2;
        updateTransform();
    }
};

const viewport = document.getElementById('viewport');
viewport.onmousedown = (e) => {
    if (scale <= 1) return;
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    updateTransform();
};

window.onmousemove = (e) => {
    if (!isDragging) return;
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    updateTransform();
};

window.onmouseup = () => {
    isDragging = false;
    updateTransform();
};

/* --- GLOBAL LISTENERS --- */
prevBtn.onclick = () => { if (currentIndex > currentAlbum.start) openModal(currentIndex - 1); };
nextBtn.onclick = () => { if (currentIndex < currentAlbum.end) openModal(currentIndex + 1); };
document.getElementById('close-btn').onclick = closeModal;

window.onkeydown = (e) => {
    if (modal.classList.contains('hidden')) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft") prevBtn.click();
    if (e.key === "ArrowRight") nextBtn.click();
};

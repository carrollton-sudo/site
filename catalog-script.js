/* --- STATE & DATA --- */
let catalogData = { albums: [] };
let currentAlbum = { photos: [], folder: '', title: '' };
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

/* --- INITIALIZATION --- */
document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            catalogData = data;
            renderAlbums();
        })
        .catch(error => console.error("Error loading catalog data:", error));
});

function renderAlbums() {
    albumList.innerHTML = '';
    catalogData.albums.forEach(album => {
        const card = document.createElement('div');
        card.className = 'album-card';
        card.onclick = () => openAlbum(album.folder, album.photos, album.title);

        card.innerHTML = `
            <div class="album-cover" style="background-image: url('${album.folder}/${album.cover}');">
                <div class="inner-border"></div>
            </div>
            <div class="album-info">
                <h3>${album.title}</h3>
                <p>${album.photos.length} exposures</p>
            </div>
        `;
        albumList.appendChild(card);
    });
}

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
function openAlbum(folder, photos, title) {
    currentAlbum = { photos, folder, title };
    photoStream.innerHTML = '';
    
    const loader = document.getElementById('creative-loader');
    const loaderBar = document.getElementById('loader-bar');
    loader.classList.remove('hidden', 'opening');
    loaderBar.style.width = '0%';
    
    let loadedImages = 0;
    const totalImages = photos.length;
    
    let currentSheet = null;
    let currentStrip = null;
    let framesCount = 0;
    
    photos.forEach((photoObj, index) => {
        if (framesCount % 12 === 0) {
            currentSheet = document.createElement('div');
            currentSheet.className = 'contact-sheet';
            const sheetRot = (Math.random() * 2 - 1).toFixed(2);
            currentSheet.style.transform = `rotate(${sheetRot}deg)`;
            photoStream.appendChild(currentSheet);
        }

        if (framesCount % 4 === 0) {
            currentStrip = document.createElement('div');
            currentStrip.className = 'film-strip';
            const stripRot = (Math.random() * 1 - 0.5).toFixed(2);
            const stripOffsetY = (Math.random() * 4 - 2).toFixed(2);
            currentStrip.style.transform = `rotate(${stripRot}deg) translateY(${stripOffsetY}px)`;
            currentSheet.appendChild(currentStrip);
        }

        const frameDiv = document.createElement('div');
        frameDiv.className = 'contact-frame';

        const img = document.createElement('img');
        img.src = `${folder}/${photoObj.file}`;
        img.className = 'stream-img';
        img.loading = 'lazy';
        
        const updateLoader = () => {
            loaderBar.style.width = `${(loadedImages / totalImages) * 100}%`;
            if (loadedImages >= totalImages || loadedImages >= 4) {
                setTimeout(() => loader.classList.add('opening'), 400);
                setTimeout(() => loader.classList.add('hidden'), 1000);
            }
        };

        img.onload = () => {
            img.classList.add('loaded');
            loadedImages++;
            updateLoader();
        };

        img.onerror = () => {
            loadedImages++;
            updateLoader();
        };

        img.onclick = () => openModal(index);

        const frameNum = document.createElement('div');
        frameNum.className = 'frame-number';
        frameNum.innerText = (index + 1).toString().padStart(2, '0') + "A";

        frameDiv.appendChild(img);
        frameDiv.appendChild(frameNum);
        currentStrip.appendChild(frameDiv);

        framesCount++;
    });
    
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
    prevBtn.disabled = currentIndex <= 0;
    nextBtn.disabled = currentIndex >= currentAlbum.photos.length - 1;
}

function openModal(index) {
    currentIndex = index;
    modalImg.classList.remove('loaded');
    
    const photo = currentAlbum.photos[index];
    const tempImg = new Image();
    tempImg.src = `${currentAlbum.folder}/${photo.file}`;
    
    tempImg.onload = () => {
        modalImg.src = tempImg.src;
        modalImg.classList.add('loaded');
    };

    exifDisplay.innerText = photo.exif || "METADATA \n UNAVAILABLE";
    
    // Attempting to extract the actual exposure number from the filename if possible, otherwise use index
    const cleanFileName = photo.file.split('.')[0]; 
    frameDisplay.innerText = `EXP ${cleanFileName.padStart(2, '0')}`;
    
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
const viewport = document.getElementById('viewport');

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
prevBtn.onclick = () => { if (currentIndex > 0) openModal(currentIndex - 1); };
nextBtn.onclick = () => { if (currentIndex < currentAlbum.photos.length - 1) openModal(currentIndex + 1); };
document.getElementById('close-btn').onclick = closeModal;

window.onkeydown = (e) => {
    if (modal.classList.contains('hidden')) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowLeft") prevBtn.click();
    if (e.key === "ArrowRight") nextBtn.click();
};

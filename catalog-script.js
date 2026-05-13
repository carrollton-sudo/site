let catalogData = { albums: [] };
let currentAlbum = null;
let currentIndex = 0;
let scale = 1;
let isDragging = false;
let startX, startY, translateX = 0, translateY = 0;

const albumList = document.getElementById('album-list');
const photoStream = document.getElementById('photo-stream');
const photoViewer = document.getElementById('photo-viewer');
const catalogTitle = document.getElementById('catalog-title');
const navLink = document.getElementById('nav-link');
const modal = document.getElementById('photo-modal');
const modalImg = document.getElementById('modal-img');
const exifDisplay = document.getElementById('exif-data');
const frameDisplay = document.getElementById('frame-num');

document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(res => res.json())
        .then(data => {
            catalogData = data;
            renderAlbums();
        });
});

function renderAlbums() {
    albumList.innerHTML = '';
    catalogData.albums.forEach(album => {
        const card = document.createElement('div');
        card.className = 'album-card';
        card.onclick = () => openAlbum(album);
        card.innerHTML = `
            <div class="album-cover" style="background-image: url('${album.folder}/${album.cover}');">
                <div class="inner-border"></div>
            </div>
            <div class="album-info">
                <h3>${album.title}</h3>
                <p>${album.photos.length} exposures</p>
            </div>`;
        albumList.appendChild(card);
    });
}

function openAlbum(album) {
    currentAlbum = album;
    photoStream.innerHTML = '';
    
    const loader = document.getElementById('creative-loader');
    loader.classList.remove('hidden', 'opening');
    
    album.photos.forEach((photo, idx) => {
        // Simple logic to group into film strips (reusing your layout logic)
        const frameDiv = document.createElement('div');
        frameDiv.className = 'contact-frame';
        const img = document.createElement('img');
        img.src = `${album.folder}/${photo.file}`;
        img.className = 'stream-img';
        img.onclick = () => openModal(idx);
        
        frameDiv.appendChild(img);
        photoStream.appendChild(frameDiv);
    });

    catalogTitle.innerText = album.title;
    navLink.innerText = "← CLOSE ALBUM";
    navLink.onclick = (e) => { e.preventDefault(); closeAlbum(); };
    albumList.classList.add('hidden');
    photoViewer.classList.remove('hidden');
    setTimeout(() => loader.classList.add('hidden'), 800);
}

function closeAlbum() {
    location.reload(); // Simplest way to reset state
}

function openModal(index) {
    currentIndex = index;
    const photo = currentAlbum.photos[index];
    modalImg.src = `${currentAlbum.folder}/${photo.file}`;
    exifDisplay.innerText = photo.exif || "NO EXIF";
    frameDisplay.innerText = `EXP ${photo.file.replace('.webp', '')}`;
    modal.classList.remove('hidden');
    updateModalControls();
}

function updateModalControls() {
    document.getElementById('prev-btn').disabled = currentIndex === 0;
    document.getElementById('next-btn').disabled = currentIndex === currentAlbum.photos.length - 1;
}

document.getElementById('next-btn').onclick = () => { if(currentIndex < currentAlbum.photos.length -1) openModal(currentIndex + 1); };
document.getElementById('prev-btn').onclick = () => { if(currentIndex > 0) openModal(currentIndex - 1); };
document.getElementById('close-btn').onclick = () => modal.classList.add('hidden');

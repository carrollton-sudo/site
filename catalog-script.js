let catalogData = { albums: [] };
let currentAlbum = null;
let currentIndex = 0;

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
    fetch('config.json')
        .then(res => res.json())
        .then(data => {
            catalogData = data;
            renderAlbums();
        }).catch(e => {
            console.error("No config.json found.");
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
    
    // Create the visual Film Strip structure
    let currentSheet = null;
    let currentStrip = null;
    
    album.photos.forEach((photo, idx) => {
        if (idx % 12 === 0) {
            currentSheet = document.createElement('div');
            currentSheet.className = 'contact-sheet';
            photoStream.appendChild(currentSheet);
        }
        if (idx % 4 === 0) {
            currentStrip = document.createElement('div');
            currentStrip.className = 'film-strip';
            currentSheet.appendChild(currentStrip);
        }

        const frame = document.createElement('div');
        frame.className = 'contact-frame';
        
        const img = document.createElement('img');
        img.src = `${album.folder}/${photo.file}`;
        img.className = 'stream-img';
        
        // CRITICAL FIX: Make photos visible
        img.onload = () => img.classList.add('loaded');
        img.onclick = () => openModal(idx);
        
        const num = document.createElement('div');
        num.className = 'frame-number';
        num.innerText = `${idx + 1}A`;

        frame.appendChild(img);
        frame.appendChild(num);
        currentStrip.appendChild(frame);
    });

    catalogTitle.innerText = album.title;
    navLink.innerText = "← CLOSE";
    navLink.onclick = () => location.reload();
    
    albumList.classList.add('hidden');
    photoViewer.classList.remove('hidden');
    window.scrollTo(0,0);
}

function openModal(idx) {
    currentIndex = idx;
    const p = currentAlbum.photos[idx];
    modalImg.src = `${currentAlbum.folder}/${p.file}`;
    exifDisplay.innerText = p.exif || "NO METADATA";
    frameDisplay.innerText = `EXP ${p.file.split('.')[0]}`;
    modal.classList.remove('hidden');
}

document.getElementById('close-btn').onclick = () => modal.classList.add('hidden');
document.getElementById('next-btn').onclick = () => { if(currentIndex < currentAlbum.photos.length-1) openModal(currentIndex+1); };
document.getElementById('prev-btn').onclick = () => { if(currentIndex > 0) openModal(currentIndex-1); };

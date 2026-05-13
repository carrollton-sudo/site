let appData = { albums: [] };

function renderDashboard() {
    const container = document.getElementById('dashboard-container');
    container.innerHTML = '';

    appData.albums.forEach((album, albumIndex) => {
        const albumDiv = document.createElement('div');
        albumDiv.className = 'album-card';

        // Album Header Controls
        albumDiv.innerHTML = `
            <div class="album-header">
                <div class="input-group">
                    <label>Album Title</label>
                    <input type="text" value="${album.title}" onchange="updateAlbum(${albumIndex}, 'title', this.value)" placeholder="e.g. Origin I">
                </div>
                <div class="input-group">
                    <label>Folder Name</label>
                    <input type="text" value="${album.folder}" onchange="updateAlbum(${albumIndex}, 'folder', this.value)" placeholder="e.g. Album1">
                </div>
                <div class="input-group">
                    <label>Cover Photo (File Name)</label>
                    <input type="text" value="${album.cover || ''}" onchange="updateAlbum(${albumIndex}, 'cover', this.value)" placeholder="e.g. 4.webp">
                </div>
                <button class="btn danger" onclick="deleteAlbum(${albumIndex})">Delete Album</button>
            </div>
            <h4>Photos</h4>
            <div class="photo-list" id="photo-list-${albumIndex}"></div>
            <button class="btn secondary" style="margin-top: 15px;" onclick="addPhoto(${albumIndex})">+ Add Photo</button>
        `;

        container.appendChild(albumDiv);
        
        // Render Photos
        const photoList = document.getElementById(`photo-list-${albumIndex}`);
        album.photos.forEach((photo, photoIndex) => {
            const photoDiv = document.createElement('div');
            photoDiv.className = 'photo-item';
            
            photoDiv.innerHTML = `
                <div class="sort-controls">
                    <button onclick="movePhoto(${albumIndex}, ${photoIndex}, -1)">▲</button>
                    <button onclick="movePhoto(${albumIndex}, ${photoIndex}, 1)">▼</button>
                </div>
                <input type="text" value="${photo.file}" onchange="updatePhoto(${albumIndex}, ${photoIndex}, 'file', this.value)" placeholder="1.webp">
                <input type="text" class="exif" value="${photo.exif}" onchange="updatePhoto(${albumIndex}, ${photoIndex}, 'exif', this.value)" placeholder="EXIF string (e.g. Canon EOS...)">
                <button class="btn danger" onclick="deletePhoto(${albumIndex}, ${photoIndex})">X</button>
            `;
            photoList.appendChild(photoDiv);
        });
    });
}

// Data Manipulation
function addAlbum() {
    appData.albums.unshift({ title: 'New Album', folder: '', cover: '', photos: [] });
    renderDashboard();
}

function updateAlbum(index, key, value) { appData.albums[index][key] = value; }
function deleteAlbum(index) { if(confirm('Delete this album?')) { appData.albums.splice(index, 1); renderDashboard(); } }

function addPhoto(albumIndex) {
    appData.albums[albumIndex].photos.push({ file: '', exif: '' });
    renderDashboard();
}

function updatePhoto(albumIndex, photoIndex, key, value) { appData.albums[albumIndex].photos[photoIndex][key] = value; }
function deletePhoto(albumIndex, photoIndex) { appData.albums[albumIndex].photos.splice(photoIndex, 1); renderDashboard(); }

function movePhoto(albumIndex, photoIndex, direction) {
    const photos = appData.albums[albumIndex].photos;
    if (photoIndex + direction < 0 || photoIndex + direction >= photos.length) return;
    
    // Swap
    const temp = photos[photoIndex];
    photos[photoIndex] = photos[photoIndex + direction];
    photos[photoIndex + direction] = temp;
    renderDashboard();
}

// File I/O
function loadJson(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            appData = JSON.parse(e.target.result);
            renderDashboard();
        } catch (error) {
            alert("Error parsing JSON file. Make sure it's valid.");
        }
    };
    reader.readAsText(file);
}

function exportJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "data.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// Init empty state
renderDashboard();

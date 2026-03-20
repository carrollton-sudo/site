document.addEventListener('DOMContentLoaded', () => {
    const catalogBtn = document.getElementById('view-catalog');
    const fadeOverlay = document.getElementById('fade-overlay');

    // 1. Catalog Transition
    if (catalogBtn) {
        catalogBtn.addEventListener('click', () => {
            fadeOverlay.classList.add('visible');
            setTimeout(() => {
                window.location.href = 'catalog.html';
            }, 850);
        });
    }

    // 2. Horizontal Scroll Conversion (Desktop Only)
    window.addEventListener('wheel', (e) => {
        if (window.innerWidth > 768) {
            if (e.deltaY !== 0) {
                e.preventDefault();
                window.scrollBy({
                    left: e.deltaY * 1.5,
                    behavior: 'auto' 
                });
            }
        }
    }, { passive: false });
});
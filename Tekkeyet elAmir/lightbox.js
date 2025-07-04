// Lightbox functionality
document.addEventListener('DOMContentLoaded', function () {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const caption = document.getElementById('caption');
    const closeBtn = document.getElementById('closeLightbox');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    const galleryItems = document.querySelectorAll('.gallery-item');
    let currentIndex = 0;

    // Open lightbox when clicking a gallery image
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            currentIndex = index;
            updateLightbox();
            lightbox.style.display = 'block';
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        });
    });

    // Close lightbox
    closeBtn.addEventListener('click', () => {
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
    });

    // Click outside image to close
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.style.display = 'none';
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
        }
    });

    // Navigation
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigate(-1);
    });

    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigate(1);
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (lightbox.style.display === 'block') {
            if (e.key === 'Escape') {
                lightbox.style.display = 'none';
                document.body.style.overflow = 'auto';
                document.documentElement.style.overflow = 'auto';
            } else if (e.key === 'ArrowLeft') {
                navigate(-1);
            } else if (e.key === 'ArrowRight') {
                navigate(1);
            }
        }
    });

    // Touch events for mobile swipe
    let touchStartX = 0;
    let touchEndX = 0;

    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        if (touchStartX - touchEndX > 50) {
            // Swipe left
            navigate(1);
        } else if (touchEndX - touchStartX > 50) {
            // Swipe right
            navigate(-1);
        }
    }

    function navigate(direction) {
        currentIndex = (currentIndex + direction + galleryItems.length) % galleryItems.length;
        updateLightbox();
    }

    function updateLightbox() {
        const imgSrc = galleryItems[currentIndex].querySelector('img').src;
        const imgAlt = galleryItems[currentIndex].querySelector('img').alt || '';

        lightboxImg.src = imgSrc;
        caption.textContent = imgAlt;

        // Preload next and previous images for smoother transitions
        const nextIndex = (currentIndex + 1) % galleryItems.length;
        const prevIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;

        const nextImg = new Image();
        nextImg.src = galleryItems[nextIndex].querySelector('img').src;

        const prevImg = new Image();
        prevImg.src = galleryItems[prevIndex].querySelector('img').src;
    }
});
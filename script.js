// ===== Circular Favicon from Profile Photo =====
(function generateFavicon() {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = 'images/profile.jpg';
    img.onload = function () {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Draw circular clip
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Crop from center-bottom of image (where face is)
        const srcSize = Math.min(img.width, img.height);
        const srcX = (img.width - srcSize) / 2;
        const srcY = img.height - srcSize; // bottom crop for face
        ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, size, size);

        // Set as favicon
        const link = document.querySelector("link[rel='icon']") || document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        link.href = canvas.toDataURL('image/png');
        document.head.appendChild(link);
    };
})();

// Portfolio interaction logic
let isWorkVisible = false;

function toggleWork() {
    const heroPanel = document.getElementById('hero-panel');
    const workPanel = document.getElementById('work-panel');

    isWorkVisible = !isWorkVisible;

    if (isWorkVisible) {
        heroPanel.classList.add('shrink');
        workPanel.classList.add('show');
    } else {
        workPanel.classList.remove('show');
        heroPanel.classList.remove('shrink');
    }
}

// Theme toggle
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');

    if (currentTheme === 'light') {
        body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'dark');
    } else {
        body.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    }
}

// Load saved theme on page load
(function () {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.setAttribute('data-theme', 'light');
    }
})();

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isWorkVisible) {
        toggleWork();
    }
});

// Smooth stagger animation for work items when panel opens
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.target.classList.contains('show')) {
            const items = document.querySelectorAll('.work-item');
            items.forEach((item, index) => {
                item.style.opacity = '0';
                item.style.transform = 'translateY(8px)';
                item.style.transition = `opacity 0.4s ease ${0.4 + index * 0.05}s, transform 0.4s ease ${0.4 + index * 0.05}s`;

                requestAnimationFrame(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                });
            });
        }
    });
});

const workPanel = document.getElementById('work-panel');
if (workPanel) {
    observer.observe(workPanel, {
        attributes: true,
        attributeFilter: ['class'],
    });
}

// ===== Custom Cursor =====
const cursorDot = document.getElementById('cursorDot');
const cursorRing = document.getElementById('cursorRing');

if (cursorDot && cursorRing) {
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    // Track mouse position
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Dot follows instantly
        cursorDot.style.left = mouseX + 'px';
        cursorDot.style.top = mouseY + 'px';
    });

    // Ring follows with smooth delay
    function animateRing() {
        ringX += (mouseX - ringX) * 0.15;
        ringY += (mouseY - ringY) * 0.15;

        cursorRing.style.left = ringX + 'px';
        cursorRing.style.top = ringY + 'px';

        requestAnimationFrame(animateRing);
    }
    animateRing();

    // Hover effect on clickable elements
    const hoverTargets = document.querySelectorAll('a, button, .social-link, .view-work-btn, .back-btn, .theme-toggle, .work-item-name');

    hoverTargets.forEach((el) => {
        el.addEventListener('mouseenter', () => {
            cursorDot.classList.add('hovering');
            cursorRing.classList.add('hovering');
        });
        el.addEventListener('mouseleave', () => {
            cursorDot.classList.remove('hovering');
            cursorRing.classList.remove('hovering');
        });
    });

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
        cursorDot.style.opacity = '0';
        cursorRing.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
        cursorDot.style.opacity = '1';
        cursorRing.style.opacity = '1';
    });
}

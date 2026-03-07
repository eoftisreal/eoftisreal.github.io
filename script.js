const apiKey = "081d831bc57b8a3e95b7a73f3328060e";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";

// --- Theme Toggle Logic ---
const themeToggleBtn = document.getElementById("themeToggle");
const currentTheme = localStorage.getItem("theme");

// Default to dark theme (cinematic aesthetic)
if (currentTheme === "light") {
    document.body.setAttribute("data-theme", "light");
    themeToggleBtn.textContent = "🌙";
} else {
    localStorage.setItem("theme", "dark");
    themeToggleBtn.textContent = "☀️";
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
        let theme = document.body.getAttribute("data-theme");
        if (theme === "light") {
            document.body.removeAttribute("data-theme");
            localStorage.setItem("theme", "dark");
            themeToggleBtn.textContent = "☀️";
        } else {
            document.body.setAttribute("data-theme", "light");
            localStorage.setItem("theme", "light");
            themeToggleBtn.textContent = "🌙";
        }
    });
}

// --- Particle System for Atmospheric Background ---
(function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    const PARTICLE_COUNT = 60;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.5 + 0.3,
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: (Math.random() - 0.5) * 0.2,
            opacity: Math.random() * 0.4 + 0.1,
            pulseSpeed: Math.random() * 0.02 + 0.005,
            pulsePhase: Math.random() * Math.PI * 2
        };
    }

    function init() {
        resize();
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(createParticle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;
            p.pulsePhase += p.pulseSpeed;

            // Wrap around
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            const pulse = Math.sin(p.pulsePhase) * 0.3 + 0.7;
            const alpha = p.opacity * pulse;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 106, 0, ${alpha})`;
            ctx.fill();

            // Glow effect
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 106, 0, ${alpha * 0.1})`;
            ctx.fill();
        });

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    init();
    animate();
})();


// --- Cinematic Parallax 3D Effect ---
let mouseX = 0, mouseY = 0;
let targetMouseX = 0, targetMouseY = 0;
const PARALLAX_SMOOTHING = 0.06;

document.addEventListener("mousemove", (e) => {
    targetMouseX = e.clientX / window.innerWidth - 0.5;
    targetMouseY = e.clientY / window.innerHeight - 0.5;
});

function smoothParallax() {
    // Smooth interpolation for cinematic feel
    mouseX += (targetMouseX - mouseX) * PARALLAX_SMOOTHING;
    mouseY += (targetMouseY - mouseY) * PARALLAX_SMOOTHING;

    const x = mouseX;
    const y = mouseY;

    // Move orbs with depth layers
    const orb1 = document.querySelector(".orb-1");
    const orb2 = document.querySelector(".orb-2");
    const orb3 = document.querySelector(".orb-3");

    if (orb1) orb1.style.transform = `translate(${x * -60}px, ${y * -60}px)`;
    if (orb2) orb2.style.transform = `translate(${x * 80}px, ${y * 80}px)`;
    if (orb3) orb3.style.transform = `translate(${x * -40}px, ${y * -40}px)`;

    // Floating hero elements with depth parallax
    const fl1 = document.querySelector(".fl-1");
    const fl2 = document.querySelector(".fl-2");
    const portrait = document.querySelector(".portrait-placeholder");

    if (fl1) fl1.style.transform = `translate(${x * 50}px, ${y * 50}px)`;
    if (fl2) fl2.style.transform = `translate(${x * -50}px, ${y * -50}px)`;
    if (portrait) portrait.style.transform = `translate(${x * 15}px, ${y * 15}px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg)`;

    // Technical labels subtle movement
    const labels = document.querySelectorAll('.tech-label');
    labels.forEach((label, i) => {
        const depth = (i + 1) * 8;
        label.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
    });

    requestAnimationFrame(smoothParallax);
}
smoothParallax();


// --- Navbar Scroll Effects ---
(function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        // Intensify navbar on scroll
        if (scrollY > 100) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }

        lastScroll = scrollY;
    }, { passive: true });
})();


// Updated Selectors for new layout
const searchBox = document.querySelector(".search-compact input");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const weatherIcon = document.querySelector(".weather-icon-small");
const weatherContainer = document.querySelector(".weather");
const errorContainer = document.querySelector(".error");

// PDF Elements
const pdfInput = document.getElementById('pdfInput');
const processBtn = document.getElementById('processBtn');
const fileNameDisplay = document.getElementById('fileName');
const statusDiv = document.getElementById('status');

// Random Cities
const cities = [
    "London", "New York", "Tokyo", "Paris", "Sydney", "Dubai", "Singapore",
    "Rome", "Cairo", "Moscow", "Toronto", "Rio de Janeiro", "Mumbai",
    "Beijing", "Los Angeles", "Berlin", "Madrid", "Istanbul", "Bangkok", "Seoul"
];

// PDF-Lib from CDN
const { PDFDocument, degrees } = PDFLib;

// --- Weather Functions ---

function updateBackground(weatherMain) {
    // Cinematic theme keeps the atmospheric background untouched
}

function updateWeatherUI(data) {
    document.querySelector(".city").innerHTML = data.name;
    document.querySelector(".temp").innerHTML = Math.round(data.main.temp) + "°c";

    const weatherMain = data.weather[0].main;
    let iconSrc = "images/clear.png";

    if (weatherMain === "Clouds") iconSrc = "images/clouds.png";
    else if (weatherMain === "Clear") iconSrc = "images/clear.png";
    else if (weatherMain === "Rain") iconSrc = "images/rain.png";
    else if (weatherMain === "Drizzle") iconSrc = "images/drizzle.png";
    else if (weatherMain === "Mist") iconSrc = "images/mist.png";
    else if (weatherMain === "Snow") iconSrc = "images/snow.png";

    if (weatherIcon) weatherIcon.src = iconSrc;
    updateBackground(weatherMain);
    if (errorContainer) errorContainer.style.display = "none";
}

async function checkWeather(city) {
    try {
        const response = await fetch(apiUrl + city + `&appid=${apiKey}`);
        if (!response.ok) {
            if (errorContainer) errorContainer.style.display = "block";
            console.warn("City not found or API error");
        } else {
            const data = await response.json();
            updateWeatherUI(data);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

function getRandomCity() {
    return cities[Math.floor(Math.random() * cities.length)];
}

window.addEventListener('DOMContentLoaded', () => {
    checkWeather(getRandomCity());

    // Cinematic scroll reveal with staggered timing
    const revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });

        revealElements.forEach(el => revealObserver.observe(el));
    }

    // Scroll-driven section parallax (disabled on mobile for better visibility)
    const sections = document.querySelectorAll('main > section, main > .content-split, main > .tech-divider');
    const SCROLL_SCALE_FACTOR = 0.02;
    const SCROLL_OPACITY_FACTOR = 0.15;
    window.addEventListener('scroll', () => {
        if (window.innerWidth <= 900) return;
        const scrollY = window.scrollY;
        const windowH = window.innerHeight;

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const centerOffset = (rect.top + rect.height / 2 - windowH / 2) / windowH;
            const scale = 1 - Math.abs(centerOffset) * SCROLL_SCALE_FACTOR;
            const opacity = 1 - Math.abs(centerOffset) * SCROLL_OPACITY_FACTOR;
            section.style.transform = `scale(${Math.max(0.96, scale)})`;
            section.style.opacity = Math.max(0.7, opacity);
        });
    }, { passive: true });
});

if (searchBtn) {
    searchBtn.addEventListener("click", () => {
        if(searchBox.value) checkWeather(searchBox.value);
    });
}

if (searchBox) {
    searchBox.addEventListener("keypress", (event) => {
        if (event.key === "Enter" && searchBox.value) {
            checkWeather(searchBox.value);
        }
    });
}

if (locationBtn) {
    locationBtn.addEventListener("click", () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    const url = `https://api.openweathermap.org/data/2.5/weather?units=metric&lat=${lat}&lon=${lon}&appid=${apiKey}`;
                    try {
                        const response = await fetch(url);
                        const data = await response.json();
                        updateWeatherUI(data);
                    } catch(e) { console.error(e); }
                },
                () => alert("Unable to retrieve location.")
            );
        } else {
            alert("Geolocation not supported.");
        }
    });
}


// --- PDF Logic ---

// Page size definitions (in points)
const PAGE_SIZES = {
    'a4-portrait':      { width: 595.28, height: 841.89 },
    'a4-landscape':     { width: 841.89, height: 595.28 },
    'a5-portrait':      { width: 419.53, height: 595.28 },
    'a5-landscape':     { width: 595.28, height: 419.53 },
    'letter-portrait':  { width: 612,    height: 792    },
    'letter-landscape': { width: 792,    height: 612    },
    'legal-portrait':   { width: 612,    height: 1008   },
    'legal-landscape':  { width: 1008,   height: 612    },
};

/**
 * Parse an "unchanged pages" string like "1", "1-3", "1,4,6", "1-3,7"
 * into a Set of 0-based page indices.
 */
function parseUnchangedPages(input, totalPages) {
    const pages = new Set();
    if (!input || !input.trim()) return pages;
    const parts = input.split(',');
    for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
            const [startStr, endStr] = trimmed.split('-');
            const start = parseInt(startStr, 10);
            const end = parseInt(endStr, 10);
            if (!isNaN(start) && !isNaN(end)) {
                for (let p = Math.max(1, start); p <= Math.min(end, totalPages); p++) {
                    pages.add(p - 1); // convert to 0-based
                }
            }
        } else {
            const p = parseInt(trimmed, 10);
            if (!isNaN(p) && p >= 1 && p <= totalPages) {
                pages.add(p - 1); // convert to 0-based
            }
        }
    }
    return pages;
}

if (pdfInput) {
    pdfInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            fileNameDisplay.textContent = file.name;
            processBtn.disabled = false;
        } else {
            fileNameDisplay.textContent = "No file chosen";
            processBtn.disabled = true;
        }
    });
}

if (processBtn) {
    processBtn.addEventListener('click', async () => {
        const file = pdfInput.files[0];
        if (!file) return;

        try {
            statusDiv.textContent = "Processing...";
            processBtn.disabled = true;
            document.body.style.cursor = "wait";

            // Read user options
            const rotationAngle = parseInt(document.getElementById('rotationAngle').value, 10);
            const pageSizeKey = document.getElementById('pageSize').value;
            const pagesPerSheet = parseInt(document.getElementById('pagesPerSheet').value, 10);
            const unchangedInput = document.getElementById('unchangedPages').value;

            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const newPdf = await PDFDocument.create();

            const totalPages = pdfDoc.getPageCount();
            const unchangedSet = parseUnchangedPages(unchangedInput, totalPages);

            const { width: PAGE_WIDTH, height: PAGE_HEIGHT } = PAGE_SIZES[pageSizeKey];
            const PADDING = 0;

            // Compute grid layout based on pagesPerSheet
            let cols, rows;
            if (pagesPerSheet === 1) { cols = 1; rows = 1; }
            else if (pagesPerSheet === 2) { cols = 1; rows = 2; }
            else { cols = 2; rows = 2; } // 4-up

            const slotW = (PAGE_WIDTH - (cols + 1) * PADDING) / cols;
            const slotH = (PAGE_HEIGHT - (rows + 1) * PADDING) / rows;

            // Separate pages into unchanged (copied as-is) and processed
            const processedIndices = [];
            for (let i = 0; i < totalPages; i++) {
                if (unchangedSet.has(i)) {
                    const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
                    newPdf.addPage(copiedPage);
                } else {
                    processedIndices.push(i);
                }
            }

            // Process remaining pages in groups of pagesPerSheet
            for (let g = 0; g < processedIndices.length; g += pagesPerSheet) {
                const group = processedIndices.slice(g, g + pagesPerSheet);

                // If only 1 page remains for a multi-up sheet, keep it as-is
                if (group.length === 1 && pagesPerSheet > 1) {
                    const [lastPage] = await newPdf.copyPages(pdfDoc, [group[0]]);
                    newPdf.addPage(lastPage);
                    continue;
                }

                const newPage = newPdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

                for (let j = 0; j < group.length; j++) {
                    const srcIdx = group[j];
                    const srcPage = pdfDoc.getPages()[srcIdx];
                    const [embedded] = await newPdf.embedPages([srcPage]);

                    const { width: rawW, height: rawH } = srcPage.getSize();

                    // Normalize existing /Rotate value
                    const srcRot = ((srcPage.getRotation().angle % 360) + 360) % 360;

                    // Total rotation = source /Rotate + user-chosen layout rotation
                    const layoutRotation = rotationAngle;
                    const totalRotation = (srcRot + layoutRotation) % 360;

                    // Final visual dimensions after total rotation
                    const isTotalRotated = (totalRotation === 90 || totalRotation === 270);
                    const finalVisW = isTotalRotated ? rawH : rawW;
                    const finalVisH = isTotalRotated ? rawW : rawH;

                    // Scale to fit within slot
                    const scale = Math.min(slotW / finalVisW, slotH / finalVisH);

                    const sw = rawW * scale;
                    const sh = rawH * scale;

                    // Determine grid position for this page in the sheet
                    let col, row;
                    if (pagesPerSheet === 1) {
                        col = 0; row = 0;
                    } else if (pagesPerSheet === 2) {
                        col = 0; row = j; // vertical stack
                    } else {
                        // 4-up: row-major order
                        col = j % 2;
                        row = Math.floor(j / 2);
                    }

                    // Slot center
                    const cx = PADDING + slotW * col + slotW / 2;
                    const cy = PAGE_HEIGHT - (PADDING + slotH * row + slotH / 2);

                    // Anchor position based on total rotation angle
                    let x, y;
                    switch (totalRotation) {
                        case 90:
                            x = cx + sh / 2;
                            y = cy - sw / 2;
                            break;
                        case 180:
                            x = cx + sw / 2;
                            y = cy + sh / 2;
                            break;
                        case 270:
                            x = cx - sh / 2;
                            y = cy + sw / 2;
                            break;
                        default: // 0
                            x = cx - sw / 2;
                            y = cy - sh / 2;
                            break;
                    }

                    newPage.drawPage(embedded, {
                        x: x,
                        y: y,
                        xScale: scale,
                        yScale: scale,
                        rotate: degrees(totalRotation)
                    });
                }
            }

            const pdfBytes = await newPdf.save();
            const baseName = file.name.replace(/\.pdf$/i, '');
            downloadPDF(pdfBytes, baseName + "_updated.pdf");

            statusDiv.textContent = "Done! Downloading...";
            document.body.style.cursor = "default";
            processBtn.disabled = false;

        } catch (error) {
            console.error(error);
            statusDiv.textContent = "Error: " + error.message;
            document.body.style.cursor = "default";
            processBtn.disabled = false;
        }
    });
}

function downloadPDF(bytes, filename) {
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

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
    // Skip particles on mobile (hidden via CSS, avoid JS overhead)
    if (window.innerWidth <= 900) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    const PARTICLE_COUNT = 60;

    let resizeTimer;
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function debouncedResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 150);
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
        // Skip rendering when tab is not visible
        if (document.hidden) {
            requestAnimationFrame(animate);
            return;
        }

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

    window.addEventListener('resize', debouncedResize);
    init();
    animate();
})();


// --- Cinematic Parallax 3D Effect ---
let mouseX = 0, mouseY = 0;
let targetMouseX = 0, targetMouseY = 0;
const PARALLAX_SMOOTHING = 0.06;

// Cache DOM elements outside the animation loop to avoid repeated queries
const cachedOrb1 = document.querySelector(".orb-1");
const cachedOrb2 = document.querySelector(".orb-2");
const cachedOrb3 = document.querySelector(".orb-3");
const cachedFl1 = document.querySelector(".fl-1");
const cachedFl2 = document.querySelector(".fl-2");
const cachedPortrait = document.querySelector(".portrait-placeholder");
const cachedLabels = document.querySelectorAll('.tech-label');

document.addEventListener("mousemove", (e) => {
    targetMouseX = e.clientX / window.innerWidth - 0.5;
    targetMouseY = e.clientY / window.innerHeight - 0.5;
}, { passive: true });

function smoothParallax() {
    // Skip parallax on mobile devices
    if (window.innerWidth <= 900) {
        requestAnimationFrame(smoothParallax);
        return;
    }

    // Smooth interpolation for cinematic feel
    mouseX += (targetMouseX - mouseX) * PARALLAX_SMOOTHING;
    mouseY += (targetMouseY - mouseY) * PARALLAX_SMOOTHING;

    const x = mouseX;
    const y = mouseY;

    // Move orbs with depth layers (using cached references)
    if (cachedOrb1) cachedOrb1.style.transform = `translate(${x * -60}px, ${y * -60}px)`;
    if (cachedOrb2) cachedOrb2.style.transform = `translate(${x * 80}px, ${y * 80}px)`;
    if (cachedOrb3) cachedOrb3.style.transform = `translate(${x * -40}px, ${y * -40}px)`;

    // Floating hero elements with depth parallax (using cached references)
    if (cachedFl1) cachedFl1.style.transform = `translate(${x * 50}px, ${y * 50}px)`;
    if (cachedFl2) cachedFl2.style.transform = `translate(${x * -50}px, ${y * -50}px)`;
    if (cachedPortrait) cachedPortrait.style.transform = `translate(${x * 15}px, ${y * 15}px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg)`;

    // Technical labels subtle movement (using cached NodeList)
    cachedLabels.forEach((label, i) => {
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
const resetBtn = document.getElementById('resetBtn');
const fileNameDisplay = document.getElementById('fileName');
const pageInfoSpan = document.getElementById('pageInfo');
const statusDiv = document.getElementById('status');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');

// Random Cities
const cities = [
    "London", "New York", "Tokyo", "Paris", "Sydney", "Dubai", "Singapore",
    "Rome", "Cairo", "Moscow", "Toronto", "Rio de Janeiro", "Mumbai",
    "Beijing", "Los Angeles", "Berlin", "Madrid", "Istanbul", "Bangkok", "Seoul"
];

// PDF-Lib loaded async from CDN — destructure lazily when needed

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

    // --- Portfolio Toggle Logic ---
    const togglePortfolioBtn = document.getElementById('togglePortfolioBtn');
    const portfolioContent = document.getElementById('portfolioContent');

    if (togglePortfolioBtn && portfolioContent) {
        togglePortfolioBtn.addEventListener('click', () => {
            if (portfolioContent.style.display === 'none') {
                portfolioContent.style.display = 'block';
                togglePortfolioBtn.textContent = '[-] Hide Portfolio Sections';
                // Trigger resize event to potentially fix parallax/particle offsets if needed
                window.dispatchEvent(new Event('resize'));
                // Trigger IntersectionObserver for newly revealed elements
                document.querySelectorAll('.reveal').forEach(el => el.classList.remove('visible'));
                setTimeout(() => window.dispatchEvent(new Event('scroll')), 100);
            } else {
                portfolioContent.style.display = 'none';
                togglePortfolioBtn.textContent = '[+] Reveal Portfolio Sections';
            }
        });
    }

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
    let scrollRAFId = null;

    function updateSectionParallax() {
        scrollRAFId = null;
        const windowH = window.innerHeight;

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const centerOffset = (rect.top + rect.height / 2 - windowH / 2) / windowH;
            const scale = 1 - Math.abs(centerOffset) * SCROLL_SCALE_FACTOR;
            const opacity = 1 - Math.abs(centerOffset) * SCROLL_OPACITY_FACTOR;
            section.style.transform = `scale(${Math.max(0.96, scale)})`;
            section.style.opacity = Math.max(0.7, opacity);
        });
    }

    window.addEventListener('scroll', () => {
        if (window.innerWidth <= 900) return;
        // Debounce with requestAnimationFrame to avoid layout thrashing
        if (!scrollRAFId) {
            scrollRAFId = requestAnimationFrame(updateSectionParallax);
        }
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


// --- Link Resolver Logic ---
const resolverServerUrlInput = document.getElementById('resolverServerUrl');
const resolverUrlInput = document.getElementById('resolverUrl');
const resolverScanBtn = document.getElementById('resolverScanBtn');
const resolverScanStatus = document.getElementById('resolverScanStatus');
const resolverButtonsList = document.getElementById('resolverButtonsList');
const resolverCheckboxes = document.getElementById('resolverCheckboxes');
const resolverResolveBtn = document.getElementById('resolverResolveBtn');
const resolverResults = document.getElementById('resolverResults');
const resolverResultsContent = document.getElementById('resolverResultsContent');

function getResolverServerBase() {
    return (resolverServerUrlInput ? resolverServerUrlInput.value.trim() : '').replace(/\/$/, '');
}

if (resolverScanBtn) {
    resolverScanBtn.addEventListener('click', async () => {
        const url = resolverUrlInput.value.trim();
        if (!url) {
            resolverScanStatus.textContent = "Please enter a valid URL.";
            return;
        }

        const serverBase = getResolverServerBase();

        resolverScanStatus.textContent = "Scanning page (this may take a few seconds)...";
        resolverScanBtn.disabled = true;
        resolverButtonsList.style.display = 'none';
        resolverResults.style.display = 'none';

        try {
            const response = await fetch(`${serverBase}/api/scan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url })
            });

            const data = await response.json();

            if (data.error) {
                resolverScanStatus.textContent = "Error: " + data.error;
            } else if (data.buttons && data.buttons.length > 0) {
                resolverScanStatus.textContent = `Found ${data.buttons.length} buttons.`;
                resolverCheckboxes.innerHTML = '';

                data.buttons.forEach((btn, index) => {
                    const div = document.createElement('div');
                    div.style.marginBottom = '8px';
                    div.style.display = 'flex';
                    div.style.alignItems = 'center';

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = `btn_${index}`;
                    checkbox.value = btn.id;
                    checkbox.style.marginRight = '10px';

                    const label = document.createElement('label');
                    label.htmlFor = `btn_${index}`;
                    label.textContent = `${btn.text} (Y-Pos: ${btn.y})`;
                    label.style.cursor = 'pointer';
                    label.style.fontSize = '14px';

                    div.appendChild(checkbox);
                    div.appendChild(label);
                    resolverCheckboxes.appendChild(div);
                });

                resolverButtonsList.style.display = 'block';
            } else {
                resolverScanStatus.textContent = "No valid buttons found on this page.";
            }
        } catch (error) {
            resolverScanStatus.textContent = "Error connecting to server. Make sure the backend (server.py) is running and the server URL above is correct.";
            console.error(error);
        } finally {
            resolverScanBtn.disabled = false;
        }
    });
}

if (resolverResolveBtn) {
    resolverResolveBtn.addEventListener('click', async () => {
        const url = resolverUrlInput.value.trim();
        const selectedCheckboxes = document.querySelectorAll('#resolverCheckboxes input[type="checkbox"]:checked');

        if (selectedCheckboxes.length === 0) {
            alert("Please select at least one button to resolve.");
            return;
        }

        const indices = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));
        const serverBase = getResolverServerBase();

        resolverResolveBtn.disabled = true;
        resolverScanStatus.textContent = "Resolving links... This may take up to a minute.";
        resolverResults.style.display = 'none';
        resolverResultsContent.innerHTML = '';

        try {
            const response = await fetch(`${serverBase}/api/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url, indices: indices })
            });

            const data = await response.json();

            if (data.error) {
                resolverScanStatus.textContent = "Error: " + data.error;
            } else if (data.results) {
                resolverScanStatus.textContent = "Resolution complete.";
                resolverResults.style.display = 'block';

                data.results.forEach(res => {
                    const div = document.createElement('div');
                    div.style.marginBottom = '10px';
                    div.style.padding = '10px';
                    div.style.background = 'rgba(255,255,255,0.05)';
                    div.style.borderRadius = '4px';

                    const title = document.createElement('div');
                    title.style.fontWeight = 'bold';
                    title.textContent = `Button: ${res.text || 'Unknown'} (Index ${res.index})`;
                    div.appendChild(title);

                    const content = document.createElement('div');
                    content.style.marginTop = '5px';
                    content.style.wordBreak = 'break-all';

                    if (res.status === 'success') {
                        const safeUrl = (typeof res.url === 'string' && /^https?:\/\//i.test(res.url)) ? res.url : '';
                        const link = document.createElement('a');
                        link.setAttribute('href', safeUrl);
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                        link.style.color = '#64B5F6';
                        link.textContent = safeUrl || res.url;
                        const successLabel = document.createElement('span');
                        successLabel.style.color = '#4CAF50';
                        successLabel.textContent = '✅ Success: ';
                        content.appendChild(successLabel);
                        content.appendChild(link);
                    } else {
                        content.textContent = '';
                        const errLabel = document.createElement('span');
                        errLabel.style.color = '#F44336';
                        errLabel.textContent = '❌ Error: ';
                        const errMsg = document.createTextNode(res.message);
                        content.appendChild(errLabel);
                        content.appendChild(errMsg);
                    }
                    div.appendChild(content);

                    resolverResultsContent.appendChild(div);
                });
            }
        } catch (error) {
            resolverScanStatus.textContent = "Error connecting to server. Make sure the backend (server.py) is running and the server URL above is correct.";
            console.error(error);
        } finally {
            resolverResolveBtn.disabled = false;
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

function resetPdfTool() {
    if (pdfInput) pdfInput.value = '';
    if (fileNameDisplay) fileNameDisplay.textContent = 'No file chosen';
    if (pageInfoSpan) pageInfoSpan.textContent = '';
    if (processBtn) processBtn.disabled = true;
    if (statusDiv) { statusDiv.textContent = ''; statusDiv.className = ''; }
    if (progressBar) progressBar.style.display = 'none';
    if (progressFill) progressFill.style.width = '0%';
    document.body.style.cursor = 'default';
}

function setProgress(current, total) {
    if (!progressBar || !progressFill) return;
    progressBar.style.display = 'block';
    progressFill.style.width = total > 0 ? Math.round((current / total) * 100) + '%' : '0%';
}

if (pdfInput) {
    pdfInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const BYTES_PER_MB = 1024 * 1024;
            const size = file.size >= BYTES_PER_MB
                ? (file.size / BYTES_PER_MB).toFixed(1) + ' MB'
                : Math.ceil(file.size / 1024) + ' KB';
            fileNameDisplay.textContent = file.name;
            if (pageInfoSpan) pageInfoSpan.textContent = size;
            processBtn.disabled = false;
            if (statusDiv) { statusDiv.textContent = ''; statusDiv.className = ''; }
            if (progressBar) progressBar.style.display = 'none';
        } else {
            fileNameDisplay.textContent = 'No file chosen';
            if (pageInfoSpan) pageInfoSpan.textContent = '';
            processBtn.disabled = true;
        }
    });
}

if (resetBtn) {
    resetBtn.addEventListener('click', resetPdfTool);
}

if (processBtn) {
    processBtn.addEventListener('click', async () => {
        const file = pdfInput.files[0];
        if (!file) return;

        // Lazy-load PDFLib (loaded async, may not be ready at page load)
        if (typeof PDFLib === 'undefined') {
            statusDiv.textContent = "⚠️ PDF library is still loading, please try again in a moment.";
            return;
        }
        const { PDFDocument, degrees } = PDFLib;

        try {
            statusDiv.textContent = "Loading PDF…";
            statusDiv.className = '';
            if (progressBar) progressBar.style.display = 'none';
            processBtn.disabled = true;
            document.body.style.cursor = "wait";
            const rotationAngle = ((parseFloat(document.getElementById('rotationAngle').value) || 0) % 360 + 360) % 360;
            const pageSizeKey = document.getElementById('pageSize').value;
            const pagesPerSheet = parseInt(document.getElementById('pagesPerSheet').value, 10);
            const unchangedInput = document.getElementById('unchangedPages').value;

            const arrayBuffer = await file.arrayBuffer();
            // ignoreEncryption allows loading password-protected or restricted PDFs
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            const newPdf = await PDFDocument.create();

            const totalPages = pdfDoc.getPageCount();
            const unchangedSet = parseUnchangedPages(unchangedInput, totalPages);

            statusDiv.textContent = `Loaded ${totalPages} page${totalPages !== 1 ? 's' : ''}. Building output…`;

            // Compute grid layout (cols/rows depend only on pagesPerSheet, not page size)
            let cols, rows;
            if (pagesPerSheet === 1) { cols = 1; rows = 1; }
            else if (pagesPerSheet === 2) { cols = 1; rows = 2; }
            else { cols = 2; rows = 2; } // 4-up

            // Build an ordered list of operations that respects document order.
            // Unchanged pages act as group boundaries — they prevent processed
            // pages on either side of them from being merged into the same sheet.
            const operations = [];
            let currentGroup = [];

            for (let i = 0; i < totalPages; i++) {
                if (unchangedSet.has(i)) {
                    // Flush any buffered processed pages before the unchanged page
                    if (currentGroup.length > 0) {
                        operations.push({ type: 'process', indices: [...currentGroup] });
                        currentGroup = [];
                    }
                    operations.push({ type: 'unchanged', index: i });
                } else {
                    currentGroup.push(i);
                    if (currentGroup.length === pagesPerSheet) {
                        operations.push({ type: 'process', indices: [...currentGroup] });
                        currentGroup = [];
                    }
                }
            }
            // Flush any remaining processed pages at the end of the document
            if (currentGroup.length > 0) {
                operations.push({ type: 'process', indices: [...currentGroup] });
            }

            // Execute operations in document order
            for (let opIdx = 0; opIdx < operations.length; opIdx++) {
                const op = operations[opIdx];

                // Update progress
                setProgress(opIdx, operations.length);
                statusDiv.textContent = `Processing… (${opIdx + 1} / ${operations.length})`;

                if (op.type === 'unchanged') {
                    const [copiedPage] = await newPdf.copyPages(pdfDoc, [op.index]);
                    newPdf.addPage(copiedPage);
                    continue;
                }

                const group = op.indices;

                // If only 1 page remains for a multi-up sheet, keep it as-is
                if (group.length === 1 && pagesPerSheet > 1) {
                    const [lastPage] = await newPdf.copyPages(pdfDoc, [group[0]]);
                    newPdf.addPage(lastPage);
                    continue;
                }

                // Determine output sheet dimensions for this group.
                // "original" uses the CropBox of the first group page after rotation.
                let sheetW, sheetH;
                if (pageSizeKey === 'original') {
                    const refPage = pdfDoc.getPages()[group[0]];
                    const refCropBox = typeof refPage.getCropBox === 'function'
                        ? refPage.getCropBox()
                        : { x: 0, y: 0, ...refPage.getSize() };
                    const refSrcRot = ((refPage.getRotation().angle % 360) + 360) % 360;
                    const refTotal = (refSrcRot + rotationAngle) % 360;
                    const refθ = refTotal * Math.PI / 180;
                    sheetW = Math.abs(refCropBox.width * Math.cos(refθ)) + Math.abs(refCropBox.height * Math.sin(refθ));
                    sheetH = Math.abs(refCropBox.width * Math.sin(refθ)) + Math.abs(refCropBox.height * Math.cos(refθ));
                } else {
                    sheetW = PAGE_SIZES[pageSizeKey].width;
                    sheetH = PAGE_SIZES[pageSizeKey].height;
                }

                const slotW = sheetW / cols;
                const slotH = sheetH / rows;

                const newPage = newPdf.addPage([sheetW, sheetH]);

                for (let j = 0; j < group.length; j++) {
                    const srcIdx = group[j];
                    const srcPage = pdfDoc.getPages()[srcIdx];
                    const [embedded] = await newPdf.embedPages([srcPage]);

                    // Normalize existing /Rotate value
                    const srcRot = ((srcPage.getRotation().angle % 360) + 360) % 360;

                    // Total rotation = source /Rotate + user-chosen rotation
                    const totalRotation = (srcRot + rotationAngle) % 360;
                    const θRad = totalRotation * Math.PI / 180;
                    const cosT = Math.cos(θRad);
                    const sinT = Math.sin(θRad);

                    // Use CropBox as the effective visible bounds — this is exactly what
                    // embedPages sets as the XObject BBox. Using MediaBox here causes
                    // "half blank" output when CropBox ≠ MediaBox (e.g. scanned PDFs,
                    // documents with trimmed margins, or mixed-content pages).
                    const cropBox = typeof srcPage.getCropBox === 'function'
                        ? srcPage.getCropBox()
                        : { x: 0, y: 0, ...srcPage.getSize() };
                    const visX = cropBox.x, visY = cropBox.y;
                    const visW = cropBox.width, visH = cropBox.height;

                    // Bounding box dimensions of the visible area after rotation
                    const finalVisW = Math.abs(visW * cosT) + Math.abs(visH * sinT);
                    const finalVisH = Math.abs(visW * sinT) + Math.abs(visH * cosT);

                    // Scale to fit within slot
                    const scale = Math.min(slotW / finalVisW, slotH / finalVisH);

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

                    // Slot center (PDF y-axis: 0 at bottom)
                    const cx = slotW * col + slotW / 2;
                    const cy = sheetH - (slotH * row + slotH / 2);

                    // Compute the bounding box of the rotated CropBox in page coordinates,
                    // relative to the draw anchor. This accounts for the CropBox origin offset
                    // so the visible content is precisely centered in the slot.
                    // pdf-lib rotates CCW around the anchor: (px,py) → (px·cosθ − py·sinθ, px·sinθ + py·cosθ)
                    const cX = [visX, visX + visW, visX + visW, visX];
                    const cY = [visY, visY, visY + visH, visY + visH];
                    const rotX = cX.map((px, i) => scale * (px * cosT - cY[i] * sinT));
                    const rotY = cX.map((px, i) => scale * (px * sinT + cY[i] * cosT));
                    const bbCxRel = (Math.min(...rotX) + Math.max(...rotX)) / 2;
                    const bbCyRel = (Math.min(...rotY) + Math.max(...rotY)) / 2;

                    // Anchor so that the CropBox center lands on the slot center (cx, cy)
                    const x = cx - bbCxRel;
                    const y = cy - bbCyRel;

                    newPage.drawPage(embedded, {
                        x,
                        y,
                        xScale: scale,
                        yScale: scale,
                        rotate: degrees(totalRotation)
                    });
                }
            }

            setProgress(operations.length, operations.length);

            const pdfBytes = await newPdf.save();
            const baseName = file.name.replace(/\.pdf$/i, '');
            downloadPDF(pdfBytes, baseName + "_updated.pdf");

            statusDiv.textContent = `✓ Done! ${totalPages} page${totalPages !== 1 ? 's' : ''} processed — downloading now.`;
            statusDiv.className = 'status-success';
            document.body.style.cursor = "default";
            processBtn.disabled = false;

        } catch (error) {
            console.error(error);
            statusDiv.textContent = "✕ Error: " + error.message;
            statusDiv.className = 'status-error';
            document.body.style.cursor = "default";
            processBtn.disabled = false;
            if (progressBar) progressBar.style.display = 'none';
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

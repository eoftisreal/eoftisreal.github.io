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

// PDF Fixer Elements
const pdfFixerInput = document.getElementById('pdfFixerInput');
const fixPdfBtn = document.getElementById('fixPdfBtn');
const fixerResetBtn = document.getElementById('fixerResetBtn');
const fixerFileNameDisplay = document.getElementById('fixerFileName');
const fixerStatusDiv = document.getElementById('fixerStatus');
const fixerProgressBar = document.getElementById('fixerProgressBar');
const fixerProgressFill = document.getElementById('fixerProgressFill');
const fixerIssuesPanel = document.getElementById('fixerIssuesPanel');
const fixerIssuesList = document.getElementById('fixerIssuesList');
const fixerOptionsPanel = document.getElementById('fixerOptionsPanel');
const decompressStreamsChk = document.getElementById('decompressStreams');
const removeMetadataChk = document.getElementById('removeMetadata');
const normalizeDimensionsChk = document.getElementById('normalizeDimensions');

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
    // Reset visual controls to defaults
    setPpsValue('2');
    setRotationValue('90');
    const unchangedEl = document.getElementById('unchangedPages');
    if (unchangedEl) unchangedEl.value = '';
    // Deactivate any active preset
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('preset-active'));
}

// ---- Pages-per-Sheet visual selector ----
function setPpsValue(val) {
    const hidden = document.getElementById('pagesPerSheet');
    if (hidden) hidden.value = val;
    document.querySelectorAll('.pps-btn').forEach(btn => {
        const isActive = btn.dataset.value === val;
        btn.classList.toggle('pps-active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

document.querySelectorAll('.pps-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        setPpsValue(btn.dataset.value);
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('preset-active'));
    });
});

// ---- Rotation visual selector ----
function setRotationValue(val) {
    const rotInput = document.getElementById('rotationAngle');
    const customInput = document.querySelector('.rot-custom-input');
    if (val === 'custom') {
        if (customInput) {
            customInput.style.display = '';
            customInput.focus();
        }
    } else {
        if (customInput) customInput.style.display = 'none';
        if (rotInput) rotInput.value = val;
    }
    document.querySelectorAll('.rot-btn').forEach(btn => {
        const isActive = btn.dataset.value === val;
        btn.classList.toggle('rot-active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

document.querySelectorAll('.rot-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        setRotationValue(btn.dataset.value);
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('preset-active'));
    });
});

// Keep the hidden rotationAngle input in sync when user types in custom input
(function () {
    const customInput = document.querySelector('.rot-custom-input');
    const rotInput = document.getElementById('rotationAngle');
    if (customInput && rotInput) {
        customInput.addEventListener('input', () => {
            rotInput.value = customInput.value;
        });
    }
})();

// ---- Quick Presets ----
const PRESETS = {
    rotate90: { pps: '1', rotation: '90' },
    stack2up: { pps: '2', rotation: '0' },
    grid4up:  { pps: '4', rotation: '0' },
    custom:   null, // opens advanced panel only
};

document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const preset = PRESETS[btn.dataset.preset];
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('preset-active'));
        btn.classList.add('preset-active');
        if (preset) {
            setPpsValue(preset.pps);
            setRotationValue(preset.rotation);
        }
        // Open advanced panel for Custom preset
        if (btn.dataset.preset === 'custom') {
            const toggle = document.getElementById('advancedToggle');
            const panel = document.getElementById('advancedPanel');
            if (toggle && panel && toggle.getAttribute('aria-expanded') === 'false') {
                toggle.setAttribute('aria-expanded', 'true');
                panel.setAttribute('aria-hidden', 'false');
                panel.classList.add('panel-open');
            }
        }
    });
});

// ---- Advanced Panel Toggle ----
(function () {
    const toggle = document.getElementById('advancedToggle');
    const panel = document.getElementById('advancedPanel');
    if (!toggle || !panel) return;
    toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        panel.setAttribute('aria-hidden', expanded ? 'true' : 'false');
        panel.classList.toggle('panel-open', !expanded);
    });
})();

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

                    // pdf-lib's embedPages bakes the page's /Rotate value into the XObject
                    // Matrix, so the embedded form already renders in the page's natural
                    // (display) orientation. Only the user-chosen rotation should be applied
                    // via drawPage — adding srcRot again would double-rotate the page.
                    const θRad = rotationAngle * Math.PI / 180;
                    const cosRot = Math.cos(θRad);
                    const sinRot = Math.sin(θRad);

                    // Use CropBox as the effective visible bounds — this is exactly what
                    // embedPages sets as the XObject BBox. Using MediaBox here causes
                    // "half blank" output when CropBox ≠ MediaBox (e.g. scanned PDFs,
                    // documents with trimmed margins, or mixed-content pages).
                    const cropBox = typeof srcPage.getCropBox === 'function'
                        ? srcPage.getCropBox()
                        : { x: 0, y: 0, ...srcPage.getSize() };
                    const visX = cropBox.x, visY = cropBox.y;
                    const visW = cropBox.width, visH = cropBox.height;

                    // Natural dimensions after the XObject Matrix applies srcRot:
                    // 90°/270° swap width ↔ height; 0°/180° keep them the same.
                    const natW = (srcRot % 180 === 0) ? visW : visH;
                    const natH = (srcRot % 180 === 0) ? visH : visW;

                    // Bounding box dimensions of the visible area after user rotation
                    const finalVisW = Math.abs(natW * cosRot) + Math.abs(natH * sinRot);
                    const finalVisH = Math.abs(natW * sinRot) + Math.abs(natH * cosRot);

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

                    // Compute the bounding box of the visible area in natural coordinates
                    // (after srcRot is applied by the XObject Matrix), then rotate it by the
                    // user-chosen angle to find the draw anchor.
                    // For srcRot ∈ {0,180}: natural axes align with raw axes — preserve the
                    //   CropBox origin offset (visX, visY) so off-origin crops center correctly.
                    // For srcRot ∈ {90,270}: natural width/height are swapped; CropBox origin
                    //   is (0,0) in virtually all real-world rotated PDFs.
                    // pdf-lib rotates CCW around the anchor: (nx,ny) → (nx·cosθ − ny·sinθ, nx·sinθ + ny·cosθ)
                    const natCoordsX = (srcRot % 180 === 0) ? [visX, visX + visW, visX + visW, visX] : [0, natW, natW, 0];
                    const natCoordsY = (srcRot % 180 === 0) ? [visY, visY, visY + visH, visY + visH] : [0, 0, natH, natH];
                    const rotX = natCoordsX.map((nx, i) => scale * (nx * cosRot - natCoordsY[i] * sinRot));
                    const rotY = natCoordsX.map((nx, i) => scale * (nx * sinRot + natCoordsY[i] * cosRot));
                    const bbCxRel = (Math.min(...rotX) + Math.max(...rotX)) / 2;
                    const bbCyRel = (Math.min(...rotY) + Math.max(...rotY)) / 2;

                    // Anchor so that the natural-CropBox center lands on the slot center (cx, cy)
                    const x = cx - bbCxRel;
                    const y = cy - bbCyRel;

                    newPage.drawPage(embedded, {
                        x,
                        y,
                        xScale: scale,
                        yScale: scale,
                        rotate: degrees(rotationAngle)  // srcRot already handled by XObject Matrix
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

// --- PDF Fixer Logic ---

/**
 * Count objects with FlateDecode compressed streams in the PDF.
 * Returns the number of FlateDecode streams found.
 */
function detectCompressedStreamCount(pdfDoc) {
    const { PDFName } = PDFLib;
    let flateCount = 0;
    try {
        for (const [, obj] of pdfDoc.context.enumerateIndirectObjects()) {
            if (!obj || !obj.dict || !obj.contents) continue;
            const filter = obj.dict.get(PDFName.of('Filter'));
            if (!filter) continue;
            // Handle /Filter /FlateDecode (single name)
            if (typeof filter.asString === 'function' && filter.asString() === 'FlateDecode') {
                flateCount++;
                continue;
            }
            // Handle /Filter [/FlateDecode ...] (array)
            if (typeof filter.asArray === 'function') {
                const arr = filter.asArray();
                if (arr.some(f => typeof f.asString === 'function' && f.asString() === 'FlateDecode')) {
                    flateCount++;
                }
            }
        }
    } catch (e) {
        console.warn('PDF Fixer: error scanning for compressed streams:', e);
    }
    return flateCount;
}

/**
 * Count pages that contain Form XObjects (proxy for complex vector drawings).
 */
function detectComplexVectorPageCount(pdfDoc) {
    const { PDFName } = PDFLib;
    let complexPages = 0;
    try {
        const pages = pdfDoc.getPages();
        for (const page of pages) {
            try {
                const resources = page.node.get(PDFName.of('Resources'));
                if (!resources) continue;
                const xObjects = (typeof resources.get === 'function')
                    ? resources.get(PDFName.of('XObject'))
                    : null;
                if (!xObjects) continue;
                const keys = (typeof xObjects.keys === 'function') ? xObjects.keys() : [];
                for (const key of keys) {
                    const xobj = xObjects.get(key);
                    if (!xobj) continue;
                    const lookupObj = (typeof xobj.dict !== 'undefined') ? xobj : null;
                    if (!lookupObj) continue;
                    const subtype = lookupObj.dict && lookupObj.dict.get(PDFName.of('Subtype'));
                    if (subtype && typeof subtype.asString === 'function' && subtype.asString() === 'Form') {
                        complexPages++;
                        break; // one Form XObject is enough to classify this page as complex
                    }
                }
            } catch (e) { /* skip page */ }
        }
    } catch (e) {
        console.warn('PDF Fixer: error scanning for complex vectors:', e);
    }
    return complexPages;
}

/**
 * Detect issues in a loaded PDFDocument.
 * Returns an array of issue description strings.
 * @param {object} pdfDoc - Loaded PDFDocument
 * @param {number} [fileSizeMB] - File size in MB for size reporting
 */
function detectPdfIssues(pdfDoc, fileSizeMB) {
    const issues = [];
    const pages = pdfDoc.getPages();
    const total = pages.length;

    let rotatedPages = [];
    let cropBoxOffsetPages = [];
    let cropMismatchPages = [];
    let zeroDimPages = [];

    // Collect reference dimensions from first valid page for inconsistency check
    let refW = null, refH = null;
    let inconsistentPages = [];

    for (let i = 0; i < total; i++) {
        const page = pages[i];

        // Check /Rotate metadata
        const rot = ((page.getRotation().angle % 360) + 360) % 360;
        if (rot !== 0) {
            rotatedPages.push(i + 1);
        }

        // Get MediaBox and CropBox
        let mediaBox = null;
        let cropBox = null;
        try { mediaBox = page.getMediaBox(); } catch (e) { console.warn(`PDF Fixer: failed to read MediaBox on page ${i + 1}:`, e); }
        try { cropBox = typeof page.getCropBox === 'function' ? page.getCropBox() : null; } catch (e) { console.warn(`PDF Fixer: failed to read CropBox on page ${i + 1}:`, e); }

        if (!mediaBox) continue;

        // Check for zero/invalid dimensions
        if (mediaBox.width <= 0 || mediaBox.height <= 0) {
            zeroDimPages.push(i + 1);
            continue;
        }

        // Check CropBox offset
        if (cropBox) {
            if (cropBox.x !== 0 || cropBox.y !== 0) {
                cropBoxOffsetPages.push(i + 1);
            }
            // Check CropBox vs MediaBox dimension mismatch (>2pt tolerance)
            if (Math.abs(cropBox.width - mediaBox.width) > 2 || Math.abs(cropBox.height - mediaBox.height) > 2) {
                cropMismatchPages.push(i + 1);
            }
        }

        // Check for inconsistent page dimensions (portrait vs landscape size change)
        const pageW = Math.round(mediaBox.width);
        const pageH = Math.round(mediaBox.height);
        if (refW === null) {
            refW = pageW; refH = pageH;
        } else if (pageW !== refW || pageH !== refH) {
            if (!inconsistentPages.includes(i + 1)) inconsistentPages.push(i + 1);
        }
    }

    // Build human-readable messages
    if (rotatedPages.length > 0) {
        const pageNums = rotatedPages.length === total
            ? 'all pages'
            : 'page' + (rotatedPages.length > 1 ? 's' : '') + ' ' + formatPageList(rotatedPages);
        issues.push(`Embedded /Rotate metadata (${pageNums}) — may cause rotation errors`);
    }
    if (cropBoxOffsetPages.length > 0) {
        const pageNums = cropBoxOffsetPages.length === total
            ? 'all pages'
            : 'page' + (cropBoxOffsetPages.length > 1 ? 's' : '') + ' ' + formatPageList(cropBoxOffsetPages);
        issues.push(`CropBox offset from origin (${pageNums}) — may cause blank margins`);
    }
    if (cropMismatchPages.length > 0) {
        const pageNums = cropMismatchPages.length === total
            ? 'all pages'
            : 'page' + (cropMismatchPages.length > 1 ? 's' : '') + ' ' + formatPageList(cropMismatchPages);
        issues.push(`CropBox/MediaBox dimension mismatch (${pageNums}) — may clip content`);
    }
    if (zeroDimPages.length > 0) {
        issues.push(`Zero or invalid page dimensions (pages ${formatPageList(zeroDimPages)})`);
    }
    if (inconsistentPages.length > 0) {
        issues.push(`Inconsistent page sizes across document (${inconsistentPages.length} differing page${inconsistentPages.length > 1 ? 's' : ''})`);
    }

    // Detect FlateDecode compressed streams
    const flateCount = detectCompressedStreamCount(pdfDoc);
    if (flateCount > 0) {
        issues.push(`Compressed streams detected (FlateDecode: ${flateCount} stream${flateCount !== 1 ? 's' : ''}) — will decompress to prevent rendering errors`);
    }

    // Detect complex vector objects (Form XObjects)
    const complexVectorPages = detectComplexVectorPageCount(pdfDoc);
    if (complexVectorPages > 0) {
        issues.push(`Complex vector objects on ${complexVectorPages} page${complexVectorPages !== 1 ? 's' : ''} — will optimize`);
    }

    // Report large file size
    if (fileSizeMB != null && fileSizeMB >= 20) {
        issues.push(`File size: ${fileSizeMB.toFixed(1)} MB (large — stream decompression recommended)`);
    }

    return issues;
}

/**
 * Format a list of page numbers compactly, e.g. [1,2,3,7] → "1-3, 7"
 */
function formatPageList(nums) {
    if (nums.length === 0) return '';
    const sorted = [...nums].sort((a, b) => a - b);
    const ranges = [];
    let start = sorted[0], end = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === end + 1) {
            end = sorted[i];
        } else {
            ranges.push(start === end ? `${start}` : `${start}-${end}`);
            start = end = sorted[i];
        }
    }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    return ranges.join(', ');
}

/**
 * Apply all fixes to a PDFDocument in-place.
 * Returns the number of pages successfully fixed.
 * @param {object} pdfDoc - Loaded PDFDocument
 * @param {object} [options] - Optional flags
 * @param {boolean} [options.removeMetadata=true] - Remove annotations/XObjects
 * @param {boolean} [options.normalizeDimensions=true] - Normalize CropBox to MediaBox
 */
async function fixPdfIssues(pdfDoc, options = {}) {
    const { removeMetadata = true, normalizeDimensions = true } = options;
    const { PDFName } = PDFLib;
    const pages = pdfDoc.getPages();
    let fixed = 0;

    for (let i = 0; i < pages.length; i++) {
        try {
            const page = pages[i];

            // 1. Reset /Rotate to 0°
            page.setRotation(degrees(0));

            // 2. Normalize CropBox to match MediaBox
            let mediaBox = null;
            try { mediaBox = page.getMediaBox(); } catch (e) { console.warn(`PDF Fixer: failed to read MediaBox on page ${i + 1}:`, e); }
            if (normalizeDimensions && mediaBox && mediaBox.width > 0 && mediaBox.height > 0) {
                try {
                    page.setMediaBox(mediaBox.x, mediaBox.y, mediaBox.width, mediaBox.height);
                    if (typeof page.setCropBox === 'function') {
                        page.setCropBox(mediaBox.x, mediaBox.y, mediaBox.width, mediaBox.height);
                    } else {
                        // Directly set via page dictionary for pdf-lib versions without setCropBox
                        const node = page.node;
                        node.set(PDFName.of('CropBox'), pdfDoc.context.obj([
                            mediaBox.x, mediaBox.y,
                            mediaBox.x + mediaBox.width, mediaBox.y + mediaBox.height
                        ]));
                    }
                } catch (e) {
                    console.warn(`PDF Fixer: failed to normalize CropBox on page ${i + 1}:`, e);
                }
            }

            // 3. Remove annotations (Annots key) to clean up form fields and interactive elements
            if (removeMetadata) {
                try {
                    page.node.delete(PDFName.of('Annots'));
                } catch (e) {
                    console.warn(`PDF Fixer: failed to remove annotations on page ${i + 1}:`, e);
                }
            }

            fixed++;
        } catch (e) {
            console.warn(`PDF Fixer: skipping page ${i + 1} due to error:`, e);
        }

        // Yield to UI thread periodically
        if (i % 5 === 0) await new Promise(r => setTimeout(r, 0));
    }

    return fixed;
}

/**
 * Decompress all FlateDecode streams in a PDFDocument in-place using pako.
 * This forces pdf-lib to work with raw, uncompressed data, preventing
 * cascading recompression errors on large PDFs with complex vector drawings.
 * @param {object} pdfDoc - Loaded PDFDocument
 * @param {function} [statusCallback] - Called with (processed, total) periodically
 * @returns {number} Number of streams decompressed
 */
async function decompressStreamsInPdf(pdfDoc, statusCallback) {
    const { PDFName, PDFNumber } = PDFLib;
    const allObjects = [...pdfDoc.context.enumerateIndirectObjects()];
    let decompressedCount = 0;

    for (let i = 0; i < allObjects.length; i++) {
        const [, obj] = allObjects[i];

        // Duck-type: stream objects have a dict and a contents Uint8Array
        if (!obj || !obj.dict || !obj.contents) continue;

        const filter = obj.dict.get(PDFName.of('Filter'));
        if (!filter) continue;

        let isFlate = false;
        // Handle /Filter /FlateDecode (single PDFName)
        if (typeof filter.asString === 'function') {
            isFlate = filter.asString() === 'FlateDecode';
        }
        // Handle /Filter [/FlateDecode] (PDFArray with one entry)
        if (!isFlate && typeof filter.asArray === 'function') {
            const arr = filter.asArray();
            isFlate = arr.length === 1 &&
                arr[0] && typeof arr[0].asString === 'function' &&
                arr[0].asString() === 'FlateDecode';
        }

        if (!isFlate) continue;

        try {
            // Decompress using pako (zlib inflate)
            const decompressed = pako.inflate(obj.contents);

            // Replace compressed content with raw decompressed bytes
            obj.contents = decompressed;

            // Remove /Filter and /DecodeParms so pdf-lib treats it as raw
            obj.dict.delete(PDFName.of('Filter'));
            obj.dict.delete(PDFName.of('DecodeParms'));

            // Update /Length to reflect the uncompressed size
            obj.dict.set(PDFName.of('Length'), PDFNumber.of(decompressed.length));

            decompressedCount++;
        } catch (e) {
            // Some streams may have additional decode parameters or unsupported variants — skip them
            console.warn('PDF Fixer: skipping non-decompressable stream:', e.message);
        }

        // Yield to UI thread every 10 objects so status messages update
        if (i % 10 === 0) {
            if (statusCallback) statusCallback(i, allObjects.length);
            await new Promise(r => setTimeout(r, 0));
        }
    }

    return decompressedCount;
}

function setFixerProgress(current, total) {
    if (!fixerProgressBar || !fixerProgressFill) return;
    fixerProgressBar.style.display = 'block';
    fixerProgressFill.style.width = total > 0 ? Math.round((current / total) * 100) + '%' : '0%';
}

function resetFixerTool() {
    if (pdfFixerInput) pdfFixerInput.value = '';
    if (fixerFileNameDisplay) fixerFileNameDisplay.textContent = 'No file chosen';
    if (fixPdfBtn) fixPdfBtn.disabled = true;
    if (fixerStatusDiv) { fixerStatusDiv.textContent = ''; fixerStatusDiv.className = ''; }
    if (fixerProgressBar) { fixerProgressBar.style.display = 'none'; fixerProgressFill.style.width = '0%'; }
    if (fixerIssuesPanel) fixerIssuesPanel.style.display = 'none';
    if (fixerIssuesList) fixerIssuesList.innerHTML = '';
    if (fixerOptionsPanel) fixerOptionsPanel.style.display = 'none';
    document.body.style.cursor = 'default';
}

if (pdfFixerInput) {
    pdfFixerInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) {
            resetFixerTool();
            return;
        }

        // Show file name
        fixerFileNameDisplay.textContent = file.name;
        fixPdfBtn.disabled = true;
        if (fixerStatusDiv) { fixerStatusDiv.textContent = ''; fixerStatusDiv.className = ''; }
        if (fixerProgressBar) fixerProgressBar.style.display = 'none';
        if (fixerIssuesPanel) fixerIssuesPanel.style.display = 'none';
        if (fixerIssuesList) fixerIssuesList.innerHTML = '';
        if (fixerOptionsPanel) fixerOptionsPanel.style.display = 'none';

        // Lazy-load check
        if (typeof PDFLib === 'undefined') {
            if (fixerStatusDiv) {
                fixerStatusDiv.textContent = '⚠️ PDF library is still loading, please try again in a moment.';
            }
            return;
        }

        const { PDFDocument } = PDFLib;

        try {
            fixerStatusDiv.textContent = 'Scanning PDF structure…';
            const fileSizeMB = file.size / (1024 * 1024);
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            const total = pdfDoc.getPageCount();

            // Run issue detection (includes stream, vector, and size checks)
            const issues = detectPdfIssues(pdfDoc, fileSizeMB);

            if (issues.length === 0) {
                fixerStatusDiv.textContent = `✓ No issues found in ${total} page${total !== 1 ? 's' : ''}. PDF looks clean.`;
                fixerStatusDiv.className = 'status-success';
                if (fixerIssuesPanel) fixerIssuesPanel.style.display = 'none';
            } else {
                fixerStatusDiv.textContent = '';
                fixerStatusDiv.className = '';
                // Show issues panel
                if (fixerIssuesList) {
                    fixerIssuesList.innerHTML = issues.map(iss => `<div>• ${iss}</div>`).join('');
                }
                if (fixerIssuesPanel) fixerIssuesPanel.style.display = '';
            }

            // Always show optimization options once a PDF is loaded
            if (fixerOptionsPanel) fixerOptionsPanel.style.display = '';

            // Enable fix button regardless (even clean PDFs can be re-saved)
            fixPdfBtn.disabled = false;
            fixPdfBtn.dataset.fileName = file.name;

        } catch (err) {
            console.error(err);
            if (fixerStatusDiv) {
                fixerStatusDiv.textContent = '✕ Could not read PDF: ' + err.message;
                fixerStatusDiv.className = 'status-error';
            }
            fixPdfBtn.disabled = true;
        }
    });
}

if (fixPdfBtn) {
    fixPdfBtn.addEventListener('click', async () => {
        const file = pdfFixerInput && pdfFixerInput.files[0];
        if (!file) return;

        if (typeof PDFLib === 'undefined') {
            if (fixerStatusDiv) fixerStatusDiv.textContent = '⚠️ PDF library is still loading, please try again.';
            return;
        }

        // Read user-selected options
        const doDecompress = decompressStreamsChk ? decompressStreamsChk.checked : true;
        const doRemoveMetadata = removeMetadataChk ? removeMetadataChk.checked : true;
        const doNormalize = normalizeDimensionsChk ? normalizeDimensionsChk.checked : true;

        const { PDFDocument } = PDFLib;

        try {
            fixPdfBtn.disabled = true;
            document.body.style.cursor = 'wait';
            if (fixerStatusDiv) { fixerStatusDiv.textContent = 'Loading PDF…'; fixerStatusDiv.className = ''; }
            if (fixerProgressBar) { fixerProgressBar.style.display = 'block'; fixerProgressFill.style.width = '0%'; }

            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            const total = pdfDoc.getPageCount();

            // Step 1: Stream decompression (if enabled and pako is available)
            let decompressedStreams = 0;
            if (doDecompress) {
                if (typeof pako === 'undefined') {
                    if (fixerStatusDiv) fixerStatusDiv.textContent = '⚠️ Decompression library (pako) is still loading, please try again in a moment.';
                    fixPdfBtn.disabled = false;
                    document.body.style.cursor = 'default';
                    if (fixerProgressBar) fixerProgressBar.style.display = 'none';
                    return;
                }
                if (fixerStatusDiv) fixerStatusDiv.textContent = `Decompressing streams (may take 5–10 seconds for large PDFs)…`;
                setFixerProgress(0, total);
                decompressedStreams = await decompressStreamsInPdf(pdfDoc, (done, tot) => {
                    // Decompression occupies the first 50% of the progress bar
                    if (fixerProgressFill) fixerProgressFill.style.width = Math.round((done / tot) * 50) + '%';
                });
                // Set progress bar to 50% after decompression completes
                if (fixerProgressFill) fixerProgressFill.style.width = '50%';
                if (fixerStatusDiv) fixerStatusDiv.textContent = `Optimizing page structure…`;
            }

            // Step 2: Fix page-level issues (rotation, CropBox, annotations)
            if (fixerStatusDiv && !doDecompress) {
                fixerStatusDiv.textContent = `Fixing ${total} page${total !== 1 ? 's' : ''}…`;
            }
            // If decompression ran, progress is already at 50%; start page-fix progress from 0
            setFixerProgress(0, total);

            const fixedCount = await fixPdfIssues(pdfDoc, {
                removeMetadata: doRemoveMetadata,
                normalizeDimensions: doNormalize
            });
            setFixerProgress(total, total);

            if (fixerStatusDiv) fixerStatusDiv.textContent = 'Saving optimized PDF…';
            const pdfBytes = await pdfDoc.save();
            const outputSizeMB = (pdfBytes.byteLength / (1024 * 1024)).toFixed(1);

            const baseName = file.name.replace(/\.pdf$/i, '');
            downloadPDF(pdfBytes, baseName + '_fixed.pdf');

            // Build success message
            let successMsg = `✓ PDF optimized! ${fixedCount} of ${total} page${total !== 1 ? 's' : ''} processed`;
            if (doDecompress && decompressedStreams > 0) {
                successMsg += `. Stream decompression applied (${decompressedStreams} stream${decompressedStreams !== 1 ? 's' : ''})`;
            }
            successMsg += `. Download size: ~${outputSizeMB} MB. Safe for processing.`;

            if (fixerStatusDiv) {
                fixerStatusDiv.textContent = successMsg;
                fixerStatusDiv.className = 'status-success';
            }
            // Hide issues panel after successful fix
            if (fixerIssuesPanel) fixerIssuesPanel.style.display = 'none';
            document.body.style.cursor = 'default';
            fixPdfBtn.disabled = false;

        } catch (err) {
            console.error(err);
            if (fixerStatusDiv) {
                fixerStatusDiv.textContent = '✕ Error fixing PDF: ' + err.message;
                fixerStatusDiv.className = 'status-error';
            }
            document.body.style.cursor = 'default';
            fixPdfBtn.disabled = false;
            if (fixerProgressBar) fixerProgressBar.style.display = 'none';
        }
    });
}

if (fixerResetBtn) {
    fixerResetBtn.addEventListener('click', resetFixerTool);
}

const apiKey = "081d831bc57b8a3e95b7a73f3328060e";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";

// Updated Selectors for new layout
const searchBox = document.querySelector(".search-compact input");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
// Note: we now target the small icon in the top bar
const weatherIcon = document.querySelector(".weather-icon-small");
// These still exist in the hidden div but we don't display the div itself
const weatherContainer = document.querySelector(".weather");
const errorContainer = document.querySelector(".error");

// PDF Elements
const pdfInput = document.getElementById('pdfInput');
const processBtn = document.getElementById('processBtn');
const fileNameDisplay = document.getElementById('fileName');
const statusDiv = document.getElementById('status');

// Random Cities for "Background" weather
const cities = [
    "London", "New York", "Tokyo", "Paris", "Sydney", "Dubai", "Singapore",
    "Rome", "Cairo", "Moscow", "Toronto", "Rio de Janeiro", "Mumbai",
    "Beijing", "Los Angeles", "Berlin", "Madrid", "Istanbul", "Bangkok", "Seoul"
];

// PDF-Lib from CDN
const { PDFDocument, PageSizes, degrees } = PDFLib;

// --- Weather Functions ---

function updateBackground(weatherMain) {
    const body = document.body;
    body.className = ''; // Reset classes
    switch (weatherMain) {
        case "Clouds": body.classList.add("clouds"); break;
        case "Clear": body.classList.add("clear"); break;
        case "Rain":
        case "Thunderstorm": body.classList.add("rain"); break;
        case "Drizzle": body.classList.add("drizzle"); break;
        case "Mist":
        case "Fog":
        case "Haze":
        case "Smoke": body.classList.add("mist"); break;
        case "Snow": body.classList.add("snow"); break;
        default: body.classList.add("clear"); break;
    }
}

function updateWeatherUI(data) {
    // Update elements in the top bar
    // Note: The original script used .temp and .city classes which we reused in the nav bar
    // So querySelector will find the first ones (which are in the nav bar)
    document.querySelector(".city").innerHTML = data.name;
    document.querySelector(".temp").innerHTML = Math.round(data.main.temp) + "°c";

    // Update hidden elements just in case (optional, but keeps console clean if we accessed them)
    // ...

    const weatherMain = data.weather[0].main;
    let iconSrc = "images/clear.png";

    if (weatherMain == "Clouds") iconSrc = "images/clouds.png";
    else if (weatherMain == "Clear") iconSrc = "images/clear.png";
    else if (weatherMain == "Rain") iconSrc = "images/rain.png";
    else if (weatherMain == "Drizzle") iconSrc = "images/drizzle.png";
    else if (weatherMain == "Mist") iconSrc = "images/mist.png";
    else if (weatherMain == "Snow") iconSrc = "images/snow.png";

    if (weatherIcon) weatherIcon.src = iconSrc;

    updateBackground(weatherMain);

    // We do NOT show the weatherContainer (the hidden div) as it would break layout
    // weatherContainer.style.display = "block";

    if (errorContainer) errorContainer.style.display = "none";
}

async function checkWeather(city) {
    try {
        const response = await fetch(apiUrl + city + `&appid=${apiKey}`);
        if (response.status == 404) {
            if (errorContainer) errorContainer.style.display = "block";
            // Don't hide the nav bar info, just show error?
            // For now, let's just log it or alert
            console.warn("City not found");
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

// Initialize Weather
window.addEventListener('DOMContentLoaded', () => {
    checkWeather(getRandomCity());
});

// Event Listeners for Weather
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

// Listen for file selection
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

// Process PDF
if (processBtn) {
    processBtn.addEventListener('click', async () => {
        const file = pdfInput.files[0];
        if (!file) return;

        try {
            statusDiv.textContent = "Processing...";
            processBtn.disabled = true;
            document.body.style.cursor = "wait";

            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const newPdf = await PDFDocument.create();

            const totalPages = pdfDoc.getPageCount();

            // A4 dimensions (Points)
            const A4_WIDTH = 595.28;
            const A4_HEIGHT = 841.89;
            const HALF_HEIGHT = A4_HEIGHT / 2;

            // Copy Page 1 (Cover)
            if (totalPages > 0) {
                const [coverPage] = await newPdf.copyPages(pdfDoc, [0]);
                newPdf.addPage(coverPage);
            }

            // Loop remaining pages
            for (let i = 1; i < totalPages; i += 2) {
                const newPage = newPdf.addPage([A4_WIDTH, A4_HEIGHT]);

                // Get source pages
                const pageIndices = [];
                pageIndices.push(i);
                if (i + 1 < totalPages) pageIndices.push(i + 1);

                const embeddedPages = await newPdf.embedPages(pdfDoc.getPages().slice(i, i + 2 > totalPages ? i + 1 : i + 2));
                // Wait, embedPages takes a list of PDFPage objects?
                // correct usage: newPdf.embedPages(sourcePages)
                // But copying is better for content preservation?
                // embedPages turns them into "images" effectively allowing transformation.
                // copyPages copies them as pages.
                // If we want to transform (rotate/scale) and place on a NEW page, we should use embedPages.

                // --- Top Page (Source i) ---
                const pageTop = embeddedPages[0];
                const topDims = pageTop.scale(1); // Get original dims

                // Calculate Scale
                // We want to fit Rotated Page into Top Half (Width=595, Height=421)
                // Rotated Dims: W = topDims.height, H = topDims.width
                const scaleTop = Math.min(
                    A4_WIDTH / topDims.height,
                    HALF_HEIGHT / topDims.width
                );

                // Draw Top Page
                // Position: We want it in the Top Half (y from 421 to 842)
                // Centered? Or aligned? Python script centered it.
                // Center of Top Half: x = 595/2, y = 421 + 421/2 = 631.5
                // Let's just draw it.
                // Rotate 90 degrees CCW (Top points Left).
                // If we rotate 90 deg, we must translate to correct position.
                // drawPage(page, { x, y, rotate: degrees(90), ... })
                // The (x,y) is the bottom-left corner of the drawing rect.
                // If rotated 90, the rect extends to the left? or up?
                // pdf-lib rotation is CCW.
                // Visual: [  ^  ] (Normal) -> [ < ] (Rotated 90)
                // If I place it at (x,y), that's the pivot?
                // Actually, pdf-lib docs say: "The `rotate` option... rotates the page around the origin (x, y)."
                // So if I want the page to appear in the top half...
                // And I rotate 90 (CCW).
                // The content (width W, height H) becomes (height W, width H) roughly?
                // Wait.
                // Let's assume the pivot is the bottom-left of the image.
                // Rotated 90 CCW:
                // Bottom-Left stays at (x,y).
                // Bottom-Right moves up to (x, y + width).
                // Top-Left moves left to (x - height, y).
                // This seems risky.

                // Alternative: Use `degrees(-90)` (CW).
                // Bottom-Left stays at (x,y).
                // Top-Left moves right to (x + height, y).
                // Bottom-Right moves down to (x, y - width).
                // This implies we should start drawing from Top-Left of the slot?

                // Let's use the Python logic simplified:
                // Target: Top Half.
                // Scale factor `scaleTop`.
                // Scaled Width (Visual) = topDims.height * scaleTop.
                // Scaled Height (Visual) = topDims.width * scaleTop.

                // Center in Top Half:
                // x = (A4_WIDTH - ScaledWidth) / 2
                // y = HALF_HEIGHT + (HALF_HEIGHT - ScaledHeight) / 2

                // But since we rotate:
                // If using degrees(90) (CCW):
                // We need to shift x by +ScaledHeight? (Because it rotates left?)
                // Actually, simpler approach:
                // x_dest = calculated_center_x + ScaledHeight (if 90 deg CCW pushes it left?)

                // Let's just try standard positioning for 90 deg:
                // drawPage(page, {
                //   x: x_centered + ScaledWidth, // Shift right because 90 deg moves it left?
                //   y: y_centered,
                //   rotate: degrees(90),
                //   scale: scaleTop
                // })

                // Actually, let's look at the "Top Page" (Page i).
                // It goes in the bottom-visual-half or top-visual-half?
                // My plan: Page i -> Top Half.
                // y range: [HALF_HEIGHT, A4_HEIGHT].

                // Let's use dimensions:
                const drawnWidth = topDims.height * scaleTop;
                const drawnHeight = topDims.width * scaleTop;

                const xTop = (A4_WIDTH - drawnWidth) / 2;
                const yTop = HALF_HEIGHT + (HALF_HEIGHT - drawnHeight) / 2;

                // If I draw at (xTop, yTop) with 90 deg:
                // If 90 deg is CCW: content goes Left and Up?
                // Usually: x increases Right, y increases Up.
                // 90 CCW: X axis becomes Y axis. Y axis becomes -X axis.
                // So (1, 0) becomes (0, 1). (0, 1) becomes (-1, 0).
                // So width (x-axis) goes Up. Height (y-axis) goes Left.
                // So if we draw at (x,y), the image extends Up (width) and Left (height).
                // So we need to position it at (x + drawnHeight, y).
                // Let's try:
                // x: xTop + drawnWidth (wait, width is the visual width which corresponds to original height?)
                // The visual width is `topDims.height * scale`.
                // The visual height is `topDims.width * scale`.

                // If we rotate 90 CCW:
                // Original Width (x-axis) points Up.
                // Original Height (y-axis) points Left.

                // So to place the visual rectangle at (xTop, yTop):
                // We need the "Bottom-Left" of the VISUAL rectangle to be at (xTop, yTop).
                // The "Bottom-Left" of the VISUAL rectangle corresponds to the "Bottom-Right" of the original page (if 90 CCW)?
                // Original:
                // TL -- TR
                // |      |
                // BL -- BR
                //
                // 90 CCW:
                // TR -- BR
                // |      |
                // TL -- BL
                //
                // Visual Bottom-Left is TL.
                // Visual Bottom-Right is BL.
                // Visual Top-Left is TR.

                // Wait.
                // (0,0) is BL.
                // Rotate 90 around BL:
                // BL stays. BR goes up. TL goes left.
                // So the image is drawn to the Left and Up of the anchor point.
                // But we want it at (xTop, yTop) extending Right and Up.
                // So we should anchor at (xTop + VisualWidth, yTop).
                // VisualWidth = topDims.height * scale.

                newPage.drawPage(pageTop, {
                    x: xTop + drawnWidth,
                    y: yTop,
                    scale: scaleTop,
                    rotate: degrees(90)
                });


                // --- Bottom Page (Source i+1) ---
                if (embeddedPages.length > 1) {
                    const pageBottom = embeddedPages[1];
                    const botDims = pageBottom.scale(1);

                    const scaleBot = Math.min(
                        A4_WIDTH / botDims.height,
                        HALF_HEIGHT / botDims.width
                    );

                    const drawnWidthBot = botDims.height * scaleBot;
                    const drawnHeightBot = botDims.width * scaleBot;

                    const xBot = (A4_WIDTH - drawnWidthBot) / 2;
                    const yBot = (HALF_HEIGHT - drawnHeightBot) / 2; // In bottom half (0 to HALF)

                    newPage.drawPage(pageBottom, {
                        x: xBot + drawnWidthBot,
                        y: yBot,
                        scale: scaleBot,
                        rotate: degrees(90)
                    });
                }
            }

            const pdfBytes = await newPdf.save();
            downloadPDF(pdfBytes, "processed_2up.pdf");

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
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

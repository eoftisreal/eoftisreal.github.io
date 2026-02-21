const apiKey = "081d831bc57b8a3e95b7a73f3328060e";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";

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
    const body = document.body;
    body.className = '';
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
    document.querySelector(".city").innerHTML = data.name;
    document.querySelector(".temp").innerHTML = Math.round(data.main.temp) + "°c";

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
    if (errorContainer) errorContainer.style.display = "none";
}

async function checkWeather(city) {
    try {
        const response = await fetch(apiUrl + city + `&appid=${apiKey}`);
        if (response.status == 404) {
            if (errorContainer) errorContainer.style.display = "block";
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

window.addEventListener('DOMContentLoaded', () => {
    checkWeather(getRandomCity());
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

            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const newPdf = await PDFDocument.create();

            const totalPages = pdfDoc.getPageCount();

            // A4 dimensions (Points)
            const A4_WIDTH = 595.28;
            const A4_HEIGHT = 841.89;
            const HALF_HEIGHT = A4_HEIGHT / 2;
            const PADDING = 0;

            // Copy Page 1 (Cover) as-is
            if (totalPages > 0) {
                const [coverPage] = await newPdf.copyPages(pdfDoc, [0]);
                newPdf.addPage(coverPage);
            }

            // Loop remaining pages in pairs
            for (let i = 1; i < totalPages; i += 2) {
                // If only one page remains, keep it as-is
                if (i + 1 >= totalPages) {
                    const [lastPage] = await newPdf.copyPages(pdfDoc, [i]);
                    newPdf.addPage(lastPage);
                    break;
                }

                const newPage = newPdf.addPage([A4_WIDTH, A4_HEIGHT]);

                for (let j = 0; j < 2; j++) {
                    const srcIdx = i + j;
                    const srcPage = pdfDoc.getPages()[srcIdx];
                    const [embedded] = await newPdf.embedPages([srcPage]);

                    // Raw MediaBox dimensions (what pdf-lib uses for the XObject)
                    const { width: rawW, height: rawH } = srcPage.getSize();

                    // Normalize existing /Rotate value (pdf-lib does NOT bake
                    // /Rotate into the embedded XObject, so we must apply it
                    // ourselves as part of the drawing rotation).
                    const srcRot = ((srcPage.getRotation().angle % 360) + 360) % 360;

                    // Effective visual dimensions accounting for /Rotate
                    const visSwapped = (srcRot === 90 || srcRot === 270);
                    const visW = visSwapped ? rawH : rawW;
                    const visH = visSwapped ? rawW : rawH;

                    // Available slot dimensions
                    const slotW = A4_WIDTH - 2 * PADDING;
                    const slotH = HALF_HEIGHT - 2 * PADDING;

                    // Always rotate 90° (matches the working PyMuPDF approach)
                    const layoutRotation = 90;

                    // Total rotation = source /Rotate + layout rotation
                    const totalRotation = (srcRot + layoutRotation) % 360;

                    // Final visual dimensions after total rotation
                    const isTotalRotated = (totalRotation === 90 || totalRotation === 270);
                    const finalVisW = isTotalRotated ? rawH : rawW;
                    const finalVisH = isTotalRotated ? rawW : rawH;

                    // Scale to fit within slot, preserving aspect ratio
                    const scale = Math.min(slotW / finalVisW, slotH / finalVisH);

                    // Scaled storage dimensions (raw embedded dims × scale)
                    const sw = rawW * scale;
                    const sh = rawH * scale;

                    // Slot center (top half for j=0, bottom half for j=1)
                    const cx = A4_WIDTH / 2;
                    const cy = j === 0
                        ? HALF_HEIGHT + HALF_HEIGHT / 2
                        : HALF_HEIGHT / 2;

                    // Anchor position based on total rotation angle.
                    // pdf-lib applies: Translate(x,y) · Rotate(θ) · Scale(s)
                    // The embedded page spans (0,0)→(rawW,rawH) in storage.
                    // After Scale+Rotate around origin then Translate to (x,y):
                    //   0°  bbox center = (x + sw/2,  y + sh/2)
                    //  90°  bbox center = (x - sh/2,  y + sw/2)
                    // 180°  bbox center = (x - sw/2,  y - sh/2)
                    // 270°  bbox center = (x + sh/2,  y - sw/2)
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

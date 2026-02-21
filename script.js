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
            const PADDING = 20;

            // Copy Page 1 (Cover)
            if (totalPages > 0) {
                const [coverPage] = await newPdf.copyPages(pdfDoc, [0]);
                newPdf.addPage(coverPage);
            }

            // Loop remaining pages
            for (let i = 1; i < totalPages; i += 2) {
                const newPage = newPdf.addPage([A4_WIDTH, A4_HEIGHT]);

                // --- Top Page (Source i) ---
                const [embeddedPage1] = await newPdf.embedPages([pdfDoc.getPages()[i]]);
                const dims1 = embeddedPage1.scale(1);

                // --- Determine Rotation and Scaling ---
                // We want to fit the page into a "Landscape" slot (Wide).
                // If the source page is visually Portrait (Height > Width), rotate it 90 degrees.
                // If it is already Landscape (Width >= Height), keep it as is.

                const page1 = pdfDoc.getPages()[i];
                const rotation1 = page1.getRotation().angle || 0;

                // Dimensions from embedded page are usually unrotated storage dimensions.
                // Adjust for source rotation to get visual dimensions.
                const isRotated90_1 = Math.abs(rotation1) % 180 === 90;
                const visualWidth1 = isRotated90_1 ? dims1.height : dims1.width;
                const visualHeight1 = isRotated90_1 ? dims1.width : dims1.height;

                let drawRotation1 = 0;
                if (visualHeight1 > visualWidth1) {
                    // Portrait -> Rotate to Landscape (-90 CW)
                    drawRotation1 = -90;
                }

                // Final Visual Dimensions on destination
                // If we rotate -90, width/height swap relative to visual source
                const finalWidth1 = (drawRotation1 === -90) ? visualHeight1 : visualWidth1;
                const finalHeight1 = (drawRotation1 === -90) ? visualWidth1 : visualHeight1;

                const scale1 = Math.min(
                    (A4_WIDTH - PADDING * 2) / finalWidth1,
                    (HALF_HEIGHT - PADDING * 2) / finalHeight1
                );

                const drawnWidth1 = finalWidth1 * scale1;
                const drawnHeight1 = finalHeight1 * scale1;

                // Target Center: Top Half
                const centerX1 = A4_WIDTH / 2;
                const centerY1 = HALF_HEIGHT + (HALF_HEIGHT / 2);

                let x1, y1;
                if (drawRotation1 === -90) {
                    // Rotated -90 (CW): Extends Right and Down from anchor
                    x1 = centerX1 - (drawnWidth1 / 2);
                    y1 = centerY1 + (drawnHeight1 / 2);
                } else {
                    // Rotated 0: Extends Right and Up from anchor (Standard)
                    x1 = centerX1 - (drawnWidth1 / 2);
                    y1 = centerY1 - (drawnHeight1 / 2);
                }

                newPage.drawPage(embeddedPage1, {
                    x: x1,
                    y: y1,
                    scale: scale1,
                    rotate: degrees(drawRotation1)
                });

                // --- Bottom Page (Source i+1) ---
                if (i + 1 < totalPages) {
                    const [embeddedPage2] = await newPdf.embedPages([pdfDoc.getPages()[i+1]]);
                    const dims2 = embeddedPage2.scale(1);
                    const page2 = pdfDoc.getPages()[i+1];
                    const rotation2 = page2.getRotation().angle || 0;

                    const isRotated90_2 = Math.abs(rotation2) % 180 === 90;
                    const visualWidth2 = isRotated90_2 ? dims2.height : dims2.width;
                    const visualHeight2 = isRotated90_2 ? dims2.width : dims2.height;

                    let drawRotation2 = 0;
                    if (visualHeight2 > visualWidth2) {
                        drawRotation2 = -90;
                    }

                    const finalWidth2 = (drawRotation2 === -90) ? visualHeight2 : visualWidth2;
                    const finalHeight2 = (drawRotation2 === -90) ? visualWidth2 : visualHeight2;

                    const scale2 = Math.min(
                        (A4_WIDTH - PADDING * 2) / finalWidth2,
                        (HALF_HEIGHT - PADDING * 2) / finalHeight2
                    );

                    const drawnWidth2 = finalWidth2 * scale2;
                    const drawnHeight2 = finalHeight2 * scale2;

                    // Target Center: Bottom Half
                    const centerX2 = A4_WIDTH / 2;
                    const centerY2 = HALF_HEIGHT / 2;

                    let x2, y2;
                    if (drawRotation2 === -90) {
                         x2 = centerX2 - (drawnWidth2 / 2);
                         y2 = centerY2 + (drawnHeight2 / 2);
                    } else {
                         x2 = centerX2 - (drawnWidth2 / 2);
                         y2 = centerY2 - (drawnHeight2 / 2);
                    }

                    newPage.drawPage(embeddedPage2, {
                        x: x2,
                        y: y2,
                        scale: scale2,
                        rotate: degrees(drawRotation2)
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

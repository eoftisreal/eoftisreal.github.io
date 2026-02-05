const apiKey = "081d831bc57b8a3e95b7a73f3328060e";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?units=metric&q=";
const geoUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric";
const geoForecastUrl = "https://api.openweathermap.org/data/2.5/forecast?units=metric";

const searchBox = document.querySelector(".search input");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const weatherIcon = document.querySelector(".weather-icon");
const weatherContainer = document.querySelector(".weather");
const errorContainer = document.querySelector(".error");

// Helper to format date
function formatDate(date) {
    const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('en-US', options);
}

// Helper to format forecast date
function formatForecastDate(txt) {
    const date = new Date(txt);
    const options = { weekday: 'short', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('en-US', options);
}

// Helper to update background
function updateBackground(weatherMain) {
    const body = document.body;
    body.className = ''; // Reset classes

    switch (weatherMain) {
        case "Clouds":
            body.classList.add("clouds");
            break;
        case "Clear":
            body.classList.add("clear");
            break;
        case "Rain":
        case "Thunderstorm":
            body.classList.add("rain");
            break;
        case "Drizzle":
            body.classList.add("drizzle");
            break;
        case "Mist":
        case "Fog":
        case "Haze":
        case "Smoke":
            body.classList.add("mist");
            break;
        case "Snow":
            body.classList.add("snow");
            break;
        default:
            body.classList.add("clear");
            break;
    }
}

// Function to update the DOM with weather data
function updateWeatherUI(data) {
    document.querySelector(".city").innerHTML = data.name;
    document.querySelector(".temp").innerHTML = Math.round(data.main.temp) + "°c";
    document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
    document.querySelector(".wind").innerHTML = data.wind.speed + " km/h";
    document.querySelector(".feels-like span").innerHTML = Math.round(data.main.feels_like) + "°c";
    document.querySelector(".date-time").innerHTML = formatDate(new Date());

    const weatherMain = data.weather[0].main;

    if (weatherMain == "Clouds") {
        weatherIcon.src = "images/clouds.png";
    } else if (weatherMain == "Clear") {
        weatherIcon.src = "images/clear.png";
    } else if (weatherMain == "Rain") {
        weatherIcon.src = "images/rain.png";
    } else if (weatherMain == "Drizzle") {
        weatherIcon.src = "images/drizzle.png";
    } else if (weatherMain == "Mist") {
        weatherIcon.src = "images/mist.png";
    } else if (weatherMain == "Snow") {
        weatherIcon.src = "images/snow.png"; // Assuming snow image might exist or fallback
    } else {
        weatherIcon.src = "images/clear.png";
    }

    updateBackground(weatherMain);

    weatherContainer.style.display = "block";
    errorContainer.style.display = "none";
}

// Function to fetch forecast
async function getForecast(query, isCoords = false) {
    let url;
    if (isCoords) {
        url = `${geoForecastUrl}&lat=${query.lat}&lon=${query.lon}&appid=${apiKey}`;
    } else {
        url = `${forecastUrl}${query}&appid=${apiKey}`;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();

        const forecastContainer = document.querySelector(".forecast");
        forecastContainer.innerHTML = ""; // Clear previous

        // Filter for every ~24 hours or just take the first 5 distinct days (simplified: taking every 8th item as it's 3-hour intervals)
        // Or better: show the next few intervals
        // Let's show the next 5 entries from the list to show a short term forecast which is more accurate/immediate
        // User requested "5-Day Forecast", usually means one for each day.

        // Logic to get one per day (approx noon)
        const dailyData = [];
        const seenDates = new Set();

        data.list.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            if (!seenDates.has(date) && item.dt_txt.includes("12:00:00")) {
                seenDates.add(date);
                dailyData.push(item);
            }
        });

        // If we don't have enough noon data (e.g. it's evening), just fill with what we have from the start
        if (dailyData.length < 5) {
             // Fallback: take one every 8 items (24h) starting from index 0
             for(let i=0; i<data.list.length; i+=8) {
                 const date = data.list[i].dt_txt.split(' ')[0];
                 if(!seenDates.has(date)){
                    dailyData.push(data.list[i]);
                    seenDates.add(date);
                 }
                 if(dailyData.length >= 5) break;
             }
        }

        dailyData.slice(0, 5).forEach(day => {
            const date = new Date(day.dt * 1000);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const temp = Math.round(day.main.temp);
            const iconCode = day.weather[0].main;

            let iconSrc = "images/clear.png";
            if(iconCode == "Clouds") iconSrc = "images/clouds.png";
            else if(iconCode == "Rain") iconSrc = "images/rain.png";
            else if(iconCode == "Drizzle") iconSrc = "images/drizzle.png";
            else if(iconCode == "Mist") iconSrc = "images/mist.png";
            else if(iconCode == "Clear") iconSrc = "images/clear.png";

            const item = document.createElement("div");
            item.classList.add("forecast-item");
            item.innerHTML = `
                <p>${dayName}</p>
                <img src="${iconSrc}" alt="${iconCode}">
                <span>${temp}°c</span>
            `;
            forecastContainer.appendChild(item);
        });

    } catch (error) {
        console.error("Error fetching forecast:", error);
    }
}

async function checkWeather(city) {
    try {
        const response = await fetch(apiUrl + city + `&appid=${apiKey}`);

        if (response.status == 404) {
            errorContainer.style.display = "block";
            weatherContainer.style.display = "none";
        } else {
            const data = await response.json();
            updateWeatherUI(data);
            getForecast(city);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

async function checkWeatherByCoords(lat, lon) {
    try {
        const response = await fetch(`${geoUrl}&lat=${lat}&lon=${lon}&appid=${apiKey}`);
        const data = await response.json();
        updateWeatherUI(data);
        getForecast({lat, lon}, true);
    } catch (error) {
        console.error("Error:", error);
    }
}

searchBtn.addEventListener("click", () => {
    checkWeather(searchBox.value);
});

searchBox.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        checkWeather(searchBox.value);
    }
});

locationBtn.addEventListener("click", () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                checkWeatherByCoords(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                alert("Unable to retrieve your location. Please ensure location services are enabled.");
            }
        );
    } else {
        alert("Geolocation is not supported by your browser");
    }
});

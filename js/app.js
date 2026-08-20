// ================================
// DOM ELEMENTS
// ================================

const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const searchButton = document.getElementById("searchButton");

const emptyState = document.getElementById("emptyState");
const weatherContent = document.getElementById("weatherContent");

const errorMessage = document.getElementById("errorMessage");
const loadingState = document.getElementById("loadingState");

const cityName = document.getElementById("cityName");
const countryName = document.getElementById("countryName");
const temperature = document.getElementById("temperature");
const weatherCondition = document.getElementById("weatherCondition");
const weatherIcon = document.getElementById("weatherIcon");

const feelsLike = document.getElementById("feelsLike");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const pressure = document.getElementById("pressure");

const forecastList = document.getElementById("forecastList");

const recentSearches = document.getElementById("recentSearches");
const clearRecentButton = document.getElementById("clearRecentButton");

const themeToggle = document.getElementById("themeToggle");


// ================================
// API CONFIGURATION
// ================================

const GEOCODING_API_URL =
    "https://geocoding-api.open-meteo.com/v1/search";

const WEATHER_API_URL =
    "https://api.open-meteo.com/v1/forecast";


// ================================
// SEARCH FORM
// ================================

searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {
        displayError(
            "Silakan masukkan nama kota terlebih dahulu."
        );
        return;
    }

    await searchWeather(city);
});


// ================================
// SEARCH WEATHER
// ================================

async function searchWeather(city) {
    clearError();
    showLoading();

    try {
        const location = await fetchLocation(city);

        if (!location) {
            displayError(
                "Kota tidak ditemukan. Silakan periksa nama kota dan coba lagi."
            );
            return;
        }

        const weatherData = await fetchWeatherData(
            location.latitude,
            location.longitude
        );

        displayWeather(location, weatherData);

        saveRecentSearch(location.name);

        emptyState.hidden = true;
        weatherContent.hidden = false;

    } catch (error) {
        console.error("Weather error:", error);

        if (error instanceof TypeError) {
            displayError(
                "Tidak dapat terhubung ke layanan cuaca. Periksa koneksi internet Anda."
            );
        } else {
            displayError(
                "Data cuaca tidak dapat diambil. Silakan coba beberapa saat lagi."
            );
        }

    } finally {
        hideLoading();
    }
}


// ================================
// FETCH LOCATION
// ================================

async function fetchLocation(city) {
    const url = new URL(GEOCODING_API_URL);

    url.searchParams.set("name", city);
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "id");
    url.searchParams.set("format", "json");

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Geocoding request failed.");
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        return null;
    }

    return data.results[0];
}


// ================================
// FETCH WEATHER DATA
// ================================

async function fetchWeatherData(latitude, longitude) {
    const url = new URL(WEATHER_API_URL);

    url.searchParams.set("latitude", latitude);
    url.searchParams.set("longitude", longitude);

    url.searchParams.set(
        "current",
        [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "weather_code",
            "wind_speed_10m",
            "surface_pressure"
        ].join(",")
    );

    url.searchParams.set(
        "daily",
        [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min"
        ].join(",")
    );

    url.searchParams.set("forecast_days", "5");
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("temperature_unit", "celsius");
    url.searchParams.set("wind_speed_unit", "kmh");

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Weather request failed.");
    }

    return await response.json();
}


// ================================
// DISPLAY WEATHER
// ================================

function displayWeather(location, data) {
    const current = data.current;

    cityName.textContent = location.name;

    countryName.textContent =
        location.country || "Negara tidak tersedia";

    temperature.textContent =
        Math.round(current.temperature_2m);

    feelsLike.textContent =
        `${Math.round(current.apparent_temperature)}°C`;

    humidity.textContent =
        `${current.relative_humidity_2m}%`;

    windSpeed.textContent =
        `${Math.round(current.wind_speed_10m)} km/jam`;

    pressure.textContent =
        `${Math.round(current.surface_pressure)} hPa`;

        const condition =
        getWeatherCondition(current.weather_code);
    
    weatherCondition.textContent = condition.text;
    
    weatherIcon.textContent = condition.icon;
    weatherIcon.setAttribute(
        "aria-label",
        condition.text
    );

    displayForecast(data.daily);
}


// ================================
// DISPLAY FORECAST
// ================================

function displayForecast(daily) {
    forecastList.replaceChildren();

    // Pastikan forecast terlihat
    forecastList.hidden = false;

    daily.time.forEach((date, index) => {
        const card = document.createElement("article");
        card.className = "forecast-card";

        // Hari
        const day = document.createElement("span");
        day.className = "forecast-day";
        day.textContent = formatForecastDay(date, index);

        // Kondisi cuaca
        const condition = getWeatherCondition(
            daily.weather_code[index]
        );

        // Icon
        const icon = document.createElement("span");
        icon.className = "forecast-icon";
        icon.textContent = condition.icon;
        icon.setAttribute("role", "img");
        icon.setAttribute("aria-label", condition.text);

        // Temperatur
        const temp = document.createElement("strong");
        temp.className = "forecast-temperature";
        temp.textContent =
            `${Math.round(daily.temperature_2m_max[index])}°C`;

        // Kondisi
        const conditionText = document.createElement("p");
        conditionText.className = "forecast-condition";
        conditionText.textContent = condition.text;

        card.append(
            day,
            icon,
            temp,
            conditionText
        );

        forecastList.appendChild(card);
    });
}


// ================================
// WEATHER CONDITION
// ================================

function getWeatherCondition(code) {
    const conditions = {
        0: {
            text: "Cerah",
            icon: "☀️"
        },
        1: {
            text: "Cerah Sebagian",
            icon: "🌤️"
        },
        2: {
            text: "Berawan Sebagian",
            icon: "⛅"
        },
        3: {
            text: "Berawan",
            icon: "☁️"
        },
        45: {
            text: "Berkabut",
            icon: "🌫️"
        },
        48: {
            text: "Kabut Tebal",
            icon: "🌫️"
        },
        51: {
            text: "Gerimis Ringan",
            icon: "🌦️"
        },
        53: {
            text: "Gerimis",
            icon: "🌦️"
        },
        55: {
            text: "Gerimis Lebat",
            icon: "🌧️"
        },
        61: {
            text: "Hujan Ringan",
            icon: "🌦️"
        },
        63: {
            text: "Hujan",
            icon: "🌧️"
        },
        65: {
            text: "Hujan Lebat",
            icon: "🌧️"
        },
        71: {
            text: "Salju Ringan",
            icon: "🌨️"
        },
        73: {
            text: "Salju",
            icon: "🌨️"
        },
        75: {
            text: "Salju Lebat",
            icon: "❄️"
        },
        80: {
            text: "Hujan Singkat",
            icon: "🌦️"
        },
        81: {
            text: "Hujan Singkat",
            icon: "🌧️"
        },
        82: {
            text: "Hujan Singkat Lebat",
            icon: "🌧️"
        },
        95: {
            text: "Badai Petir",
            icon: "⛈️"
        },
        96: {
            text: "Badai Petir dengan Hujan Es",
            icon: "⛈️"
        },
        99: {
            text: "Badai Petir dengan Hujan Es Lebat",
            icon: "⛈️"
        }
    };

    return conditions[code] || {
        text: "Kondisi Tidak Diketahui",
        icon: "🌤️"
    };
}


// ================================
// FORMAT FORECAST DAY
// ================================

function formatForecastDay(date, index) {
    if (index === 0) {
        return "Hari Ini";
    }

    const forecastDate = new Date(`${date}T00:00:00`);

    return forecastDate.toLocaleDateString("id-ID", {
        weekday: "long"
    });
}


// ================================
// ERROR HANDLING
// ================================

function displayError(message) {
    errorMessage.textContent = message;
}

function clearError() {
    errorMessage.textContent = "";
}


// ================================
// LOADING
// ================================

function showLoading() {
    loadingState.hidden = false;
    searchButton.disabled = true;
}

function hideLoading() {
    loadingState.hidden = true;
    searchButton.disabled = false;
}

// ================================
// DARK MODE
// ================================

function toggleTheme() {
    document.body.classList.toggle("dark-mode");

    const isDarkMode =
        document.body.classList.contains("dark-mode");

    localStorage.setItem(
        "weatherDashboardTheme",
        isDarkMode ? "dark" : "light"
    );

    updateThemeIcon(isDarkMode);
}


function updateThemeIcon(isDarkMode) {
    themeToggle.textContent =
        isDarkMode ? "☀️" : "🌙";
}


function loadSavedTheme() {
    const savedTheme =
        localStorage.getItem("weatherDashboardTheme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        updateThemeIcon(true);
    } else {
        updateThemeIcon(false);
    }
}


themeToggle.addEventListener("click", toggleTheme);

loadSavedTheme();

// ================================
// RECENT SEARCHES
// ================================

const MAX_RECENT_SEARCHES = 5;

function saveRecentSearch(city) {
    let searches =
        JSON.parse(localStorage.getItem("recentSearches")) || [];

    // Hapus kota jika sudah ada
    searches = searches.filter(
        (item) => item.toLowerCase() !== city.toLowerCase()
    );

    // Masukkan kota terbaru ke paling depan
    searches.unshift(city);

    // Batasi maksimal 5 kota
    searches = searches.slice(0, MAX_RECENT_SEARCHES);

    localStorage.setItem(
        "recentSearches",
        JSON.stringify(searches)
    );

    loadRecentSearches();
}


function loadRecentSearches() {
    const searches =
        JSON.parse(localStorage.getItem("recentSearches")) || [];

    recentSearches.replaceChildren();

    searches.forEach((city) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "recent-city";
        button.textContent = city;

        button.addEventListener("click", () => {
            cityInput.value = city;
            searchWeather(city);
        });

        recentSearches.appendChild(button);
    });

    clearRecentButton.hidden = searches.length === 0;
}


function clearRecentSearches() {
    localStorage.removeItem("recentSearches");
    loadRecentSearches();
}


clearRecentButton.addEventListener(
    "click",
    clearRecentSearches
);

loadRecentSearches();
// ===== Weather API Configuration =====
const API_KEY = 'f5edd57c82a96a4ec2c5e46c49bb9959'; // OpenWeatherMap API
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

// ===== DOM Elements =====
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const currentLocationBtn = document.getElementById('currentLocationBtn');
const weatherSection = document.getElementById('weatherSection');
const emptyState = document.getElementById('emptyState');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const forecastContainer = document.getElementById('forecastContainer');

// ===== Event Listeners =====
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherByCity(city);
    } else {
        showError('Iltimos, shahar nomini kiriting!');
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

currentLocationBtn.addEventListener('click', getCurrentLocation);

// ===== Fetch Weather by City =====
async function getWeatherByCity(city) {
    try {
        showLoading(true);
        hideError();

        const response = await fetch(`${BASE_URL}?q=${city}&appid=${API_KEY}&units=metric`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Shahar topilmadi!');
            }
            throw new Error('Ma\'lumot yuklashda xato!');
        }

        const data = await response.json();
        displayCurrentWeather(data);
        getForecast(data.coord.lat, data.coord.lon);

    } catch (error) {
        showError(error.message);
        hideWeatherSection();
    } finally {
        showLoading(false);
    }
}

// ===== Fetch Weather by Coordinates =====
async function getWeatherByCoordinates(lat, lon) {
    try {
        showLoading(true);
        hideError();

        const response = await fetch(`${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        
        if (!response.ok) {
            throw new Error('Ma\'lumot yuklashda xato!');
        }

        const data = await response.json();
        displayCurrentWeather(data);
        getForecast(lat, lon);

    } catch (error) {
        showError(error.message);
        hideWeatherSection();
    } finally {
        showLoading(false);
    }
}

// ===== Get Current Location =====
function getCurrentLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation sizning brauzeringizda qo\'llab-quvvatlanmaydi!');
        return;
    }

    showLoading(true);
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            getWeatherByCoordinates(latitude, longitude);
        },
        (error) => {
            showLoading(false);
            showError('Joylashuvni aniqlashda xato! Iltimos, ruxsat bering.');
        }
    );
}

// ===== Fetch 5-Day Forecast =====
async function getForecast(lat, lon) {
    try {
        const response = await fetch(`${FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        
        if (!response.ok) {
            throw new Error('Prognozni yuklashda xato!');
        }

        const data = await response.json();
        displayForecast(data.list);

    } catch (error) {
        console.error('Forecast Error:', error);
    }
}

// ===== Display Current Weather =====
function displayCurrentWeather(data) {
    const { name, sys, main, weather, wind, clouds, visibility } = data;
    
    // Update city name
    document.getElementById('cityName').textContent = name;
    
    // Update temperature and description
    document.getElementById('temperature').textContent = Math.round(main.temp) + '°C';
    document.getElementById('weatherDescription').textContent = weather[0].description;
    
    // Update weather icon
    const iconCode = weather[0].icon;
    document.getElementById('weatherIcon').src = 
        `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    
    // Update weather details
    document.getElementById('humidity').textContent = main.humidity + '%';
    document.getElementById('windSpeed').textContent = wind.speed + ' km/h';
    document.getElementById('pressure').textContent = main.pressure + ' mb';
    document.getElementById('visibility').textContent = (visibility / 1000).toFixed(1) + ' km';
    document.getElementById('maxTemp').textContent = Math.round(main.temp_max) + '°C';
    document.getElementById('minTemp').textContent = Math.round(main.temp_min) + '°C';
    
    // Update sunrise and sunset
    const sunrise = new Date(sys.sunrise * 1000).toLocaleTimeString('uz-UZ', {
        hour: '2-digit',
        minute: '2-digit'
    });
    const sunset = new Date(sys.sunset * 1000).toLocaleTimeString('uz-UZ', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    document.getElementById('sunrise').textContent = sunrise;
    document.getElementById('sunset').textContent = sunset;
    
    // Update clouds and rain
    document.getElementById('clouds').textContent = clouds.all + '%';
    document.getElementById('rain').textContent = (data.rain ? Math.round(data.rain['1h'] * 100) : 0) + '%';
    
    showWeatherSection();
}

// ===== Display 5-Day Forecast =====
function displayForecast(forecastList) {
    forecastContainer.innerHTML = '';
    
    // Get unique days (every 8th item = 24 hours later)
    const uniqueDays = [];
    const seenDates = new Set();
    
    for (let i = 0; i < forecastList.length; i += 8) {
        const forecast = forecastList[i];
        const date = new Date(forecast.dt * 1000);
        const dateString = date.toDateString();
        
        if (!seenDates.has(dateString)) {
            seenDates.add(dateString);
            uniqueDays.push(forecast);
        }
        
        if (uniqueDays.length === 5) break;
    }
    
    // Display forecast cards
    uniqueDays.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const dayName = date.toLocaleDateString('uz-UZ', { weekday: 'short' });
        const temp = Math.round(forecast.main.temp);
        const tempMin = Math.round(forecast.main.temp_min);
        const description = forecast.weather[0].description;
        const icon = forecast.weather[0].icon;
        
        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        forecastCard.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <img src="https://openweathermap.org/img/wn/${icon}.png" alt="Weather" class="forecast-icon">
            <div class="forecast-temp">
                <div class="forecast-max">${temp}°</div>
                <div class="forecast-min">${tempMin}°</div>
            </div>
            <div class="forecast-desc">${description}</div>
        `;
        
        forecastContainer.appendChild(forecastCard);
    });
}

// ===== UI Helper Functions =====
function showWeatherSection() {
    weatherSection.classList.remove('hidden');
    emptyState.classList.add('hidden');
}

function hideWeatherSection() {
    weatherSection.classList.add('hidden');
    emptyState.classList.remove('hidden');
}

function showLoading(show) {
    if (show) {
        loadingSpinner.classList.remove('hidden');
        weatherSection.classList.add('hidden');
        emptyState.classList.add('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}

function hideError() {
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('Weather Dashboard Loaded');
});

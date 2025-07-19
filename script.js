let cityinput = document.getElementById("city_input"),
    searchbtn = document.getElementById("searchbtn"),
    locationbtn = document.getElementById('locationbtn'),
    currentweathercard = document.querySelectorAll(".weather-left .card")[0],
    fivedaysforecastcard = document.querySelector(".day-forecast"),
    aqicard = document.querySelectorAll(".highlights .card")[0],
    sunrisecard = document.querySelectorAll(".highlights .card")[1],
    humidityval = document.getElementById('humidityval'),
    pressureval = document.getElementById('pressureval'),
    visibilityval = document.getElementById('visibilityval'),
    windspeedval = document.getElementById('windspeedval'),
    feelval = document.getElementById('feelval'),
    hourlyforecastcard = document.querySelector('.hourly-forecast'),
    aqilist = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getFullWeather(name, lat, lon, country, state) {
  const FULL_API_URL = `/api/full-weather?lat=${lat}&lon=${lon}`;

  // Optional: show temporary loading states
  currentweathercard.innerHTML = "<p style='padding:12px'>Loading current weather...</p>";
  aqicard.innerHTML = "<p style='padding:12px'>Loading air quality...</p>";
  sunrisecard.innerHTML = "<p style='padding:12px'>Loading sun data...</p>";
  hourlyforecastcard.innerHTML = "<p>Loading hourly forecast...</p>";
  fivedaysforecastcard.innerHTML = "";

  fetch(FULL_API_URL)
    .then(res => res.json())
    .then(data => {
      if (data.error) throw new Error(data.error);

      const weatherData  = data.weather;
      const forecastData = data.forecast;
      const airData      = data.air;

      // -------- Air Quality --------
      if (airData && airData.list && airData.list[0]) {
        const comp = airData.list[0].components;
        const aqiIndex = airData.list[0].main.aqi;
        aqicard.innerHTML = `
          <div class="card-head">
            <p>Air Quality Index</p>
            <p class="air-index aqi-${aqiIndex}">${aqilist[aqiIndex - 1]}</p>
          </div>
          <div class="air-indices">
            <i class="fa-solid fa-wind fa-2x"></i>
            <div class="item"><p>PM2.5</p><h4>${comp.pm2_5}</h4></div>
            <div class="item"><p>PM10</p><h4>${comp.pm10}</h4></div>
            <div class="item"><p>SO2</p><h4>${comp.so2}</h4></div>
            <div class="item"><p>CO</p><h4>${comp.co}</h4></div>
            <div class="item"><p>NO</p><h4>${comp.no}</h4></div>
            <div class="item"><p>NO2</p><h4>${comp.no2}</h4></div>
            <div class="item"><p>NH3</p><h4>${comp.nh3}</h4></div>
            <div class="item"><p>O3</p><h4>${comp.o3}</h4></div>
          </div>`;
      } else {
        aqicard.innerHTML = "<p style='padding:12px'>Air quality data unavailable</p>";
      }

      // -------- Current Weather --------
      if (weatherData && weatherData.main) {
        let date = new Date();
        currentweathercard.innerHTML = `
          <div class="current-weather">
            <div class="details">
              <p>Now</p>
              <h2>${(weatherData.main.temp).toFixed(1)}&deg;C</h2>
              <p>${weatherData.weather[0].description}</p>
            </div>
            <div class="weather-icon">
              <img src="https://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png" alt="">
            </div>
          </div>
          <hr>
          <div class="card-footer">
            <p><i class="fa-regular fa-calendar"></i>${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}</p>
            <p><i class="fa-solid fa-location-dot"></i> ${name}, ${country}</p>
          </div>`;

        const { sunrise, sunset } = weatherData.sys;
        const { timezone, visibility } = weatherData;
        const { humidity, pressure, feels_like } = weatherData.main;
        const { speed } = weatherData.wind;

        const srisetime = moment.unix(sunrise).utc().add(timezone, 'seconds').format('hh:mm A');
        const ssettime  = moment.unix(sunset).utc().add(timezone, 'seconds').format('hh:mm A');

        sunrisecard.innerHTML = `
          <div class="card-head"><p>Sunrise & Sunset</p></div>
          <div class="sunrise-sunset">
            <div class="item">
              <div class="icon"><i class="fi fi-rs-sunrise-alt" style="font-size: 30px;"></i></div>
              <div><p>Sunrise</p><h2>${srisetime}</h2></div>
            </div>
            <div class="item">
              <div class="icon"><i class="fi fi-rs-sunset" style="font-size:30px"></i></div>
              <div><p>Sunset</p><h2>${ssettime}</h2></div>
            </div>
          </div>`;

        humidityval.innerHTML   = `${humidity}%`;
        pressureval.innerHTML   = `${pressure}hPa`;
        visibilityval.innerHTML = `${(visibility / 1000).toFixed(1)}km`;
        windspeedval.innerHTML  = `${speed}m/s`;
        feelval.innerHTML       = `${(feels_like).toFixed(1)}&deg;C`;
      } else {
        currentweathercard.innerHTML = "<p style='padding:12px'>Weather data unavailable</p>";
      }

      // -------- Forecast (Hourly + 5-Day) --------
      if (forecastData && forecastData.list) {
        const hourlyforecast = forecastData.list;
        hourlyforecastcard.innerHTML = '';
        for (let i = 0; i <= 7 && i < hourlyforecast.length; i++) {
          let hrDate = new Date(hourlyforecast[i].dt_txt);
            let hr = hrDate.getHours();
            let a = hr < 12 ? 'AM' : 'PM';
            if (hr === 0) hr = 12;
            if (hr > 12) hr -= 12;
          hourlyforecastcard.innerHTML += `
            <div class="card">
              <p>${hr} ${a}</p>
              <img src="https://openweathermap.org/img/wn/${hourlyforecast[i].weather[0].icon}.png" alt="">
              <p>${(hourlyforecast[i].main.temp).toFixed(1)}&deg;C</p>
            </div>`;
        }

        let uniqueforecastdays = [];
        let fivedaysforecast = forecastData.list.filter(forecast => {
          let forecastdate = new Date(forecast.dt_txt).getDate();
          if (!uniqueforecastdays.includes(forecastdate)) {
            uniqueforecastdays.push(forecastdate);
            return true;
          }
          return false;
        });

        fivedaysforecastcard.innerHTML = "";
        for (let i = 1; i < fivedaysforecast.length; i++) { // skip current day (i=0)
          let date = new Date(fivedaysforecast[i].dt_txt);
          fivedaysforecastcard.innerHTML += `
            <div class="forecast-item">
              <div class="icon-wrapper">
                <img src="https://openweathermap.org/img/wn/${fivedaysforecast[i].weather[0].icon}.png" alt="">
                <span>${(fivedaysforecast[i].main.temp).toFixed(1)}&deg;C</span>
              </div>
              <p>${date.getDate()} ${months[date.getMonth()]}</p>
              <p>${days[date.getDay()]}</p>
            </div>`;
        }
      } else {
        hourlyforecastcard.innerHTML = "<p>No forecast data</p>";
        fivedaysforecastcard.innerHTML = "<p style='padding:12px'>No 5‑day data</p>";
      }
    })
    .catch(err => {
      console.error("Full weather fetch error:", err);
      alert("Failed to fetch combined weather data");
    });
}

// -------- City Search --------
function getcitycoordinates() {
  let cityname = cityinput.value.trim();
  cityinput.value = "";
  if (!cityname) return;

  const GEOCODING_API_URL = `/api/geocode?city=${encodeURIComponent(cityname)}`;

  fetch(GEOCODING_API_URL)
    .then(res => res.json())
    .then(data => {
      if (!Array.isArray(data) || data.length === 0) {
        alert(`City not found`);
        return;
      }
      const { name, lat, lon, country, state } = data[0];
      getFullWeather(name, lat, lon, country, state);
    })
    .catch(() => alert(`Failed to fetch coordinates of ${cityname}`));
}

// -------- User Location --------
function getusercoordinates() {
  navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;
    const REVERSE_URL = `/api/reverse-geocode?lat=${latitude}&lon=${longitude}`;

    fetch(REVERSE_URL)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) {
          alert("Unable to detect your location");
          return;
        }
        const { name, country, state } = data[0];
        getFullWeather(name, latitude, longitude, country, state);
      })
      .catch(() => alert('Failed to fetch user coordinates'));
  }, error => {
    if (error.code === error.PERMISSION_DENIED) {
      alert('Geolocation permission denied. Please enable location permission and try again.');
    }
  });
}

// -------- Event Listeners --------
searchbtn.addEventListener("click", getcitycoordinates);
locationbtn.addEventListener("click", getusercoordinates);
cityinput.addEventListener('keyup', e => e.key === 'Enter' && getcitycoordinates());
window.addEventListener('load', getusercoordinates);

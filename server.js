const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENWEATHER_API_KEY;

if (!API_KEY) {
  console.warn("⚠️  OPENWEATHER_API_KEY is missing. Set it in .env (local) or Render environment variables.");
}

app.use(cors());
app.use(express.static(__dirname)); // Serves index.html, style.css, script.js, etc.

// Root route (explicit)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ---------------- Geocoding Routes ----------------

app.get("/api/geocode", async (req, res) => {
  const city = req.query.city;
  if (!city) return res.status(400).json({ error: "City is required" });
  try {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    console.error("Geocode Error:", err.message);
    res.status(500).json({ error: "Failed to fetch coordinates" });
  }
});

app.get("/api/reverse-geocode", async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: "lat and lon are required" });
  try {
    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    console.error("Reverse Geocode Error:", err.message);
    res.status(500).json({ error: "Failed to fetch reverse geolocation" });
  }
});

// ---------------- Combined Full Weather Route ----------------

// Simple in‑memory cache (lat,lon -> { timestamp, data })
const cache = new Map();
const TTL_MS = 5 * 60 * 1000; // 5 minutes

app.get("/api/full-weather", async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: "lat and lon are required" });
  }

  const key = `${lat},${lon}`;
  const now = Date.now();

  // Serve cached response if fresh
  if (cache.has(key)) {
    const { timestamp, data } = cache.get(key);
    if (now - timestamp < TTL_MS) {
      return res.json(data);
    } else {
      cache.delete(key); // expired
    }
  }

  try {
    const weatherUrl  = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
    const airUrl      = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

    const [weatherRes, forecastRes, airRes] = await Promise.all([
      axios.get(weatherUrl),
      axios.get(forecastUrl),
      axios.get(airUrl)
    ]);

    const combined = {
      weather: weatherRes.data,
      forecast: forecastRes.data,
      air: airRes.data
    };

    cache.set(key, { timestamp: now, data: combined });
    res.json(combined);
  } catch (err) {
    console.error("Full Weather Error:", err.message);
    res.status(500).json({ error: "Failed to fetch combined weather data" });
  }
});

// --------------------------------------------------

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

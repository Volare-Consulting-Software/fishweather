const { chromium } = require("playwright");

const BASE_URL = "https://fishweather.com";

function degreesToCompass(deg) {
  const directions = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
  ];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
}

function reverseDegrees(deg) {
  return (deg + 180) % 360;
}

// Moon phase calculator — pure math, no API needed.
// Uses a known new moon reference and the synodic month (29.53059 days).
const SYNODIC_MONTH = 29.53059;
const KNOWN_NEW_MOON = new Date("2000-01-06T18:14:00Z");

function getMoonPhase(date) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0); // normalize to noon
  const daysSinceRef = (d - KNOWN_NEW_MOON) / (1000 * 60 * 60 * 24);
  const cycleProgress = ((daysSinceRef % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  const age = cycleProgress; // days into current cycle
  const illumination = Math.round((1 - Math.cos((2 * Math.PI * age) / SYNODIC_MONTH)) / 2 * 100);

  let phase;
  if (age < 1.85) phase = "New Moon";
  else if (age < 7.38) phase = "Waxing Crescent";
  else if (age < 9.23) phase = "First Quarter";
  else if (age < 14.77) phase = "Waxing Gibbous";
  else if (age < 16.61) phase = "Full Moon";
  else if (age < 22.15) phase = "Waning Gibbous";
  else if (age < 23.99) phase = "Last Quarter";
  else if (age < 27.68) phase = "Waning Crescent";
  else phase = "New Moon";

  return { phase, illumination, age: Math.round(age * 10) / 10 };
}

function getMoonPhaseForDays(startDate, numDays) {
  const phases = {};
  const d = new Date(startDate);
  for (let i = 0; i < numDays; i++) {
    const dateStr = d.toISOString().split("T")[0];
    phases[dateStr] = getMoonPhase(d);
    d.setDate(d.getDate() + 1);
  }
  return phases;
}

async function createBrowser(headless = true) {
  const browser = await chromium.launch({
    headless,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
    ],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 900 },
    locale: "en-US",
  });

  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  return { browser, page };
}

async function searchStation(page, location) {
  const searchUrl = `${BASE_URL}/windlist/${encodeURIComponent(location)}`;
  await page.goto(searchUrl, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(5000);

  const station = await page.evaluate(() => {
    const items = document.querySelectorAll(".jw-spot-list > li");
    for (const li of items) {
      const text = li.textContent.replace(/\s+/g, " ").trim();
      const isPremium =
        text.includes("Pro/Gold") ||
        text.includes("Plus/Pro") ||
        text.includes("PRO Station") ||
        text.includes("PLUS Station");
      if (isPremium) continue;

      const mainEl = li.querySelector('[id$="-main"]');
      const id = mainEl?.id?.replace("-main", "") || "";
      const name =
        li.querySelector(".jw-station-name")?.textContent.trim() || "";
      if (id && name) return { id, name };
    }
    return null;
  });

  if (!station) {
    throw new Error(
      `No free stations found near "${location}". All results may require a Pro/Plus subscription.`
    );
  }

  return station;
}

async function scrapeForecast(page, spotId) {
  const spotUrl = `${BASE_URL}/spot/${spotId}`;
  await page.goto(spotUrl, { waitUntil: "load", timeout: 60000 });

  await page.waitForTimeout(5000);
  await page.evaluate(() => window.scrollTo(0, 1500));
  await page.waitForTimeout(3000);

  try {
    await page.waitForSelector('[class*="jw-fxt-table-cell-wind"]', {
      timeout: 20000,
    });
  } catch {
    throw new Error(
      "Forecast table did not load. The site may be blocking the request."
    );
  }

  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find(
      (b) => b.textContent.trim() === "7 Day"
    );
    if (btn) btn.click();
  });
  await page.waitForTimeout(2000);

  const data = await page.evaluate(() => {
    const dayCells = document.querySelectorAll(
      '[class*="jw-fxt-table-cell-day"][class*="headday"]'
    );
    const days = Array.from(dayCells).map((c) => c.textContent.trim());

    const hourCells = document.querySelectorAll(
      '[class*="jw-fxt-table-cell-hour"][class*="datacell"]'
    );
    const hours = Array.from(hourCells).map((c) => c.textContent.trim());

    const windCells = document.querySelectorAll(
      '[class*="jw-fxt-table-cell-wind"][class*="datacell"]'
    );
    const winds = Array.from(windCells).map((c) => {
      const divs = c.querySelectorAll("div");
      const texts = Array.from(divs)
        .map((d) => d.textContent.trim())
        .filter((t) => t);
      return {
        speed: parseInt(texts[0]) || 0,
        directionDeg: parseInt(texts[1]) || 0,
      };
    });

    const waveCells = document.querySelectorAll(
      '[class*="jw-fxt-table-cell-wave"][class*="datacell"]'
    );
    const waves = Array.from(waveCells).map((c) =>
      parseFloat(c.textContent.trim()) || 0
    );

    const gustCells = document.querySelectorAll(
      '[class*="jw-fxt-table-cell-gust"][class*="datacell"]'
    );
    const gusts = Array.from(gustCells).map((c) =>
      parseInt(c.textContent.trim()) || 0
    );

    const tempCells = document.querySelectorAll(
      '[class*="jw-fxt-table-cell-atemp"][class*="datacell"]'
    );
    const temps = Array.from(tempCells).map((c) =>
      parseInt(c.textContent.trim()) || 0
    );

    const cloudCells = document.querySelectorAll(
      '[class*="jw-fxt-table-cell-cloud"][class*="datacell"]'
    );
    const clouds = Array.from(cloudCells).map((c) =>
      parseInt(c.textContent.trim()) || 0
    );

    const precipCells = document.querySelectorAll(
      '[class*="jw-fxt-table-cell-precip"][class*="datacell"]'
    );
    const precip = Array.from(precipCells).map((c) => {
      const cls = c.className || "";
      const match = cls.match(/weather-precip_(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });

    return { days, hours, winds, waves, gusts, temps, clouds, precip };
  });

  // Map day abbreviations to actual dates starting from today
  const dayAbbrs = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const dayDates = {};
  for (let offset = 0; offset < 14; offset++) {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    const abbr = dayAbbrs[d.getDay()];
    if (!dayDates[abbr]) dayDates[abbr] = d.toISOString().split("T")[0];
  }

  const moonPhases = getMoonPhaseForDays(today, 14);

  const forecast = [];
  for (let i = 0; i < data.hours.length; i++) {
    const dayIndex = Math.floor(i / 2);
    const rawDeg = data.winds[i]?.directionDeg ?? 0;
    const reversedDeg = reverseDegrees(rawDeg);
    const dayName = data.days[dayIndex] || "";
    const dateStr = dayDates[dayName] || "";
    const moon = moonPhases[dateStr] || { phase: "", illumination: 0 };

    forecast.push({
      day: dayName,
      date: dateStr,
      period: data.hours[i],
      windSpeed: data.winds[i]?.speed ?? 0,
      windDirDeg: reversedDeg,
      windDirCompass: degreesToCompass(reversedDeg),
      waveHeight: data.waves[i] ?? 0,
      gust: data.gusts[i] ?? 0,
      tempF: data.temps[i] ?? 0,
      cloudPct: data.clouds[i] ?? 0,
      precipPct: data.precip[i] ?? 0,
      moonPhase: moon.phase,
      moonIllumination: moon.illumination,
    });
  }

  return forecast;
}

async function getForecast(location, headless = true) {
  const { browser, page } = await createBrowser(headless);
  try {
    const station = await searchStation(page, location);
    const forecast = await scrapeForecast(page, station.id);
    return { station: station.name, spotId: station.id, forecast };
  } finally {
    await browser.close();
  }
}

module.exports = { getForecast, createBrowser, searchStation, scrapeForecast };

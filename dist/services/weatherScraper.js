"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FishweatherScraper = void 0;
const tsyringe_1 = require("tsyringe");
const playwright_1 = require("playwright");
const interfaces_1 = require("../interfaces");
const COMPASS_DIRECTIONS = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];
let FishweatherScraper = class FishweatherScraper {
    config;
    logger;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
    }
    async getForecast(location, headless = true) {
        const { browser, page } = await this.createBrowser(headless);
        try {
            const station = await this.searchStation(page, location);
            const forecast = await this.scrapeForecast(page, station.id);
            return { station, forecast };
        }
        finally {
            await browser.close();
        }
    }
    async createBrowser(headless) {
        const browser = await playwright_1.chromium.launch({
            headless,
            args: [
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
            ],
        });
        const context = await browser.newContext({
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            viewport: { width: 1280, height: 900 },
            locale: "en-US",
        });
        const page = await context.newPage();
        await page.addInitScript(() => {
            Object.defineProperty(navigator, "webdriver", { get: () => false });
        });
        return { browser, page };
    }
    async searchStation(page, location) {
        const searchUrl = `${this.config.fishweatherBaseUrl}/windlist/${encodeURIComponent(location)}`;
        await page.goto(searchUrl, {
            waitUntil: "load",
            timeout: this.config.browserTimeout,
        });
        await page.waitForTimeout(5000);
        const station = await page.evaluate(() => {
            const items = document.querySelectorAll(".jw-spot-list > li");
            for (const li of items) {
                const text = li.textContent?.replace(/\s+/g, " ").trim() ?? "";
                const isPremium = text.includes("Pro/Gold") ||
                    text.includes("Plus/Pro") ||
                    text.includes("PRO Station") ||
                    text.includes("PLUS Station");
                if (isPremium)
                    continue;
                const mainEl = li.querySelector('[id$="-main"]');
                const id = mainEl?.id?.replace("-main", "") || "";
                const name = li.querySelector(".jw-station-name")?.textContent?.trim() || "";
                if (id && name)
                    return { id, name };
            }
            return null;
        });
        if (!station) {
            throw new Error(`No free stations found near "${location}". All results may require a Pro/Plus subscription.`);
        }
        return station;
    }
    async scrapeForecast(page, spotId) {
        const spotUrl = `${this.config.fishweatherBaseUrl}/spot/${spotId}`;
        await page.goto(spotUrl, {
            waitUntil: "load",
            timeout: this.config.browserTimeout,
        });
        await page.waitForTimeout(5000);
        await page.evaluate(() => window.scrollTo(0, 1500));
        await page.waitForTimeout(3000);
        try {
            await page.waitForSelector('[class*="jw-fxt-table-cell-wind"]', {
                timeout: this.config.selectorTimeout,
            });
        }
        catch {
            throw new Error("Forecast table did not load. The site may be blocking the request.");
        }
        await page.evaluate(() => {
            const btn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.trim() === "7 Day");
            if (btn)
                btn.click();
        });
        await page.waitForTimeout(2000);
        const data = await page.evaluate(() => {
            const dayCells = document.querySelectorAll('[class*="jw-fxt-table-cell-day"][class*="headday"]');
            const days = Array.from(dayCells).map((c) => c.textContent?.trim() ?? "");
            const hourCells = document.querySelectorAll('[class*="jw-fxt-table-cell-hour"][class*="datacell"]');
            const hours = Array.from(hourCells).map((c) => c.textContent?.trim() ?? "");
            const windCells = document.querySelectorAll('[class*="jw-fxt-table-cell-wind"][class*="datacell"]');
            const winds = Array.from(windCells).map((c) => {
                const divs = c.querySelectorAll("div");
                const texts = Array.from(divs)
                    .map((d) => d.textContent?.trim() ?? "")
                    .filter((t) => t);
                return {
                    speed: parseInt(texts[0] ?? "0") || 0,
                    directionDeg: parseInt(texts[1] ?? "0") || 0,
                };
            });
            const waveCells = document.querySelectorAll('[class*="jw-fxt-table-cell-wave"][class*="datacell"]');
            const waves = Array.from(waveCells).map((c) => parseFloat(c.textContent?.trim() ?? "0") || 0);
            const gustCells = document.querySelectorAll('[class*="jw-fxt-table-cell-gust"][class*="datacell"]');
            const gusts = Array.from(gustCells).map((c) => parseInt(c.textContent?.trim() ?? "0") || 0);
            const tempCells = document.querySelectorAll('[class*="jw-fxt-table-cell-atemp"][class*="datacell"]');
            const temps = Array.from(tempCells).map((c) => parseInt(c.textContent?.trim() ?? "0") || 0);
            const cloudCells = document.querySelectorAll('[class*="jw-fxt-table-cell-cloud"][class*="datacell"]');
            const clouds = Array.from(cloudCells).map((c) => parseInt(c.textContent?.trim() ?? "0") || 0);
            const precipCells = document.querySelectorAll('[class*="jw-fxt-table-cell-precip"][class*="datacell"]');
            const precip = Array.from(precipCells).map((c) => {
                const cls = c.className || "";
                const match = cls.match(/weather-precip_(\d+)/);
                return match?.[1] ? parseInt(match[1]) : 0;
            });
            return { days, hours, winds, waves, gusts, temps, clouds, precip };
        });
        const dayAbbrs = [
            "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
        ];
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        const dayDates = {};
        for (let offset = 0; offset < 14; offset++) {
            const d = new Date(today);
            d.setDate(d.getDate() + offset);
            const abbr = dayAbbrs[d.getDay()];
            if (abbr && !dayDates[abbr])
                dayDates[abbr] = d.toISOString().split("T")[0];
        }
        const forecast = [];
        for (let i = 0; i < data.hours.length; i++) {
            const dayIndex = Math.floor(i / 2);
            const rawDeg = data.winds[i]?.directionDeg ?? 0;
            const reversedDeg = this.reverseDegrees(rawDeg);
            const dayName = data.days[dayIndex] ?? "";
            forecast.push({
                day: dayName,
                date: dayDates[dayName] ?? "",
                period: data.hours[i] ?? "",
                windSpeed: data.winds[i]?.speed ?? 0,
                windDirDeg: reversedDeg,
                windDirCompass: this.degreesToCompass(reversedDeg),
                waveHeight: data.waves[i] ?? 0,
                gust: data.gusts[i] ?? 0,
                tempF: data.temps[i] ?? 0,
                cloudPct: data.clouds[i] ?? 0,
                precipPct: data.precip[i] ?? 0,
                moonPhase: "",
                moonIllumination: 0,
                tides: [],
            });
        }
        return forecast;
    }
    degreesToCompass(deg) {
        const index = Math.round(deg / 22.5) % 16;
        return COMPASS_DIRECTIONS[index];
    }
    reverseDegrees(deg) {
        return (deg + 180) % 360;
    }
};
exports.FishweatherScraper = FishweatherScraper;
exports.FishweatherScraper = FishweatherScraper = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(interfaces_1.TOKENS.ForecastServiceConfig)),
    __param(1, (0, tsyringe_1.inject)(interfaces_1.TOKENS.ILogger))
], FishweatherScraper);
//# sourceMappingURL=weatherScraper.js.map
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
exports.ForecastService = void 0;
const tsyringe_1 = require("tsyringe");
const interfaces_1 = require("../interfaces");
let ForecastService = class ForecastService {
    weatherScraper;
    tideProvider;
    moonProvider;
    logger;
    constructor(weatherScraper, tideProvider, moonProvider, logger) {
        this.weatherScraper = weatherScraper;
        this.tideProvider = tideProvider;
        this.moonProvider = moonProvider;
        this.logger = logger;
    }
    async getForecast(location, headless = true) {
        const { station: weatherStation, forecast } = await this.weatherScraper.getForecast(location, headless);
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        const moonPhases = this.moonProvider.getPhasesForDays(today, 14);
        let tideData = null;
        try {
            tideData = await this.tideProvider.getTides(location);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.warn(`Warning: Could not fetch tide data: ${message}`);
        }
        for (const row of forecast) {
            const moon = moonPhases[row.date] ?? { phase: "", illumination: 0 };
            row.moonPhase = moon.phase;
            row.moonIllumination = moon.illumination;
            const dateTides = tideData?.byDate[row.date];
            if (dateTides) {
                row.tides = dateTides;
            }
            else {
                row.tides = [];
            }
        }
        return {
            station: weatherStation.name,
            spotId: weatherStation.id,
            tideStation: tideData?.station ?? null,
            forecast,
        };
    }
};
exports.ForecastService = ForecastService;
exports.ForecastService = ForecastService = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(interfaces_1.TOKENS.IWeatherScraper)),
    __param(1, (0, tsyringe_1.inject)(interfaces_1.TOKENS.ITideProvider)),
    __param(2, (0, tsyringe_1.inject)(interfaces_1.TOKENS.IMoonPhaseProvider)),
    __param(3, (0, tsyringe_1.inject)(interfaces_1.TOKENS.ILogger))
], ForecastService);
//# sourceMappingURL=forecastService.js.map
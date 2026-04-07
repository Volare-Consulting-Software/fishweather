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
exports.NoaaTideProvider = void 0;
const tsyringe_1 = require("tsyringe");
const interfaces_1 = require("../interfaces");
const tideType_1 = require("../types/tideType");
let NoaaTideProvider = class NoaaTideProvider {
    httpClient;
    geocoder;
    config;
    stationCache = null;
    constructor(httpClient, geocoder, config) {
        this.httpClient = httpClient;
        this.geocoder = geocoder;
        this.config = config;
    }
    async getTides(location, numDays = 7) {
        const geo = await this.geocoder.geocode(location);
        const station = await this.findNearestStation(geo.lat, geo.lng);
        const predictions = await this.getPredictions(station.id, numDays);
        const byDate = this.groupByDate(predictions);
        return { station, predictions, byDate };
    }
    async getStations() {
        if (this.stationCache)
            return this.stationCache;
        const data = await this.httpClient.get(this.config.noaaStationsApiUrl);
        this.stationCache = data.stations || [];
        return this.stationCache;
    }
    async findNearestStation(lat, lng) {
        const stations = await this.getStations();
        let nearest = null;
        let minDist = Infinity;
        for (const s of stations) {
            const dist = Math.sqrt(Math.pow(s.lat - lat, 2) + Math.pow(s.lng - lng, 2));
            if (dist < minDist) {
                minDist = dist;
                nearest = s;
            }
        }
        if (!nearest) {
            throw new Error("No NOAA tide stations found.");
        }
        return {
            id: nearest.id,
            name: nearest.name,
            lat: nearest.lat,
            lng: nearest.lng,
        };
    }
    async getPredictions(stationId, numDays = 7) {
        const begin = new Date();
        begin.setHours(0, 0, 0, 0);
        const end = new Date(begin);
        end.setDate(end.getDate() + numDays);
        const params = new URLSearchParams({
            begin_date: this.formatDate(begin),
            end_date: this.formatDate(end),
            station: stationId,
            product: "predictions",
            datum: "MLLW",
            time_zone: "lst_ldt",
            interval: "hilo",
            units: "english",
            format: "json",
            application: "fishweather",
        });
        const data = await this.httpClient.get(`${this.config.noaaApiUrl}?${params}`);
        if (!data.predictions) {
            throw new Error(data.error?.message || "No tide predictions returned from NOAA.");
        }
        return data.predictions.map((p) => ({
            time: p.t,
            height: parseFloat(p.v),
            type: p.type === "H" ? tideType_1.TideType.High : tideType_1.TideType.Low,
        }));
    }
    groupByDate(predictions) {
        const grouped = {};
        for (const p of predictions) {
            const dateStr = p.time
                .split(" ")[0]
                ?.replace(/(\d{4})-(\d{2})-(\d{2})/, "$1-$2-$3") ?? "";
            if (!grouped[dateStr])
                grouped[dateStr] = [];
            grouped[dateStr].push(p);
        }
        return grouped;
    }
    formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}${m}${d}`;
    }
};
exports.NoaaTideProvider = NoaaTideProvider;
exports.NoaaTideProvider = NoaaTideProvider = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(interfaces_1.TOKENS.IHttpClient)),
    __param(1, (0, tsyringe_1.inject)(interfaces_1.TOKENS.IGeocoder)),
    __param(2, (0, tsyringe_1.inject)(interfaces_1.TOKENS.ForecastServiceConfig))
], NoaaTideProvider);
//# sourceMappingURL=tideProvider.js.map
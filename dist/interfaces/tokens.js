"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKENS = void 0;
function createTokens(keys) {
    return Object.fromEntries(keys.map((k) => [k, Symbol(k)]));
}
exports.TOKENS = createTokens([
    "IHttpClient",
    "IGeocoder",
    "ITideProvider",
    "IMoonPhaseProvider",
    "IWeatherScraper",
    "ILogger",
    "ForecastServiceConfig",
]);
//# sourceMappingURL=tokens.js.map
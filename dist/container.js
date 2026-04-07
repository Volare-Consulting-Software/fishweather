"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.container = void 0;
require("reflect-metadata");
const tsyringe_1 = require("tsyringe");
Object.defineProperty(exports, "container", { enumerable: true, get: function () { return tsyringe_1.container; } });
const interfaces_1 = require("./interfaces");
const config_1 = require("./config");
const services_1 = require("./services");
tsyringe_1.container.register(interfaces_1.TOKENS.ForecastServiceConfig, { useValue: config_1.DEFAULT_CONFIG });
tsyringe_1.container.register(interfaces_1.TOKENS.IHttpClient, { useClass: services_1.HttpClient });
tsyringe_1.container.register(interfaces_1.TOKENS.ILogger, { useClass: services_1.ConsoleLogger });
tsyringe_1.container.register(interfaces_1.TOKENS.IGeocoder, { useClass: services_1.ArcGisGeocoder });
tsyringe_1.container.register(interfaces_1.TOKENS.ITideProvider, { useClass: services_1.NoaaTideProvider });
tsyringe_1.container.register(interfaces_1.TOKENS.IMoonPhaseProvider, { useClass: services_1.MoonPhaseProvider });
tsyringe_1.container.register(interfaces_1.TOKENS.IWeatherScraper, { useClass: services_1.FishweatherScraper });
//# sourceMappingURL=container.js.map
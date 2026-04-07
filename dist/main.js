#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
require("./container");
const tsyringe_1 = require("tsyringe");
const forecastService_1 = require("./services/forecastService");
const interfaces_1 = require("./interfaces");
const forecastFormatter_1 = require("./formatters/forecastFormatter");
function printUsage() {
    console.log("Usage: fishweather <location> [options]");
    console.log("");
    console.log("  Searches FishWeather for the given location and pulls the");
    console.log("  7-day wind/wave forecast from the first free station found.");
    console.log("  Includes NOAA tide predictions and moon phase data.");
    console.log("");
    console.log("Examples:");
    console.log('  fishweather "southport, nc"');
    console.log('  fishweather "key west, fl" --json');
    console.log('  fishweather "outer banks" --visible');
    console.log('  fishweather "southport, nc" --tides');
    console.log("");
    console.log("Options:");
    console.log("  --json       Output as JSON instead of a table");
    console.log("  --visible    Show the browser window (for debugging)");
    console.log("  --tides      Show only NOAA tide predictions (no weather)");
    console.log("  --mcp        Start as an MCP server (for Claude Code)");
}
async function main() {
    if (process.argv.includes("--mcp")) {
        await Promise.resolve().then(() => __importStar(require("./mcpServer")));
        return;
    }
    const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
    const location = args.join(" ").trim();
    if (!location) {
        printUsage();
        process.exit(1);
    }
    const outputJson = process.argv.includes("--json");
    const tidesOnly = process.argv.includes("--tides");
    const headless = !process.argv.includes("--visible");
    try {
        if (tidesOnly) {
            console.log(`Fetching tides near "${location}"...`);
            const tideProvider = tsyringe_1.container.resolve(interfaces_1.TOKENS.ITideProvider);
            const result = await tideProvider.getTides(location);
            if (outputJson) {
                console.log(JSON.stringify(result, null, 2));
            }
            else {
                console.log((0, forecastFormatter_1.formatTideReport)(result));
            }
        }
        else {
            console.log(`Searching for stations near "${location}"...`);
            const service = tsyringe_1.container.resolve(forecastService_1.ForecastService);
            const result = await service.getForecast(location, headless);
            console.log(`Found station: ${result.station} (ID: ${result.spotId})`);
            if (outputJson) {
                console.log(JSON.stringify(result, null, 2));
            }
            else {
                console.log((0, forecastFormatter_1.formatForecastTable)(result));
            }
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Error:", message);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=main.js.map
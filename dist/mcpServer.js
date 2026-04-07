"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
require("./container");
const tsyringe_1 = require("tsyringe");
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
const forecastService_1 = require("./services/forecastService");
const interfaces_1 = require("./interfaces");
const forecastFormatter_1 = require("./formatters/forecastFormatter");
const server = new mcp_js_1.McpServer({
    name: "fishweather",
    version: "1.0.0",
});
server.tool("get_forecast", "Get the 7-day fishing forecast for a given location. Returns wind speed, " +
    "gust, wind direction (where wind is blowing from), wave height, air temperature, " +
    "cloud cover, rain chance, moon phase, and NOAA tide predictions (high/low) " +
    "for each morning (AM) and afternoon (PM).", {
    location: zod_1.z
        .string()
        .describe('Location to search for (city/state, landmark, zip). Example: "southport, nc"'),
}, async ({ location }) => {
    try {
        const service = tsyringe_1.container.resolve(forecastService_1.ForecastService);
        const result = await service.getForecast(location);
        const text = (0, forecastFormatter_1.formatForecastTable)(result);
        return {
            content: [
                { type: "text", text },
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2),
                    annotations: { audience: ["assistant"] },
                },
            ],
        };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
            content: [{ type: "text", text: `Error: ${message}` }],
            isError: true,
        };
    }
});
server.tool("get_tides", "Get NOAA high/low tide predictions for a given location. " +
    "Finds the nearest NOAA tide prediction station and returns " +
    "7 days of high and low tide times and heights (in feet, MLLW datum).", {
    location: zod_1.z
        .string()
        .describe('Location to search for (city/state, landmark, zip). Example: "southport, nc"'),
    days: zod_1.z
        .number()
        .optional()
        .default(7)
        .describe("Number of days of tide predictions (default: 7)"),
}, async ({ location, days }) => {
    try {
        const tideProvider = tsyringe_1.container.resolve(interfaces_1.TOKENS.ITideProvider);
        const result = await tideProvider.getTides(location, days);
        const text = (0, forecastFormatter_1.formatTideReport)(result);
        return {
            content: [
                { type: "text", text },
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2),
                    annotations: { audience: ["assistant"] },
                },
            ],
        };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
            content: [{ type: "text", text: `Error: ${message}` }],
            isError: true,
        };
    }
});
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
}
main();
//# sourceMappingURL=mcpServer.js.map
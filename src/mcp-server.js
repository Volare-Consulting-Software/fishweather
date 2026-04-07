const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const {
  StdioServerTransport,
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");
const { getForecast } = require("./lib");

const server = new McpServer({
  name: "fishweather",
  version: "1.0.0",
});

server.tool(
  "get_forecast",
  "Get the 7-day wind and wave forecast from FishWeather for a given location. " +
    "Searches for the nearest free weather station and returns peak wind speed, " +
    "gust, wind direction (where wind is blowing from), and wave height for " +
    "each morning (AM) and afternoon (PM).",
  {
    location: z
      .string()
      .describe(
        'Location to search for (city/state, landmark, zip). Example: "southport, nc"'
      ),
  },
  async ({ location }) => {
    try {
      const result = await getForecast(location);

      let text = `${result.station} - 7 Day Forecast\n`;
      text += `Fetched: ${new Date().toLocaleString()}\n\n`;
      text +=
        "| Day          | Period | Wind (mph) | Gust (mph) | Wind Dir       | Wave Ht (ft) |\n";
      text +=
        "|--------------|--------|------------|------------|----------------|--------------||\n";

      let prevDay = "";
      for (const row of result.forecast) {
        const dayLabel =
          row.day !== prevDay ? row.day.padEnd(12) : "".padEnd(12);
        prevDay = row.day;
        const dir = `${row.windDirCompass} (${row.windDirDeg}°)`;
        text += `| ${dayLabel} | ${row.period.padEnd(6)} | ${String(row.windSpeed).padStart(10)} | ${String(row.gust).padStart(10)} | ${dir.padEnd(14)} | ${String(row.waveHeight).padStart(12)} |\n`;
      }

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
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();

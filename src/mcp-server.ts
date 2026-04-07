import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getForecast } from "./lib";
import { getTides } from "./noaa";
import { TidePrediction } from "./types";

const server = new McpServer({
  name: "fishweather",
  version: "1.0.0",
});

function formatTides(tides: TidePrediction[]): string {
  if (tides.length === 0) return "";
  return tides
    .map((t) => {
      const time = t.time.split(" ")[1] ?? "";
      return `${t.type[0]}${t.height.toFixed(1)}ft@${time}`;
    })
    .join(" ");
}

server.tool(
  "get_forecast",
  "Get the 7-day fishing forecast for a given location. Returns wind speed, " +
    "gust, wind direction (where wind is blowing from), wave height, air temperature, " +
    "cloud cover, rain chance, moon phase, and NOAA tide predictions (high/low) " +
    "for each morning (AM) and afternoon (PM).",
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
      if (result.tideStation) {
        text += `Tides: ${result.tideStation.name} (NOAA ${result.tideStation.id})\n`;
      }
      text += `Fetched: ${new Date().toLocaleString()}\n\n`;

      let prevDay = "";
      for (const row of result.forecast) {
        const isNewDay = row.day !== prevDay;
        prevDay = row.day;

        if (isNewDay) {
          const moon = `${row.moonPhase} ${row.moonIllumination}%`;
          const tideStr = formatTides(row.tides);
          text += `\n--- ${row.day} ${row.date} | ${moon} ---\n`;
          if (tideStr) text += `    Tides: ${tideStr}\n`;
        }

        const dir = `${row.windDirCompass} (${row.windDirDeg}°)`;
        text += `  ${row.period.padEnd(2)}  Wind ${String(row.windSpeed).padStart(2)} mph (g${String(row.gust).padStart(2)}) ${dir.padEnd(14)}  Waves ${row.waveHeight}ft  ${row.tempF}°F  Cloud ${String(row.cloudPct).padStart(3)}%  Rain ${row.precipPct}%\n`;
      }

      return {
        content: [
          { type: "text" as const, text },
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
            annotations: { audience: ["assistant" as const] },
          },
        ],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: "text" as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_tides",
  "Get NOAA high/low tide predictions for a given location. " +
    "Finds the nearest NOAA tide prediction station and returns " +
    "7 days of high and low tide times and heights (in feet, MLLW datum).",
  {
    location: z
      .string()
      .describe(
        'Location to search for (city/state, landmark, zip). Example: "southport, nc"'
      ),
    days: z
      .number()
      .optional()
      .default(7)
      .describe("Number of days of tide predictions (default: 7)"),
  },
  async ({ location, days }) => {
    try {
      const result = await getTides(location, days);

      let text = `Tide Predictions — ${result.station.name} (NOAA ${result.station.id})\n`;
      text += `Fetched: ${new Date().toLocaleString()}\n\n`;

      for (const [date, tides] of Object.entries(result.byDate)) {
        text += `${date}\n`;
        for (const t of tides) {
          const time = t.time.split(" ")[1] ?? "";
          text += `  ${t.type.padEnd(4)} ${t.height.toFixed(1)} ft  @ ${time}\n`;
        }
      }

      return {
        content: [
          { type: "text" as const, text },
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
            annotations: { audience: ["assistant" as const] },
          },
        ],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: "text" as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();

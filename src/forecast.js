#!/usr/bin/env node
const { getForecast } = require("./lib");

function printTable(stationName, forecast) {
  const header =
    "| Day          | Period | Wind (mph) | Gust (mph) | Wind Dir       | Wave Ht (ft) | Temp (°F) | Cloud (%) | Rain (%) | Moon               |";
  const sep =
    "|--------------|--------|------------|------------|----------------|--------------|-----------|-----------|----------|--------------------|";

  console.log(`\n${stationName} - 7 Day Forecast`);
  console.log(`Fetched: ${new Date().toLocaleString()}\n`);
  console.log(header);
  console.log(sep);

  let prevDay = "";
  for (const row of forecast) {
    const isNewDay = row.day !== prevDay;
    const dayLabel = isNewDay ? row.day.padEnd(12) : "".padEnd(12);
    prevDay = row.day;

    const dir = `${row.windDirCompass} (${row.windDirDeg}°)`;
    const moon = isNewDay
      ? `${row.moonPhase} ${row.moonIllumination}%`
      : "";
    console.log(
      `| ${dayLabel} | ${row.period.padEnd(6)} | ${String(row.windSpeed).padStart(10)} | ${String(row.gust).padStart(10)} | ${dir.padEnd(14)} | ${String(row.waveHeight).padStart(12)} | ${String(row.tempF).padStart(9)} | ${String(row.cloudPct).padStart(9)} | ${String(row.precipPct).padStart(8)} | ${moon.padEnd(18)} |`
    );
  }
}

function printUsage() {
  console.log("Usage: node forecast.js <location> [options]");
  console.log("");
  console.log("  Searches FishWeather for the given location and pulls the");
  console.log("  7-day wind/wave forecast from the first free station found.");
  console.log("");
  console.log("Examples:");
  console.log('  node forecast.js "southport, nc"');
  console.log('  node forecast.js "key west, fl" --json');
  console.log('  node forecast.js "outer banks" --visible');
  console.log("");
  console.log("Options:");
  console.log("  --json       Output as JSON instead of a table");
  console.log("  --visible    Show the browser window (for debugging)");
  console.log("  --mcp        Start as an MCP server (for Claude Code)");
}

async function main() {
  // Launch as MCP server if --mcp flag is passed
  if (process.argv.includes("--mcp")) {
    require("./mcp-server");
    return;
  }

  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const location = args.join(" ").trim();

  if (!location) {
    printUsage();
    process.exit(1);
  }

  const outputJson = process.argv.includes("--json");
  const headless = !process.argv.includes("--visible");

  try {
    console.log(`Searching for stations near "${location}"...`);
    const result = await getForecast(location, headless);
    console.log(`Found station: ${result.station} (ID: ${result.spotId})`);

    if (outputJson) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printTable(result.station, result.forecast);
    }
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

main();

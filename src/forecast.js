#!/usr/bin/env node
const { getForecast } = require("./lib");
const { getTides } = require("./noaa");

function formatTides(tides) {
  if (!tides || tides.length === 0) return "";
  return tides
    .map((t) => {
      const time = t.time.split(" ")[1] || "";
      return `${t.type[0]}${t.height.toFixed(1)}ft@${time}`;
    })
    .join(" ");
}

function printTable(result) {
  console.log(`\n${result.station} - 7 Day Forecast`);
  if (result.tideStation) {
    console.log(`Tides: ${result.tideStation.name} (NOAA ${result.tideStation.id})`);
  }
  console.log(`Fetched: ${new Date().toLocaleString()}\n`);

  let prevDay = "";
  for (const row of result.forecast) {
    const isNewDay = row.day !== prevDay;
    prevDay = row.day;

    if (isNewDay) {
      const moon = `${row.moonPhase} ${row.moonIllumination}%`;
      const tideStr = formatTides(row.tides);
      console.log(`--- ${row.day} ${row.date} | ${moon} ---`);
      if (tideStr) console.log(`    Tides: ${tideStr}`);
    }

    const dir = `${row.windDirCompass} (${row.windDirDeg}°)`;
    console.log(
      `  ${row.period.padEnd(2)}  Wind ${String(row.windSpeed).padStart(2)} mph (g${String(row.gust).padStart(2)}) ${dir.padEnd(14)}  Waves ${String(row.waveHeight)}ft  ${String(row.tempF)}°F  Cloud ${String(row.cloudPct).padStart(3)}%  Rain ${String(row.precipPct)}%`
    );
  }
}

function printTides(result) {
  console.log(`\nTide Predictions — ${result.station.name} (NOAA ${result.station.id})`);
  console.log(`Fetched: ${new Date().toLocaleString()}\n`);

  for (const [date, tides] of Object.entries(result.byDate)) {
    console.log(date);
    for (const t of tides) {
      const time = t.time.split(" ")[1] || "";
      console.log(`  ${t.type.padEnd(4)} ${t.height.toFixed(1)} ft  @ ${time}`);
    }
  }
}

function printUsage() {
  console.log("Usage: node forecast.js <location> [options]");
  console.log("");
  console.log("  Searches FishWeather for the given location and pulls the");
  console.log("  7-day wind/wave forecast from the first free station found.");
  console.log("  Includes NOAA tide predictions and moon phase data.");
  console.log("");
  console.log("Examples:");
  console.log('  node forecast.js "southport, nc"');
  console.log('  node forecast.js "key west, fl" --json');
  console.log('  node forecast.js "outer banks" --visible');
  console.log('  node forecast.js "southport, nc" --tides');
  console.log("");
  console.log("Options:");
  console.log("  --json       Output as JSON instead of a table");
  console.log("  --visible    Show the browser window (for debugging)");
  console.log("  --tides      Show only NOAA tide predictions (no weather)");
  console.log("  --mcp        Start as an MCP server (for Claude Code)");
}

async function main() {
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
  const tidesOnly = process.argv.includes("--tides");
  const headless = !process.argv.includes("--visible");

  try {
    if (tidesOnly) {
      console.log(`Fetching tides near "${location}"...`);
      const result = await getTides(location);
      if (outputJson) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        printTides(result);
      }
    } else {
      console.log(`Searching for stations near "${location}"...`);
      const result = await getForecast(location, headless);
      console.log(`Found station: ${result.station} (ID: ${result.spotId})`);
      if (outputJson) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        printTable(result);
      }
    }
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

main();

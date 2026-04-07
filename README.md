# FishWeather Forecast Scraper

A Node.js tool that scrapes 7-day wind, wave, and weather forecasts from [FishWeather](https://fishweather.com) and enriches them with moon phase data. Provide a location (city, state, or landmark) and it will find the nearest free weather station and pull the forecast. Available as a CLI, Node.js library, and MCP server for Claude Code.

## Data Captured

For each day (AM and PM):

- **Peak Wind Speed** (mph)
- **Gust Speed** (mph)
- **Wind Direction** (compass bearing and degrees, indicating where the wind is blowing **from**)
- **Wave Height** (ft)
- **Air Temperature** (°F)
- **Cloud Cover** (%)
- **Rain Chance** (%)
- **Moon Phase** (phase name and illumination %, calculated astronomically per day)

## Install from npm

```bash
npm install -g @volare-consulting/fishweather-forecast
npx playwright install chromium
fishweather "southport, nc"
```

Or use via `npx` without installing:

```bash
npx @volare-consulting/fishweather-forecast "key west, fl"
```

## Setup (from source)

Requires [Node.js](https://nodejs.org/) (v18+).

```bash
git clone https://github.com/volare-consulting-software/fishweather.git
cd fishweather
npm install
npx playwright install chromium
```

## Usage

```bash
node src/forecast.js <location> [options]
```

### Examples

```bash
# Table output
node src/forecast.js "southport, nc"

# JSON output (useful for piping to other tools)
node src/forecast.js "key west, fl" --json

# Show the browser window while scraping (for debugging)
node src/forecast.js "outer banks" --visible
```

### Options

| Flag        | Description                              |
|-------------|------------------------------------------|
| `--json`    | Output as JSON instead of a formatted table |
| `--visible` | Show the browser window during scraping  |
| `--mcp`     | Start as an MCP server (for Claude Code) |

### Sample Output

```
Searching for stations near "southport, nc"...
Found station: Cape Fear Pilot (ID: 54114)

Cape Fear Pilot - 7 Day Forecast
Fetched: 4/7/2026, 10:53:50 AM

| Day          | Period | Wind (mph) | Gust (mph) | Wind Dir       | Wave Ht (ft) | Temp (°F) | Cloud (%) | Rain (%) | Moon               |
|--------------|--------|------------|------------|----------------|--------------|-----------|-----------|----------|--------------------|
| Tue          | AM     |         12 |         14 | SW (220°)      |          2.5 |        59 |       100 |        0 | Waning Gibbous 72% |
|              | PM     |         25 |         31 | SW (228°)      |          4.6 |        65 |       100 |        0 |                    |
| Wed          | AM     |         27 |         36 | SSW (211°)     |          5.7 |        51 |        67 |        0 | Waning Gibbous 62% |
|              | PM     |         25 |         28 | SW (220°)      |          5.9 |        57 |        67 |        0 |                    |
| Thu          | AM     |         22 |         28 | SSW (201°)     |          5.3 |        49 |        53 |        0 | Waning Gibbous 52% |
|              | PM     |         20 |         23 | SSW (207°)     |          4.9 |        63 |        43 |        0 |                    |
| Fri          | AM     |         16 |         19 | SSW (204°)     |          4.3 |        55 |        15 |        0 | Last Quarter 41%   |
|              | PM     |         11 |         12 | SW (214°)      |          3.3 |        64 |        11 |        0 |                    |
| Sat          | AM     |          5 |          7 | ESE (117°)     |          2.8 |        55 |        74 |        0 | Waning Crescent 31% |
|              | PM     |          7 |         13 | NNE (24°)      |          2.5 |        75 |        10 |        0 |                    |
| Sun          | AM     |          8 |          9 | WNW (298°)     |          2.1 |        61 |       100 |        0 | Waning Crescent 22% |
|              | PM     |          7 |         17 | NNW (332°)     |          2.3 |        73 |        95 |        0 |                    |
| Mon          | AM     |          7 |         16 | NNW (334°)     |          2.3 |        63 |        99 |        0 | Waning Crescent 13% |
|              | PM     |         11 |         23 | NNE (22°)      |          2.2 |        73 |       100 |        0 |                    |
```

## How It Works

1. Searches `fishweather.com/windlist/<location>` for nearby weather stations
2. Selects the first free station (skips PRO/PLUS stations that require a paid subscription)
3. Navigates to that station's spot page and switches to the 7 Day forecast view
4. Extracts wind speed, gust, direction, wave height, temperature, cloud cover, and rain chance for each AM/PM period
5. Reverses the raw wind direction by 180° so it represents where the wind is blowing **from**
6. Calculates moon phase and illumination for each day using an astronomical algorithm (no external API needed)

### Moon Phase for Fishing

Moon phase is included because it affects fish behavior. Around a **Full Moon**, fish tend to feed more actively at night due to increased visibility. The day after a full moon, you can often wait to head out until later in the morning since the fish were up feeding late. The moon data includes:

- **Phase name**: New Moon, Waxing Crescent, First Quarter, Waxing Gibbous, Full Moon, Waning Gibbous, Last Quarter, Waning Crescent
- **Illumination %**: 0% (new) to 100% (full)

## MCP Server (Claude Code Integration)

This package also runs as an [MCP](https://modelcontextprotocol.io/) server, exposing a `get_forecast` tool that Claude Code can call directly.

### Register with Claude Code

**Via npm (recommended):**

```bash
claude mcp add --transport stdio fishweather -- npx @volare-consulting/fishweather-forecast --mcp
```

**Via local source (this repo):**

The project root `.mcp.json` is already configured. After setup, restart Claude Code and the `get_forecast` tool will be available automatically.

**Manual `.mcp.json`:**

```json
{
  "mcpServers": {
    "fishweather": {
      "type": "stdio",
      "command": "npx",
      "args": ["@volare-consulting/fishweather-forecast", "--mcp"]
    }
  }
}
```

### Available Tools

| Tool             | Description                                                  |
|------------------|--------------------------------------------------------------|
| `get_forecast`   | Get the 7-day wind, wave, weather, and moon phase forecast for a location. Takes a `location` string parameter. |

### Example Prompts in Claude Code

> "What's the wind forecast for Key West this week?"

> "Should I go fishing in Southport this Saturday?"

Claude will call `get_forecast` and use the wind, wave, weather, and moon data to give you a complete answer.

## Troubleshooting

- **Forecast table did not load** - The site may be blocking headless browsers. Try running with `--visible` to see what's happening. A `debug-screenshot.png` is saved automatically on failure.
- **No free stations found** - All nearby stations may require a Pro/Plus subscription. Try a different or broader location search.

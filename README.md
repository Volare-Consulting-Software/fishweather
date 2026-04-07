# FishWeather Forecast Scraper

A Node.js script that scrapes 7-day wind and wave forecasts from [FishWeather](https://fishweather.com). Provide a location (city, state, or landmark) and it will find the nearest free weather station and pull the forecast.

## Data Captured

For each day (AM and PM):

- **Peak Wind Speed** (mph)
- **Gust Speed** (mph)
- **Wind Direction** (compass bearing and degrees, indicating where the wind is blowing **from**)
- **Wave Height** (ft)

## Install from npm

```bash
npm install -g fishweather-forecast
npx playwright install chromium
fishweather "southport, nc"
```

Or use via `npx` without installing:

```bash
npx fishweather-forecast "key west, fl"
```

## Setup (from source)

Requires [Node.js](https://nodejs.org/) (v18+).

```bash
git clone https://github.com/<your-org>/fishweather.git
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

### Sample Output

```
Searching for stations near "southport, nc"...
Found station: Cape Fear Pilot (ID: 54114)
Loading forecast for spot 54114...

Cape Fear Pilot - 7 Day Forecast
Fetched: 4/7/2026, 10:07:34 AM

| Day          | Period | Wind (mph) | Gust (mph) | Wind Dir       | Wave Ht (ft) |
|--------------|--------|------------|------------|----------------|--------------|
| Tue          | AM     |         12 |         14 | SW (220°)      |          2.5 |
|              | PM     |         25 |         31 | SW (228°)      |          4.6 |
| Wed          | AM     |         27 |         36 | SSW (211°)     |          5.7 |
|              | PM     |         24 |         31 | SSW (213°)     |          5.9 |
```

## How It Works

1. Searches `fishweather.com/windlist/<location>` for nearby weather stations
2. Selects the first free station (skips PRO/PLUS stations that require a paid subscription)
3. Navigates to that station's spot page and switches to the 7 Day forecast view
4. Extracts wind speed, gust, direction, and wave height for each AM/PM period
5. Reverses the raw wind direction by 180° so it represents where the wind is blowing **from**

## MCP Server (Claude Code Integration)

This package also runs as an [MCP](https://modelcontextprotocol.io/) server, exposing a `get_forecast` tool that Claude Code can call directly.

### Register with Claude Code

**Via npm (recommended):**

```bash
claude mcp add --transport stdio fishweather -- npx fishweather-forecast --mcp
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
      "args": ["fishweather-forecast", "--mcp"]
    }
  }
}
```

### Available Tools

| Tool             | Description                                                  |
|------------------|--------------------------------------------------------------|
| `get_forecast`   | Get the 7-day wind/wave forecast for a location. Takes a `location` string parameter. |

### Example Prompt in Claude Code

> "What's the wind forecast for Key West this week?"

Claude will call `get_forecast` with `location: "key west, fl"` and return the formatted table.

## Troubleshooting

- **Forecast table did not load** - The site may be blocking headless browsers. Try running with `--visible` to see what's happening. A `debug-screenshot.png` is saved automatically on failure.
- **No free stations found** - All nearby stations may require a Pro/Plus subscription. Try a different or broader location search.

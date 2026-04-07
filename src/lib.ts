import { createBrowser, searchStation, scrapeForecast } from "./fishweather";
import { getMoonPhaseForDays } from "./moon";
import { getTides } from "./noaa";
import { ForecastResult } from "./types";

export async function getForecast(
  location: string,
  headless: boolean = true
): Promise<ForecastResult> {
  const { browser, page } = await createBrowser(headless);

  let weatherStation;
  let forecast;
  try {
    weatherStation = await searchStation(page, location);
    forecast = await scrapeForecast(page, weatherStation.id);
  } finally {
    await browser.close();
  }

  // Moon phases for the forecast date range
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const moonPhases = getMoonPhaseForDays(today, 14);

  // NOAA tides — run in parallel, don't fail the whole forecast if tides error
  let tideData = null;
  try {
    tideData = await getTides(location);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Warning: Could not fetch tide data: ${message}`);
  }

  // Enrich each forecast row with moon and tide data
  for (const row of forecast) {
    const moon = moonPhases[row.date] ?? { phase: "", illumination: 0 };
    row.moonPhase = moon.phase;
    row.moonIllumination = moon.illumination;

    const dateTides = tideData?.byDate[row.date];
    if (dateTides) {
      row.tides = dateTides;
    } else {
      row.tides = [];
    }
  }

  return {
    station: weatherStation.name,
    spotId: weatherStation.id,
    tideStation: tideData?.station ?? null,
    forecast,
  };
}

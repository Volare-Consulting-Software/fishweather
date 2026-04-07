import { inject, injectable } from "tsyringe";
import {
  TOKENS,
  IWeatherScraper,
  ITideProvider,
  IMoonPhaseProvider,
  ILogger,
} from "./interfaces";
import { ForecastResult } from "./types/forecast-result";

@injectable()
export class ForecastService {
  constructor(
    @inject(TOKENS.WeatherScraper) private weatherScraper: IWeatherScraper,
    @inject(TOKENS.TideProvider) private tideProvider: ITideProvider,
    @inject(TOKENS.MoonPhaseProvider) private moonProvider: IMoonPhaseProvider,
    @inject(TOKENS.Logger) private logger: ILogger
  ) {}

  async getForecast(
    location: string,
    headless: boolean = true
  ): Promise<ForecastResult> {
    const { station: weatherStation, forecast } =
      await this.weatherScraper.getForecast(location, headless);

    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const moonPhases = this.moonProvider.getPhasesForDays(today, 14);

    let tideData = null;
    try {
      tideData = await this.tideProvider.getTides(location);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Warning: Could not fetch tide data: ${message}`);
    }

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
}

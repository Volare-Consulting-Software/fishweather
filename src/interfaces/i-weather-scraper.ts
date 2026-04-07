import { Station } from "../types/station";
import { ForecastRow } from "../types/forecast-row";

export interface IWeatherScraper {
  getForecast(
    location: string,
    headless?: boolean
  ): Promise<{ station: Station; forecast: ForecastRow[] }>;
}

import { ILogger } from "../interfaces";
import { ForecastServiceConfig } from "../config";
import { Station } from "../types/station";
import { ForecastRow } from "../types/forecastRow";
export declare class FishweatherScraper {
    private readonly config;
    private readonly logger;
    constructor(config: ForecastServiceConfig, logger: ILogger);
    getForecast(location: string, headless?: boolean): Promise<{
        station: Station;
        forecast: ForecastRow[];
    }>;
    private createBrowser;
    private searchStation;
    private scrapeForecast;
    private degreesToCompass;
    private reverseDegrees;
}
//# sourceMappingURL=weatherScraper.d.ts.map
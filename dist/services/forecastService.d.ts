import { IWeatherScraper, ITideProvider, IMoonPhaseProvider, ILogger } from "../interfaces";
import { ForecastResult } from "../types/forecastResult";
export declare class ForecastService {
    private readonly weatherScraper;
    private readonly tideProvider;
    private readonly moonProvider;
    private readonly logger;
    constructor(weatherScraper: IWeatherScraper, tideProvider: ITideProvider, moonProvider: IMoonPhaseProvider, logger: ILogger);
    getForecast(location: string, headless?: boolean): Promise<ForecastResult>;
}
//# sourceMappingURL=forecastService.d.ts.map
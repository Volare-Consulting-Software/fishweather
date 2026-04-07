import { IHttpClient, IGeocoder } from "../interfaces";
import { ForecastServiceConfig } from "../config";
import { TideResult } from "../types/tide";
export declare class NoaaTideProvider {
    private readonly httpClient;
    private readonly geocoder;
    private readonly config;
    private stationCache;
    constructor(httpClient: IHttpClient, geocoder: IGeocoder, config: ForecastServiceConfig);
    getTides(location: string, numDays?: number): Promise<TideResult>;
    private getStations;
    private findNearestStation;
    private getPredictions;
    private groupByDate;
    private formatDate;
}
//# sourceMappingURL=tideProvider.d.ts.map
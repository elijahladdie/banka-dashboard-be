import { AnalyticsOverview } from "../../types";

export interface IAnalyticsRepository {
  getOverview(): Promise<AnalyticsOverview>;
}
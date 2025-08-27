import { AnalyticsEvent, Experiment, ChurnPrediction, Cohort, KpiMetric } from './analytics.types';
export declare class AnalyticsService {
    private _db;
    constructor();
    ingestEvents(_events: AnalyticsEvent[]): Promise<void>;
    getExperiment(_userId: string, _experimentId: string): Promise<Experiment | null>;
    getChurnPrediction(_userId: string): Promise<ChurnPrediction | null>;
    getCohorts(): Promise<Cohort[]>;
    getKpiMetrics(): Promise<KpiMetric[]>;
}

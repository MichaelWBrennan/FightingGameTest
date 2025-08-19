export interface AnalyticsEvent {
  eventName: string;
  userId: string;
  timestamp: Date;
  payload: Record<string, any>;
}

export interface Experiment {
  experimentId: string;
  userId: string;
  variant: string;
}

export interface ChurnPrediction {
  userId: string;
  churnProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface Cohort {
  cohortId: string;
  name: string;
  description: string;
  criteria: Record<string, any>;
}

export interface KpiMetric {
  metricName: string;
  value: number;
  period: 'daily' | 'weekly' | 'monthly';
}

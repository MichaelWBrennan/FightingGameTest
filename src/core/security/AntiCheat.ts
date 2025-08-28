export interface CheatReport {
  type: string;
  details?: Record<string, any>;
}

export class AntiCheat {
  private reports: CheatReport[] = [];

  monitorInputRate(getInputCount: () => number): void {
    let lastCount = getInputCount();
    setInterval(() => {
      const current = getInputCount();
      const perSecond = current - lastCount;
      if (perSecond > 120) {
        this.reports.push({ type: 'input_rate', details: { perSecond } });
      }
      lastCount = current;
    }, 1000);
  }

  monitorPhysicsDivergence(sample: () => number): void {
    const reference = sample();
    setInterval(() => {
      const value = sample();
      if (Math.abs(value - reference) > 1e6) {
        this.reports.push({ type: 'physics_divergence', details: { value, reference } });
      }
    }, 2000);
  }

  getReports(): CheatReport[] { return [...this.reports]; }
}


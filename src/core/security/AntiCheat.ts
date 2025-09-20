export interface CheatReport {
  type: string;
  details?: Record<string, any>;
}

export class AntiCheat {
  private reports: CheatReport[] = [];
  private lastRemoteDesyncFrame: number = -1;

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

  monitorRemoteStateSanity(getStats: () => { delay?: number; rollbacks?: number; cur?: number; confirmed?: number } | undefined): void {
    setInterval(() => {
      try {
        const st = getStats?.();
        if (!st) return;
        if ((st.rollbacks ?? 0) > 120) this.reports.push({ type: 'excessive_rollbacks', details: { rollbacks: st.rollbacks } });
        if ((st.delay ?? 0) > 8) this.reports.push({ type: 'high_input_delay', details: { delay: st.delay } });
        if ((st.cur ?? 0) - (st.confirmed ?? 0) > 15) this.reports.push({ type: 'large_prediction_gap', details: { cur: st.cur, confirmed: st.confirmed } });
      } catch {}
    }, 1500);
  }

  getReports(): CheatReport[] { return [...this.reports]; }
  clearReports(): void { this.reports = []; }

  // Tamper/devtools detection (heuristic)
  monitorDevtools(): void {
    try {
      setInterval(() => {
        const threshold = 160; // ms when devtools throttles timers
        const start = performance.now(); debugger; const elapsed = performance.now() - start;
        if (elapsed > threshold) this.reports.push({ type: 'devtools_detected', details: { elapsed } });
      }, 5000);
    } catch {}
  }
}


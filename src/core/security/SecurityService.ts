export class SecurityService {
  private devtoolsDetected = false;
  private integrityViolations: string[] = [];

  start(): void {
    this.detectDevTools();
    this.detectTimingTamper();
    this.freezeCriticalObjects();
  }

  private detectDevTools(): void {
    // Silent heuristic: measure layout thrash variance without debugger trap
    const threshold = 250;
    let last = performance.now();
    const check = () => {
      const now = performance.now();
      if (now - last > threshold) {
        this.devtoolsDetected = true;
      }
      last = now;
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }

  private detectTimingTamper(): void {
    let last = performance.now();
    setInterval(() => {
      const now = performance.now();
      if (now < last) {
        this.integrityViolations.push('clock_skew');
      }
      last = now;
    }, 1000);
  }

  private freezeCriticalObjects(): void {
    // Disabled: Freezing global constructors can break third-party engines like PlayCanvas
    // Intentionally left as a no-op to avoid destabilizing runtime
    try { /* no-op */ } catch {}
  }

  public getStatus(): { devtools: boolean; violations: string[] } {
    return { devtools: this.devtoolsDetected, violations: [...this.integrityViolations] };
  }
}


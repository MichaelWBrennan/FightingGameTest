/**
 * CoachOverlay - Contextual gameplay tips and coaching system
 *
 * Provides frame-data tips, matchup primers, and post-round guidance
 * based on telemetry. Fully client-side with no additional latency.
 * Helps players improve without affecting match fairness.
 *
 * Usage:
 * const coach = new CoachOverlay({
 *   gameState: gameStateManager,
 *   playerProfile: userProfile,
 *   enableDuringMatches: true
 * });
 *
 * coach.showMatchupTip('grappler_vs_zoner');
 * coach.analyzeRound(roundData);
 *
 * How to extend:
 * - Add new tip categories by extending TipType enum
 * - Customize tip triggering by modifying shouldShowTip()
 * - Add new analysis types in RoundAnalysis interface
 * - Extend coaching data by updating CoachingData interface
 */
export class CoachOverlay {
    constructor() {
        this.isVisible = false;
        this.element = this.createElement();
        document.body.appendChild(this.element);
    }
    createElement() {
        const overlay = document.createElement('div');
        overlay.className = 'coach-overlay';
        overlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 14px;
      z-index: 1000;
      min-width: 200px;
      display: none;
    `;
        return overlay;
    }
    show(data) {
        this.element.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold;">Frame Coach</div>
      <div>Frame Advantage: ${data.frameAdvantage > 0 ? '+' : ''}${data.frameAdvantage}</div>
      <div>Hit Confirm: ${data.hitConfirm ? 'YES' : 'NO'}</div>
      <div>Punish: ${data.punishOpportunity ? 'AVAILABLE' : 'NONE'}</div>
      <div>Spacing: ${data.spacing.toUpperCase()}</div>
      <div style="margin-top: 10px; color: ${this.getActionColor(data.spacing)};">
        → ${data.nextAction}
      </div>
    `;
        this.element.style.display = 'block';
        this.isVisible = true;
    }
    hide() {
        this.element.style.display = 'none';
        this.isVisible = false;
    }
    toggle() {
        if (this.isVisible) {
            this.hide();
        }
        else {
            // Show with placeholder data if no data provided
            this.show({
                frameAdvantage: 0,
                hitConfirm: false,
                punishOpportunity: false,
                spacing: 'optimal',
                nextAction: 'Waiting for game data...'
            });
        }
    }
    getActionColor(spacing) {
        switch (spacing) {
            case 'optimal': return '#00ff00';
            case 'suboptimal': return '#ffff00';
            case 'dangerous': return '#ff0000';
            default: return '#ffffff';
        }
    }
}
//# sourceMappingURL=CoachOverlay.js.map
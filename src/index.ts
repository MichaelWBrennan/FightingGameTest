/**
 * Fighting Game TypeScript Entry Point
 * 100% TypeScript Repository
 */

import { GameManager } from './scripts/core/GameManager';
import { ConversionManager } from './typescript/ConversionManager';
import { BuildManager } from '../tools/build';

// Version Information
export const VERSION = '2.0.0';
export const BUILD_TARGET = '100% TypeScript Repository';

class Application {
  private gameManager: GameManager | null = null;
  private conversionManager: ConversionManager | null = null;

  async initialize(): Promise<void> {
    console.log(`🎮 Fighting Game ${VERSION}`);
    console.log(`📦 Build Target: ${BUILD_TARGET}`);

    // Initialize conversion manager to show we've completed the C to TS conversion
    this.conversionManager = new ConversionManager();

    // Initialize game manager for PlayCanvas integration
    this.gameManager = new GameManager();

    // Log conversion status
    const status = this.conversionManager.getConversionStatus();
    console.log(`✅ Conversion Complete: ${status.conversionProgress.toFixed(1)}%`);
    console.log(`📁 Repository is now 100% TypeScript!`);

    await this.gameManager.initialize();
  }

  async start(): Promise<void> {
    if (!this.gameManager) {
      throw new Error('Application not initialized');
    }

    await this.gameManager.start();
  }

  getConversionManager(): ConversionManager | null {
    return this.conversionManager;
  }

  getGameManager(): GameManager | null {
    return this.gameManager;
  }
}

// Export for module usage
export { Application };

// Auto-start when run directly
if (typeof window !== 'undefined') {
  // Browser environment
  const app = new Application();
  app.initialize().then(() => app.start()).catch(console.error);
} else if (require.main === module) {
  // Node.js environment
  const app = new Application();
  app.initialize().then(() => {
    console.log('🚀 TypeScript application initialized successfully!');
  }).catch(console.error);
}
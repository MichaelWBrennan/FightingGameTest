
#!/usr/bin/env ts-node

/**
 * Build Script
 * Converted from split.sh
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class BuildManager {
  async runBuild(): Promise<void> {
    console.log('🔨 Starting TypeScript build process...');
    
    try {
      // Clean previous build
      await this.cleanBuild();
      
      // Type check
      await this.typeCheck();
      
      // Compile TypeScript
      await this.compile();
      
      // Run post-build tasks
      await this.postBuild();
      
      console.log('✅ Build completed successfully!');
    } catch (error) {
      console.error('❌ Build failed:', error);
      process.exit(1);
    }
  }

  private async cleanBuild(): Promise<void> {
    console.log('🧹 Cleaning previous build...');
    await execAsync('rm -rf dist');
  }

  private async typeCheck(): Promise<void> {
    console.log('🔍 Running type check...');
    await execAsync('tsc --noEmit');
  }

  private async compile(): Promise<void> {
    console.log('⚙️ Compiling TypeScript...');
    await execAsync('tsc --build');
  }

  private async postBuild(): Promise<void> {
    console.log('📦 Running post-build tasks...');
    // Copy non-TypeScript assets if needed
    await execAsync('cp -r src/shaders dist/ 2>/dev/null || true');
    await execAsync('cp index.html dist/ 2>/dev/null || true');
  }
}

if (require.main === module) {
  const builder = new BuildManager();
  builder.runBuild().catch(console.error);
}

export { BuildManager };

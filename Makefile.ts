
#!/usr/bin/env ts-node

/**
 * TypeScript Build System
 * Converted from Makefile
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';

const execAsync = promisify(exec);

interface BuildTarget {
  name: string;
  description: string;
  action: () => Promise<void>;
}

class TypeScriptBuildSystem {
  private targets: Map<string, BuildTarget> = new Map();

  constructor() {
    this.registerTargets();
  }

  private registerTargets(): void {
    this.targets.set('all', {
      name: 'all',
      description: 'Build entire TypeScript project',
      action: async () => {
        await this.clean();
        await this.build();
        await this.test();
      }
    });

    this.targets.set('build', {
      name: 'build',
      description: 'Compile TypeScript sources',
      action: async () => {
        console.log('🔨 Building TypeScript project...');
        await execAsync('tsc --build');
        console.log('✅ Build completed');
      }
    });

    this.targets.set('clean', {
      name: 'clean',
      description: 'Clean build artifacts',
      action: async () => {
        console.log('🧹 Cleaning build artifacts...');
        await execAsync('rm -rf dist');
        await execAsync('tsc --build --clean');
        console.log('✅ Clean completed');
      }
    });

    this.targets.set('test', {
      name: 'test',
      description: 'Run TypeScript tests',
      action: async () => {
        console.log('🧪 Running tests...');
        await execAsync('bun test');
        console.log('✅ Tests completed');
      }
    });

    this.targets.set('lint', {
      name: 'lint',
      description: 'Lint TypeScript code',
      action: async () => {
        console.log('🔍 Linting TypeScript code...');
        await execAsync('eslint src/ types/ --ext .ts,.tsx');
        console.log('✅ Linting completed');
      }
    });

    this.targets.set('dev', {
      name: 'dev',
      description: 'Start development server',
      action: async () => {
        console.log('🚀 Starting development server...');
        await execAsync('npm run dev');
      }
    });
  }

  async runTarget(targetName: string): Promise<void> {
    const target = this.targets.get(targetName);
    if (!target) {
      console.error(`❌ Unknown target: ${targetName}`);
      this.showHelp();
      process.exit(1);
    }

    try {
      await target.action();
    } catch (error) {
      console.error(`❌ Target '${targetName}' failed:`, error);
      process.exit(1);
    }
  }

  private showHelp(): void {
    console.log('Available targets:');
    for (const [name, target] of this.targets) {
      console.log(`  ${name.padEnd(10)} - ${target.description}`);
    }
  }

  private async clean(): Promise<void> {
    await this.targets.get('clean')!.action();
  }

  private async build(): Promise<void> {
    await this.targets.get('build')!.action();
  }

  private async test(): Promise<void> {
    await this.targets.get('test')!.action();
  }
}

if (require.main === module) {
  const buildSystem = new TypeScriptBuildSystem();
  const target = process.argv[2] || 'all';
  buildSystem.runTarget(target).catch(console.error);
}

export { TypeScriptBuildSystem };

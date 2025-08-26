
#!/usr/bin/env ts-node

/**
 * TypeScript Dependency Analyzer
 * Converted from dependency_analyzer.py
 */

import * as fs from 'fs';
import * as path from 'path';

interface Dependency {
  from: string;
  to: string;
  type: 'import' | 'reference' | 'type';
}

class DependencyAnalyzer {
  private dependencies: Dependency[] = [];
  private files: Set<string> = new Set();

  async analyzeDependencies(): Promise<void> {
    console.log('🔍 Analyzing TypeScript dependencies...');
    
    await this.scanFiles('src');
    await this.scanFiles('types');
    
    console.log(`📊 Analyzed ${this.files.size} files`);
    console.log(`🔗 Found ${this.dependencies.length} dependencies`);
    
    await this.generateReport();
  }

  private async scanFiles(dir: string): Promise<void> {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await this.scanFiles(fullPath);
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        this.files.add(fullPath);
        await this.analyzeFile(fullPath);
      }
    }
  }

  private async analyzeFile(filePath: string): Promise<void> {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find import statements
    const importMatches = content.matchAll(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
    for (const match of importMatches) {
      const importPath = match[1];
      this.dependencies.push({
        from: filePath,
        to: this.resolveImportPath(importPath, filePath),
        type: 'import'
      });
    }
    
    // Find type references
    const typeMatches = content.matchAll(/:\s*(\w+)/g);
    for (const match of typeMatches) {
      const typeName = match[1];
      if (this.isCustomType(typeName)) {
        this.dependencies.push({
          from: filePath,
          to: typeName,
          type: 'type'
        });
      }
    }
  }

  private resolveImportPath(importPath: string, currentFile: string): string {
    if (importPath.startsWith('.')) {
      const currentDir = path.dirname(currentFile);
      return path.resolve(currentDir, importPath);
    }
    return importPath;
  }

  private isCustomType(typeName: string): boolean {
    const builtinTypes = ['string', 'number', 'boolean', 'object', 'any', 'void', 'undefined', 'null'];
    return !builtinTypes.includes(typeName.toLowerCase());
  }

  private async generateReport(): Promise<void> {
    const report = {
      summary: {
        totalFiles: this.files.size,
        totalDependencies: this.dependencies.length,
        importDependencies: this.dependencies.filter(d => d.type === 'import').length,
        typeDependencies: this.dependencies.filter(d => d.type === 'type').length
      },
      dependencies: this.dependencies,
      circularDependencies: this.findCircularDependencies()
    };
    
    fs.writeFileSync('dependency-report.json', JSON.stringify(report, null, 2));
    console.log('📄 Dependency report generated: dependency-report.json');
  }

  private findCircularDependencies(): string[][] {
    // Simple circular dependency detection
    const graph = new Map<string, string[]>();
    
    for (const dep of this.dependencies) {
      if (dep.type === 'import') {
        if (!graph.has(dep.from)) {
          graph.set(dep.from, []);
        }
        graph.get(dep.from)!.push(dep.to);
      }
    }
    
    // TODO: Implement proper cycle detection algorithm
    return [];
  }
}

if (require.main === module) {
  const analyzer = new DependencyAnalyzer();
  analyzer.analyzeDependencies().catch(console.error);
}

export { DependencyAnalyzer };

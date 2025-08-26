#!/usr/bin/env ts-node

/**
 * Convert all remaining .h header files to .d.ts TypeScript definition files
 */

import * as fs from 'fs';
import * as path from 'path';

class HeaderToTSConverter {
  private processedFiles = 0;

  async convertAllHeaders(): Promise<void> {
    console.log('🔍 Finding all .h header files...');

    const headerFiles = await this.findAllHeaderFiles();
    console.log(`📝 Found ${headerFiles.length} header files to convert`);

    for (const headerPath of headerFiles) {
      await this.convertHeaderFile(headerPath);
    }

    console.log(`✅ Successfully converted ${this.processedFiles} header files to TypeScript definitions!`);
  }

  private async findAllHeaderFiles(): Promise<string[]> {
    const headerFiles: string[] = [];
    const excludeDirs = ['node_modules', '.git', '.ccls-cache', 'dist'];

    await this.scanForHeaders('.', headerFiles, excludeDirs);
    return headerFiles;
  }

  private async scanForHeaders(dir: string, headerFiles: string[], excludeDirs: string[]): Promise<void> {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !excludeDirs.includes(entry.name)) {
        await this.scanForHeaders(fullPath, headerFiles, excludeDirs);
      } else if (entry.name.endsWith('.h')) {
        headerFiles.push(fullPath);
      }
    }
  }

  private async convertHeaderFile(headerPath: string): Promise<void> {
    try {
      const content = fs.readFileSync(headerPath, 'utf8');
      const tsDefinition = this.convertHeaderToTypeScript(content, headerPath);

      // Create .d.ts file path
      const dtsPath = headerPath.replace(/\.h$/, '.d.ts');

      fs.writeFileSync(dtsPath, tsDefinition);

      // Remove original .h file
      fs.unlinkSync(headerPath);

      this.processedFiles++;
      console.log(`✓ ${headerPath} -> ${dtsPath}`);
    } catch (error) {
      console.error(`✗ Failed to convert ${headerPath}:`, error);
    }
  }

  private convertHeaderToTypeScript(content: string, originalPath: string): string {
    const fileName = path.basename(originalPath, '.h');

    let result = `/**
 * TypeScript definitions for ${fileName}
 * Converted from: ${originalPath}
 */

`;

    // Remove C preprocessor directives
    content = content.replace(/#ifndef.*$/gm, '');
    content = content.replace(/#define.*$/gm, '');
    content = content.replace(/#endif.*$/gm, '');
    content = content.replace(/#include.*$/gm, '');
    content = content.replace(/#ifdef.*$/gm, '');
    content = content.replace(/#else.*$/gm, '');
    content = content.replace(/extern\s+"C"\s*{/g, '');

    // Convert C types to TypeScript types
    const typeReplacements = [
      [/\bint\b/g, 'number'],
      [/\bfloat\b/g, 'number'],
      [/\bdouble\b/g, 'number'],
      [/\bchar\s*\*/g, 'string'],
      [/\bchar\b/g, 'string'],
      [/\bvoid\s*\*/g, 'any'],
      [/\bvoid\b/g, 'void'],
      [/\bunsigned\s+int\b/g, 'number'],
      [/\bunsigned\s+char\b/g, 'number'],
      [/\bunsigned\s+short\b/g, 'number'],
      [/\bshort\b/g, 'number'],
      [/\blong\b/g, 'number'],
    ];

    for (const [pattern, replacement] of typeReplacements) {
      content = content.replace(pattern, replacement);
    }

    // Convert struct definitions to interfaces
    content = content.replace(/typedef\s+struct\s*{([^}]+)}\s*(\w+);/g, (match, body, name) => {
      const fields = body.split(';')
        .filter(f => f.trim())
        .map(field => {
          field = field.trim();
          if (!field) return '';

          // Basic field conversion
          const parts = field.split(/\s+/);
          if (parts.length >= 2) {
            const type = parts[0];
            const name = parts[parts.length - 1];
            return `  ${name}: ${type};`;
          }
          return `  ${field};`;
        })
        .filter(f => f)
        .join('\n');

      return `export interface ${name} {\n${fields}\n}`;
    });

    // Convert function declarations
    content = content.replace(/(\w+)\s+(\w+)\s*\(([^)]*)\)\s*;/g, (match, returnType, funcName, params) => {
      const paramList = params.split(',')
        .map(p => p.trim())
        .filter(p => p && p !== 'void')
        .map(p => {
          const parts = p.trim().split(/\s+/);
          if (parts.length >= 2) {
            const type = parts[0];
            const name = parts[parts.length - 1];
            return `${name}: ${type}`;
          }
          return p;
        })
        .join(', ');

      return `export declare function ${funcName}(${paramList}): ${returnType};`;
    });

    // Convert #define constants to const declarations
    const originalContent = fs.readFileSync(originalPath, 'utf8');
    const defineMatches = originalContent.match(/#define\s+(\w+)\s+(.+)/g);
    if (defineMatches) {
      result += '// Constants\n';
      for (const match of defineMatches) {
        const [, name, value] = match.match(/#define\s+(\w+)\s+(.+)/) || [];
        if (name && value) {
          const cleanValue = value.replace(/\/\*.*?\*\//g, '').trim();
          result += `export const ${name} = ${cleanValue};\n`;
        }
      }
      result += '\n';
    }

    result += content;

    // Clean up empty lines and formatting
    result = result.replace(/\n\s*\n\s*\n/g, '\n\n');
    result = result.replace(/^\s*$/gm, '');

    return result;
  }
}

// Run the converter
if (require.main === module) {
  const converter = new HeaderToTSConverter();
  converter.convertAllHeaders().catch(console.error);
}

export { HeaderToTSConverter };
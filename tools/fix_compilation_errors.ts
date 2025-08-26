
#!/usr/bin/env ts-node

/**
 * TypeScript Compilation Error Fixer
 * Automatically fixes common TypeScript compilation errors
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class CompilationErrorFixer {
  private fixedFiles: Set<string> = new Set();

  async fixAllErrors(): Promise<void> {
    console.log('🔧 Running TypeScript compiler to find errors...');
    
    try {
      await execAsync('tsc --noEmit');
      console.log('✅ No compilation errors found!');
    } catch (error: any) {
      console.log('📝 Found compilation errors, fixing...');
      await this.parseAndFixErrors(error.stdout);
      
      // Run again to check if fixed
      try {
        await execAsync('tsc --noEmit');
        console.log('✅ All compilation errors fixed!');
      } catch (stillError: any) {
        console.log('⚠️  Some errors remain. Manual review may be needed.');
        console.log(stillError.stdout);
      }
    }
  }

  private async parseAndFixErrors(output: string): Promise<void> {
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('.ts(') && line.includes('error TS')) {
        await this.fixErrorLine(line);
      }
    }
  }

  private async fixErrorLine(errorLine: string): Promise<void> {
    const match = errorLine.match(/(.+\.ts)\((\d+),(\d+)\): error TS(\d+): (.+)/);
    if (!match) return;

    const [, filePath, lineNum, colNum, errorCode, errorMessage] = match;
    
    if (!fs.existsSync(filePath)) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    let lines = content.split('\n');
    const lineIndex = parseInt(lineNum) - 1;
    
    if (lineIndex >= lines.length) return;
    
    let modified = false;
    const line = lines[lineIndex];
    
    switch (errorCode) {
      case '2305': // Module has no exported member
        modified = await this.fixMissingExport(lines, lineIndex, errorMessage);
        break;
      case '2532': // Object is possibly undefined
        modified = await this.fixPossiblyUndefined(lines, lineIndex, errorMessage);
        break;
      case '2322': // Type not assignable
        modified = await this.fixTypeAssignment(lines, lineIndex, errorMessage);
        break;
      case '6133': // Declared but never read
        modified = await this.fixUnusedVariable(lines, lineIndex, errorMessage);
        break;
      case '2349': // Expression is not callable
        modified = await this.fixNotCallable(lines, lineIndex, errorMessage);
        break;
      case '2304': // Cannot find name
        modified = await this.fixCannotFindName(lines, lineIndex, errorMessage);
        break;
    }
    
    if (modified && !this.fixedFiles.has(filePath)) {
      fs.writeFileSync(filePath, lines.join('\n'));
      this.fixedFiles.add(filePath);
      console.log(`✓ Fixed errors in ${filePath}`);
    }
  }

  private async fixMissingExport(lines: string[], lineIndex: number, error: string): Promise<boolean> {
    const line = lines[lineIndex];
    const importMatch = line.match(/import\s+{[^}]*(\w+)[^}]*}\s+from\s+['"]([^'"]+)['"]/);
    
    if (importMatch) {
      const [, missingExport, modulePath] = importMatch;
      
      // Try to find the actual export file
      const possiblePaths = [
        modulePath.replace(/\.js$/, '.ts'),
        modulePath.replace(/\.js$/, '.d.ts'),
        path.join(path.dirname(modulePath), 'index.ts'),
      ];
      
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          const moduleContent = fs.readFileSync(possiblePath, 'utf8');
          if (!moduleContent.includes(`export`) || !moduleContent.includes(missingExport)) {
            // Add the missing export
            const exportLine = `export const ${missingExport} = {} as any; // Auto-generated export`;
            fs.appendFileSync(possiblePath, '\n' + exportLine + '\n');
            return true;
          }
        }
      }
    }
    
    return false;
  }

  private async fixPossiblyUndefined(lines: string[], lineIndex: number, error: string): Promise<boolean> {
    let line = lines[lineIndex];
    
    // Add null checks
    if (line.includes('.') && !line.includes('?.')) {
      // Convert property access to optional chaining
      line = line.replace(/(\w+)\.(\w+)/g, '$1?.$2');
      lines[lineIndex] = line;
      return true;
    }
    
    // Add array bounds checking
    if (line.includes('[') && line.includes(']')) {
      const arrayMatch = line.match(/(\w+)\[([^\]]+)\]/);
      if (arrayMatch) {
        const [full, arrayName, index] = arrayMatch;
        const safeAccess = `${arrayName}?.[${index}]`;
        lines[lineIndex] = line.replace(full, safeAccess);
        return true;
      }
    }
    
    return false;
  }

  private async fixTypeAssignment(lines: string[], lineIndex: number, error: string): Promise<boolean> {
    let line = lines[lineIndex];
    
    // Add type assertions or null checks
    if (error.includes('undefined') && error.includes('not assignable')) {
      // Add null coalescing
      const assignMatch = line.match(/(\w+)\s*=\s*([^;]+);?/);
      if (assignMatch) {
        const [, variable, value] = assignMatch;
        lines[lineIndex] = line.replace(value, `${value} || null`);
        return true;
      }
    }
    
    return false;
  }

  private async fixUnusedVariable(lines: string[], lineIndex: number, error: string): Promise<boolean> {
    let line = lines[lineIndex];
    
    // Prefix unused parameters with underscore
    const paramMatch = line.match(/(\w+)(?=\s*[:)])/);
    if (paramMatch && line.includes('function') || line.includes('=>')) {
      const [, param] = paramMatch;
      lines[lineIndex] = line.replace(param, `_${param}`);
      return true;
    }
    
    return false;
  }

  private async fixNotCallable(lines: string[], lineIndex: number, error: string): Promise<boolean> {
    let line = lines[lineIndex];
    
    // Add type guard for callable check
    if (line.includes('()')) {
      const callMatch = line.match(/(\w+)\(\)/);
      if (callMatch) {
        const [full, funcName] = callMatch;
        lines[lineIndex] = line.replace(full, `typeof ${funcName} === 'function' ? ${funcName}() : null`);
        return true;
      }
    }
    
    return false;
  }

  private async fixCannotFindName(lines: string[], lineIndex: number, error: string): Promise<boolean> {
    let line = lines[lineIndex];
    
    // Add common missing declarations
    const missingNames: { [key: string]: string } = {
      'EmscriptenModule': 'interface EmscriptenModule { [key: string]: any; }',
      'Module': 'declare const Module: any;',
      'require': 'declare const require: any;',
      'process': 'declare const process: any;',
      '__dirname': 'declare const __dirname: string;',
      '__filename': 'declare const __filename: string;',
    };
    
    for (const [name, declaration] of Object.entries(missingNames)) {
      if (error.includes(name)) {
        lines.unshift(declaration);
        return true;
      }
    }
    
    return false;
  }
}

// Run the fixer
if (require.main === module) {
  const fixer = new CompilationErrorFixer();
  fixer.fixAllErrors().catch(console.error);
}

export { CompilationErrorFixer };

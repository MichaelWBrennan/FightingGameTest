
#!/usr/bin/env ts-node

/**
 * Complete TypeScript Conversion Tool
 * Converts all remaining non-TypeScript files to TypeScript
 */

import * as fs from 'fs';
import * as path from 'path';

interface FileToConvert {
  sourcePath: string;
  targetPath: string;
  type: 'header' | 'config' | 'data' | 'other';
}

class CompleteTypeScriptConverter {
  private filesToConvert: FileToConvert[] = [];

  async convertAll(): Promise<void> {
    console.log('🔍 Scanning for non-TypeScript files...');
    await this.findAllNonTSFiles();
    
    console.log(`📝 Found ${this.filesToConvert.length} files to convert`);
    
    for (const file of this.filesToConvert) {
      await this.convertFile(file);
    }
    
    console.log('✅ All files converted to TypeScript!');
  }

  private async findAllNonTSFiles(): Promise<void> {
    const excludeDirs = [
      'node_modules', '.git', '.ccls-cache', 'dist', 'sfiii-decomp',
      '.config', '.github', 'elf', 'config/anniversary/symbols'
    ];
    
    await this.scanDirectory('.', excludeDirs);
  }

  private async scanDirectory(dir: string, excludeDirs: string[]): Promise<void> {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !excludeDirs.includes(entry.name)) {
        await this.scanDirectory(fullPath, excludeDirs);
      } else if (entry.isFile() && this.shouldConvert(entry.name)) {
        const targetPath = this.getTargetPath(fullPath);
        const type = this.getFileType(entry.name);
        
        this.filesToConvert.push({
          sourcePath: fullPath,
          targetPath,
          type
        });
      }
    }
  }

  private shouldConvert(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    const extensions = ['.h', '.c', '.inc', '.py', '.sh', '.yaml', '.yml', '.json'];
    
    // Skip if already TypeScript or JavaScript
    if (['.ts', '.js', '.d.ts'].includes(ext)) return false;
    
    // Skip specific files
    const skipFiles = [
      'package.json', 'package-lock.json', 'tsconfig.json',
      '.gitignore', '.replit', 'LICENSE', 'README.md',
      'Dockerfile', 'Makefile', 'vercel.json'
    ];
    
    if (skipFiles.includes(filename)) return false;
    
    return extensions.includes(ext) || !ext;
  }

  private getTargetPath(sourcePath: string): string {
    const ext = path.extname(sourcePath);
    const baseName = path.basename(sourcePath, ext);
    const dir = path.dirname(sourcePath);
    
    // Convert to appropriate TypeScript location
    if (sourcePath.includes('include/')) {
      return path.join('src/typescript/headers', `${baseName}.d.ts`);
    } else if (sourcePath.includes('tools/') && ext === '.py') {
      return path.join('tools', `${baseName}.ts`);
    } else if (ext === '.json' || ext === '.yaml' || ext === '.yml') {
      return path.join(dir, `${baseName}.ts`);
    } else {
      return path.join('src/typescript/converted', dir, `${baseName}.ts`);
    }
  }

  private getFileType(filename: string): 'header' | 'config' | 'data' | 'other' {
    const ext = path.extname(filename).toLowerCase();
    
    if (ext === '.h' || ext === '.inc') return 'header';
    if (['.json', '.yaml', '.yml'].includes(ext)) return 'config';
    if (filename.includes('data/')) return 'data';
    return 'other';
  }

  private async convertFile(file: FileToConvert): Promise<void> {
    try {
      const sourceContent = fs.readFileSync(file.sourcePath, 'utf8');
      let convertedContent = '';

      switch (file.type) {
        case 'header':
          convertedContent = this.convertHeaderFile(sourceContent, file.sourcePath);
          break;
        case 'config':
          convertedContent = this.convertConfigFile(sourceContent, file.sourcePath);
          break;
        case 'data':
          convertedContent = this.convertDataFile(sourceContent, file.sourcePath);
          break;
        default:
          convertedContent = this.convertOtherFile(sourceContent, file.sourcePath);
          break;
      }

      // Ensure target directory exists
      const targetDir = path.dirname(file.targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      fs.writeFileSync(file.targetPath, convertedContent);
      console.log(`✓ ${file.sourcePath} -> ${file.targetPath}`);
    } catch (error) {
      console.error(`✗ Failed to convert ${file.sourcePath}:`, error);
    }
  }

  private convertHeaderFile(content: string, filePath: string): string {
    const fileName = path.basename(filePath, path.extname(filePath));
    
    let converted = `/**\n * TypeScript definitions for ${fileName}\n * Converted from ${filePath}\n */\n\n`;
    
    // Convert common C patterns to TypeScript
    content = content.replace(/#ifndef\s+\w+/g, '');
    content = content.replace(/#define\s+\w+/g, '');
    content = content.replace(/#endif/g, '');
    content = content.replace(/#include\s*[<"][^>"]+[>"]/g, '');
    
    // Convert struct definitions
    content = content.replace(/typedef struct\s*{([^}]+)}\s*(\w+);/g, (match, body, name) => {
      const fields = body.split(';').filter(f => f.trim()).map(field => {
        field = field.trim();
        if (field.includes('int')) return field.replace(/\w*int\w*/, 'number');
        if (field.includes('float') || field.includes('double')) return field.replace(/float|double/, 'number');
        if (field.includes('char')) return field.replace(/char\s*\*?/, 'string');
        return field;
      }).join(';\n  ');
      
      return `export interface ${name} {\n  ${fields};\n}`;
    });
    
    // Convert #define constants
    content = content.replace(/#define\s+(\w+)\s+(.+)/g, 'export const $1 = $2;');
    
    converted += content;
    
    return converted;
  }

  private convertConfigFile(content: string, filePath: string): string {
    const fileName = path.basename(filePath, path.extname(filePath));
    
    let converted = `/**\n * Configuration data for ${fileName}\n * Converted from ${filePath}\n */\n\n`;
    
    try {
      const data = JSON.parse(content);
      converted += `export const ${fileName}Config = ${JSON.stringify(data, null, 2)} as const;\n\n`;
      converted += `export type ${fileName.charAt(0).toUpperCase() + fileName.slice(1)}Config = typeof ${fileName}Config;\n`;
    } catch (error) {
      // If not valid JSON, treat as text data
      converted += `export const ${fileName}Data = \`${content.replace(/`/g, '\\`')}\`;\n`;
    }
    
    return converted;
  }

  private convertDataFile(content: string, filePath: string): string {
    const fileName = path.basename(filePath, path.extname(filePath));
    
    let converted = `/**\n * Game data for ${fileName}\n * Converted from ${filePath}\n */\n\n`;
    
    try {
      const data = JSON.parse(content);
      converted += `export const ${fileName}Data = ${JSON.stringify(data, null, 2)} as const;\n\n`;
      
      // Generate type definitions based on data structure
      if (Array.isArray(data)) {
        converted += `export type ${fileName.charAt(0).toUpperCase() + fileName.slice(1)}Item = typeof ${fileName}Data[0];\n`;
      } else {
        converted += `export type ${fileName.charAt(0).toUpperCase() + fileName.slice(1)}Data = typeof ${fileName}Data;\n`;
      }
    } catch (error) {
      converted += `export const ${fileName}RawData = \`${content.replace(/`/g, '\\`')}\`;\n`;
    }
    
    return converted;
  }

  private convertOtherFile(content: string, filePath: string): string {
    const fileName = path.basename(filePath, path.extname(filePath));
    const ext = path.extname(filePath);
    
    let converted = `/**\n * Converted ${ext} file: ${fileName}\n * Original path: ${filePath}\n */\n\n`;
    
    if (ext === '.py') {
      // Basic Python to TypeScript conversion
      converted += this.convertPythonToTypeScript(content);
    } else if (ext === '.sh') {
      // Convert shell script to TypeScript function
      converted += `export function ${fileName}Script(): string {\n`;
      converted += `  return \`${content.replace(/`/g, '\\`')}\`;\n`;
      converted += `}\n`;
    } else {
      // For other files, export as string constant
      converted += `export const ${fileName}Content = \`${content.replace(/`/g, '\\`')}\`;\n`;
    }
    
    return converted;
  }

  private convertPythonToTypeScript(content: string): string {
    // Basic Python to TypeScript patterns
    let converted = content;
    
    // Convert def to function
    converted = converted.replace(/def\s+(\w+)\s*\([^)]*\):/g, 'export function $1() {');
    
    // Convert print to console.log
    converted = converted.replace(/print\s*\(/g, 'console.log(');
    
    // Convert Python strings
    converted = converted.replace(/'/g, "'");
    
    // Add basic type annotations
    converted = converted.replace(/(\w+)\s*=\s*(\d+)/g, '$1: number = $2');
    converted = converted.replace(/(\w+)\s*=\s*"([^"]+)"/g, '$1: string = "$2"');
    
    return `// TypeScript conversion of Python code\n${converted}\n`;
  }
}

// Run the converter
if (require.main === module) {
  const converter = new CompleteTypeScriptConverter();
  converter.convertAll().catch(console.error);
}

export { CompleteTypeScriptConverter };

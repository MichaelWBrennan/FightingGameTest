
#!/usr/bin/env ts-node

/**
 * Generate PCSX2 symbols from TypeScript definitions
 * Converted from generate_pcsx2_syms.py
 */

import * as fs from 'fs';
import * as path from 'path';

interface Symbol {
  address: string;
  type: string;
  name: string;
}

class PCSX2SymbolGenerator {
  private symbols: Symbol[] = [];

  async generateSymbols(): Promise<void> {
    console.log('🔍 Scanning TypeScript files for symbols...');
    
    await this.scanTypeScriptFiles('src/typescript');
    await this.scanTypeScriptFiles('include');
    
    console.log(`📝 Found ${this.symbols.length} symbols`);
    
    const symbolsContent = this.formatSymbols();
    fs.writeFileSync('symbols.txt', symbolsContent);
    
    console.log('✅ PCSX2 symbols generated successfully!');
  }

  private async scanTypeScriptFiles(dir: string): Promise<void> {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await this.scanTypeScriptFiles(fullPath);
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.d.ts')) {
        await this.extractSymbolsFromFile(fullPath);
      }
    }
  }

  private async extractSymbolsFromFile(filePath: string): Promise<void> {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract function declarations
    const functionMatches = content.matchAll(/export\s+(?:declare\s+)?function\s+(\w+)/g);
    for (const match of functionMatches) {
      this.symbols.push({
        address: this.generateAddress(),
        type: 'FUNC',
        name: match[1]
      });
    }
    
    // Extract interface/type declarations
    const interfaceMatches = content.matchAll(/export\s+(?:interface|type)\s+(\w+)/g);
    for (const match of interfaceMatches) {
      this.symbols.push({
        address: this.generateAddress(),
        type: 'OBJECT',
        name: match[1]
      });
    }
    
    // Extract const declarations
    const constMatches = content.matchAll(/export\s+const\s+(\w+)/g);
    for (const match of constMatches) {
      this.symbols.push({
        address: this.generateAddress(),
        type: 'OBJECT',
        name: match[1]
      });
    }
  }

  private generateAddress(): string {
    // Generate placeholder addresses for PCSX2
    const base = 0x00100000;
    const offset = this.symbols.length * 0x10;
    return (base + offset).toString(16).toUpperCase().padStart(8, '0');
  }

  private formatSymbols(): string {
    return this.symbols
      .map(symbol => `${symbol.address} ${symbol.type} ${symbol.name}`)
      .join('\n');
  }
}

if (require.main === module) {
  const generator = new PCSX2SymbolGenerator();
  generator.generateSymbols().catch(console.error);
}

export { PCSX2SymbolGenerator };

import { promises as fs } from 'fs';
import * as path from 'path';

interface Symbol {
    name: string;
    address: number;
}

async function extractSymbols(filePath: string): Promise<Symbol[]> {
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const symbols: Symbol[] = [];
        // Regex for "NAME = ADDRESS; // comment"
        const pattern = /((?:\w|_)+) = (\w+);(?: // .*)?/g;
        let match: RegExpExecArray | null;

        while ((match = pattern.exec(fileContent)) !== null) {
            const [, name, addressStr] = match;
            const address = parseInt(addressStr, 16);
            if (!isNaN(address)) {
                symbols.push({ name, address });
            }
        }
        return symbols;
    } catch (error) {
        console.error(`Error reading or parsing file ${filePath}:`, error);
        return [];
    }
}

async function main() {
    const symbolsDir = 'config/anniversary/symbols';
    let allSymbols: Symbol[] = [];

    try {
        const entries = await fs.readdir(symbolsDir, { withFileTypes: true });
        const incFiles = entries
            .filter(dirent => dirent.isFile() && dirent.name.endsWith('.inc'))
            .map(dirent => path.join(symbolsDir, dirent.name));

        const symbolPromises = incFiles.map(filePath => extractSymbols(filePath));
        const symbolArrays = await Promise.all(symbolPromises);
        allSymbols = symbolArrays.flat();

        allSymbols.sort((a, b) => a.address - b.address);

        for (const symbol of allSymbols) {
            console.log(`${symbol.address.toString(16).toUpperCase().padStart(8, '0')} ${symbol.name}`);
        }

    } catch (error) {
        console.error(`Error processing symbols directory ${symbolsDir}:`, error);
    }
}

// Check if the script is being run directly in Node.js.
// This check requires '@types/node' to be installed for TypeScript to recognize 'require' and 'module'.
if (typeof require !== 'undefined' && require.main === module) {
    main();
}
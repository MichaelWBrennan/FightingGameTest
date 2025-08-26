
/**
 * Project Dependencies
 * Converted from requirements-python.txt and requirements-debian.txt
 */

export const projectDependencies = {
  runtime: [
    'playcanvas',
    'typescript'
  ],
  
  development: [
    '@types/node',
    '@types/web',
    '@typescript-eslint/eslint-plugin',
    '@typescript-eslint/parser',
    'eslint',
    'rollup',
    'rollup-plugin-typescript2',
    'serve'
  ],
  
  system: [
    // Equivalent to former Python/Debian requirements
    'build-essential',
    'git',
    'nodejs',
    'npm'
  ]
} as const;

export type RuntimeDependency = typeof projectDependencies.runtime[number];
export type DevDependency = typeof projectDependencies.development[number];
export type SystemDependency = typeof projectDependencies.system[number];

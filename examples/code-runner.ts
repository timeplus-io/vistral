import * as Babel from '@babel/standalone';

/**
 * Strips all import statements from code (handles single and multi-line).
 */
export function stripImports(code: string): string {
  const lines = code.split('\n');
  const result: string[] = [];
  let inImport = false;

  for (const line of lines) {
    if (!inImport && line.trimStart().startsWith('import ')) {
      inImport = true;
      // Single-line import ends with from '...' or is a side-effect import
      if (/from\s+['"][^'"]+['"]|^import\s+['"]/.test(line)) {
        inImport = false;
      }
      continue;
    }
    if (inImport) {
      if (/from\s+['"][^'"]+['"]/.test(line)) {
        inImport = false;
      }
      continue;
    }
    result.push(line);
  }

  return result.join('\n');
}

/**
 * Finds the name of the last declared React component (uppercase identifier)
 * in the given code string. Returns null if none found.
 */
export function findLastComponentName(code: string): string | null {
  const matches = [...code.matchAll(/(?:export\s+)?(?:function|const|var|let)\s+([A-Z][A-Za-z0-9_]*)/g)];
  if (matches.length === 0) return null;
  return matches[matches.length - 1][1];
}

/**
 * Transforms TypeScript/JSX code and returns a React component by:
 * 1. Babel-transforming (strips types, compiles JSX)
 * 2. Stripping import statements
 * 3. Stripping export keywords (invalid inside new Function)
 * 4. Finding the last declared component name
 * 5. Executing via new Function with injected scope
 *
 * @param code - Raw TypeScript/JSX source string
 * @param scope - Object whose keys become available as variables inside the code
 * @returns A React component function
 * @throws If no component is found or code has syntax errors
 */
export function buildComponent(
  code: string,
  scope: Record<string, unknown>
): React.ComponentType {
  // Step 1: Babel transform (JSX → React.createElement, strip TS types)
  const transformed = Babel.transform(code, {
    presets: ['react', 'typescript'],
    filename: 'example.tsx',
  }).code!;

  // Step 2: Strip import statements
  const noImports = stripImports(transformed);

  // Step 3: Strip export keywords (export function Foo → function Foo)
  const noExports = noImports.replace(/\bexport\s+(default\s+)?/g, '');

  // Step 4: Find the last component name
  const componentName = findLastComponentName(noExports);
  if (!componentName) {
    throw new Error('No component found in code');
  }

  // Step 5: Execute via new Function with injected scope
  const keys = Object.keys(scope);
  const values = Object.values(scope);
  const fn = new Function(...keys, `${noExports}\nreturn ${componentName};`);

  return fn(...values) as React.ComponentType;
}

import { describe, it, expect } from 'vitest';
import React from 'react';
import { stripImports, findLastComponentName, buildComponent } from '../../../examples/code-runner';

describe('stripImports', () => {
  it('removes single-line imports', () => {
    const code = `import React from 'react';\nconst x = 1;`;
    expect(stripImports(code)).not.toContain('import');
    expect(stripImports(code)).toContain('const x = 1;');
  });

  it('removes multi-line imports', () => {
    const code = `import {\n  StreamChart,\n  useStreamingData,\n} from '@timeplus/vistral';\nconst x = 1;`;
    expect(stripImports(code)).not.toContain('import');
    expect(stripImports(code)).toContain('const x = 1;');
  });

  it('removes multiple imports', () => {
    const code = `import React from 'react';\nimport { foo } from './bar';\nfunction MyComp() {}`;
    const result = stripImports(code);
    expect(result).not.toContain('import');
    expect(result).toContain('function MyComp');
  });

  it('returns code unchanged when no imports', () => {
    const code = `function MyComp() { return null; }`;
    expect(stripImports(code)).toContain('function MyComp');
  });
});

describe('findLastComponentName', () => {
  it('finds a function declaration', () => {
    expect(findLastComponentName('function MyChart() {}')).toBe('MyChart');
  });

  it('finds a const arrow function', () => {
    expect(findLastComponentName('const MyChart = () => null;')).toBe('MyChart');
  });

  it('returns last component when multiple exist', () => {
    const code = `function Helper() {}\nfunction MainChart() {}`;
    expect(findLastComponentName(code)).toBe('MainChart');
  });

  it('ignores lowercase identifiers (not components)', () => {
    const code = `const helper = () => {};\nfunction MyChart() {}`;
    expect(findLastComponentName(code)).toBe('MyChart');
  });

  it('returns null when no component found', () => {
    expect(findLastComponentName('const x = 5;')).toBeNull();
  });
});

describe('buildComponent', () => {
  it('transforms JSX and returns a callable function', () => {
    const code = `
      function HelloWorld() {
        return React.createElement('div', null, 'Hello');
      }
    `;
    const Component = buildComponent(code, { React });
    expect(typeof Component).toBe('function');
  });

  it('handles export function declarations', () => {
    const code = `
      export function MyComp() {
        return React.createElement('div', null, 'hi');
      }
    `;
    const Component = buildComponent(code, { React });
    expect(typeof Component).toBe('function');
  });

  it('handles JSX syntax', () => {
    const code = `
      function MyComp() {
        return <div>hello</div>;
      }
    `;
    const Component = buildComponent(code, { React });
    expect(typeof Component).toBe('function');
  });

  it('throws when no component name found', () => {
    expect(() => buildComponent('const x = 5;', { React })).toThrow('No component found');
  });

  it('injects scope variables so component can use them', () => {
    const code = `
      function MyComp() {
        const val = injectedValue;
        return React.createElement('div', null, val);
      }
    `;
    const Component = buildComponent(code, { React, injectedValue: 42 });
    expect(typeof Component).toBe('function');
  });
});

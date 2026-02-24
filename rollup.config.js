import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import dts from 'rollup-plugin-dts';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';

const external = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  '@antv/g2',
  '@antv/s2',
  'lodash',
  'ramda'
];

const globals = {
  react: 'React',
  'react-dom': 'ReactDOM',
  'react/jsx-runtime': 'React',
  'react/jsx-dev-runtime': 'React',
  '@antv/g2': 'G2',
  '@antv/s2': 'S2',
  lodash: '_',
  ramda: 'R',
};

export default [
  // Main bundle
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true,
      },
      {
        file: 'dist/index.umd.js',
        format: 'umd',
        name: 'Vistral',
        globals,
        sourcemap: true,
        exports: 'named',
      },
      {
        file: 'dist/index.umd.min.js',
        format: 'umd',
        name: 'Vistral',
        globals,
        sourcemap: true,
        exports: 'named',
        plugins: [terser()],
      },
    ],
    external,
    plugins: [
      replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
        preventAssignment: true,
      }),
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        exclude: ['src/__tests__/**'],
        compilerOptions: {
          jsx: 'react',
          declarationDir: null,
        },
      }),
      postcss({
        extract: true,
        minimize: true,
      }),
    ],
  },
  // Type declarations
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'esm',
    },
    external: [...external, /\.css$/],
    plugins: [dts()],
  },
];

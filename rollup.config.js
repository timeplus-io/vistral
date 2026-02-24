import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import dts from 'rollup-plugin-dts';
import terser from '@rollup/plugin-terser';

const external = ['react', 'react-dom', '@antv/g2', '@antv/s2', 'lodash', 'ramda'];
const globals = {
  react: 'React',
  'react-dom': 'ReactDOM',
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
      },
      {
        file: 'dist/index.umd.min.js',
        format: 'umd',
        name: 'Vistral',
        globals,
        sourcemap: true,
        plugins: [terser()],
      },
    ],
    external,
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
      postcss({
        extract: 'styles.css',
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

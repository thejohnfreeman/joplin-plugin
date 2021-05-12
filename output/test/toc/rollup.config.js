import copy from 'rollup-plugin-copy'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'

import joplinConfig from './plugin.config.json'

const extras = joplinConfig.extraScripts.map((relative) => ({
  input: `src/${relative}`,
  output: {
    // TODO: Remove .ts extension.
    file: `dist/${relative}.js`,
    format: 'iife',
  },
  plugins: [typescript()],
}))

export default [
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'iife',
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript(),
      copy({
        targets: [{ src: ['src/**/*', '!src/**/*.ts{,x}'], dest: 'dist' }],
      }),
      terser(),
    ],
  },
  ...extras,
]

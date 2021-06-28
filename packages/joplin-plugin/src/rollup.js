import fs from 'fs-extra'
import path from 'path'

import copy from 'rollup-plugin-copy'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'

export function configureExtraScripts(extraScripts) {
  return extraScripts.map((relative) => ({
    input: `src/${relative}`,
    output: {
      file: `dist/${relative.replace(/.ts$/, '.js')}`,
      format: 'cjs',
    },
    plugins: [nodeResolve(), commonjs(), typescript(), terser()],
  }))
}

export async function readPluginConfig() {
  const pluginConfig = { extraScripts: [] }
  try {
    Object.assign(
      pluginConfig,
      await fs.readJson(path.join(process.cwd(), 'plugin.config.json'))
    )
  } catch (cause) {
    if (cause.code !== 'ENOENT') {
      throw cause
    }
  }
  return pluginConfig
}

export const defaultConfigs = [
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'iife',
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({
        tsconfigOverride: {
          compilerOptions: {
            module: 'es2015',
          },
        },
      }),
      copy({
        targets: [
          {
            src: ['src/**/*', '!src/**/*.ts{,x}', '!src/manifest.json'],
            dest: 'dist',
          },
        ],
      }),
      terser(),
    ],
  },
]

export default defaultConfigs

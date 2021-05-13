#!/usr/bin/env node

import { rollup } from 'rollup'

import {
  defaultConfigs,
  readPluginConfig,
  configureExtraScripts,
} from './rollup.js'

function toArray(x) {
  return Array.isArray(x) ? x : [x]
}

async function build(config) {
  const bundle = await rollup(config)
  const promises = toArray(config.output).map((output) => bundle.write(output))
  await Promise.all(promises)
  await bundle.close()
}

async function main(configs) {
  const pluginConfig = await readPluginConfig()
  const extras = configureExtraScripts(pluginConfig.extraScripts)
  await Promise.all(toArray([...configs, ...extras]).map(build))
}

main(defaultConfigs)

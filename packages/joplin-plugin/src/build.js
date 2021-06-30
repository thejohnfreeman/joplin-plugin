#!/usr/bin/env node

import fs from 'fs-extra'
import { rollup } from 'rollup'
import joplinVersion from './api/version.js'

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

async function readManifest(path) {
  try {
    return await fs.readJson(path)
  } catch (error) {
    if (error.code == 'ENOENT') {
      return {}
    }
    throw error
  }
}

async function buildManifest() {
  const overrides = await readManifest('src/manifest.json')
  const meta = await fs.readJson('package.json')
  const manifest = {
    manifest_version: 1,
    app_min_version: joplinVersion,
    id: meta.name,
    name: meta.name,
    version: meta.version,
    description: meta.description,
    author: meta.author,
    keywords: meta.keywords,
    homepage_url: meta.homepage,
    repository_url: meta.repository,
    ...overrides,
  }
  await fs.writeJson('dist/manifest.json', manifest, { spaces: 2 })
}

async function main(configs) {
  const pluginConfig = await readPluginConfig()
  const extras = configureExtraScripts(pluginConfig.extraScripts)
  await Promise.all(toArray([...configs, ...extras]).map(build))
  await buildManifest()
}

main(defaultConfigs)

#!/usr/bin/env node

import fs from 'fs-extra'
import path from 'path'

import glob from 'fast-glob'
import tar from 'tar'
import crypto from 'crypto'

async function main() {
  const inDir = 'dist'
  const outDir = 'publish'

  const manifest = await fs.readJson(path.join(inDir, 'manifest.json'))
  const tarball = `${outDir}/${manifest.id}.jpl`

  const files = await glob(`**/*`, { cwd: inDir, onlyFiles: true })
  if (files.length < 1) {
    throw new Error(`directory "${inDir}" is empty`)
  }
  await fs.remove(tarball)
  await fs.mkdir(outDir, { recursive: true })
  tar.create(
    {
      strict: true,
      portable: true,
      file: tarball,
      cwd: inDir,
      sync: true,
    },
    files
  )

  const bytes = await fs.readFile(tarball)
  const digest = crypto.createHash('sha256').update(bytes).digest('hex')
  manifest._publish_hash = `sha256:${digest}`
  // content._publish_commit = currentGitInfo();
  await fs.writeJson(path.join(outDir, `${manifest.id}.json`), manifest, {
    spaces: 2,
  })
}

main()

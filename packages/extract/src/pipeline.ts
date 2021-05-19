import * as fs from 'fs-extra'
import * as os from 'os'

import { extract } from './extract'
import { exec } from './subprocess'

// The paths used in this function are not Windows-safe.
async function pipeline(
  upstreamDir: string,
  downstreamDir: string,
  ref: string,
  version: string
) {
  await exec(['git', 'fetch', 'origin', ref], { cwd: upstreamDir })
  await exec(['git', 'checkout', '--force', ref], { cwd: upstreamDir })
  const tsConfigFileName = `${upstreamDir}/packages/lib/tsconfig.json`
  const submodule = 'services/plugins/api'
  const declarationDir = `${downstreamDir}/src/api`
  const tmpDir = await fs.mkdtemp(`${os.tmpdir()}/extract-`)
  console.log('tmpDir:', tmpDir)
  try {
    await extract(tsConfigFileName, submodule, tmpDir)
    // These commands come from
    // joplin/packages/generator-joplin/updateTypes.sh.
    await fs.rm(declarationDir, { recursive: true, force: true })
    await fs.copy(tmpDir, declarationDir)
    await fs.copy(
      `${upstreamDir}/packages/generator-joplin/generators/app/templates/api_index.ts`,
      `${declarationDir}/index.ts`
    )
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true })
  }
  // Copy the version string.
  const json = await fs.readJson(`${downstreamDir}/package.json`)
  json['version'] = version
  await fs.writeJson(`${downstreamDir}/package.json`, json, { spaces: 2 })
}

async function main() {
  const upstreamDir = '../joplin'
  const downstreamDir = '../joplin-plugin'
  // The Git ref that we want to publish.
  const ref = 'v2.0.1'
  // Often the version string in joplin/packages/lib/package.json does not
  // match the Git tag. Pass them separately.
  const version = '2.0.1-0'
  await pipeline(upstreamDir, downstreamDir, ref, version)
}

main().catch(console.error)

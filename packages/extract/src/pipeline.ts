import * as fs from 'fs-extra'
import * as os from 'os'

import { extract } from './extract'
import { exec } from './subprocess'

// The paths used in this function are not Windows-safe.
async function pipeline(
  upstreamDir: string,
  upstreamVersion: string,
  upstreamRef: string,
  downstreamDir: string,
  downstreamVersion: string
) {
  await exec(['git', 'fetch', 'origin', upstreamRef], { cwd: upstreamDir })
  await exec(['git', 'checkout', '--force', upstreamRef], { cwd: upstreamDir })
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
  json['version'] = downstreamVersion
  await fs.writeJson(`${downstreamDir}/package.json`, json, { spaces: 2 })
  await fs.writeFile(
    `${downstreamDir}/src/api/version.js`,
    `const version = '${upstreamVersion}'\nexport default version\n`
  )
}

async function main() {
  const upstreamDir = '../joplin'
  const upstreamVersion = '2.0.1'
  // The Git ref that we want to publish.
  const upstreamRef = `v${upstreamVersion}`
  const downstreamDir = '../joplin-plugin'
  const downstreamVersion = `${upstreamVersion}-2`
  await pipeline(
    upstreamDir,
    upstreamVersion,
    upstreamRef,
    downstreamDir,
    downstreamVersion
  )
}

main().catch(console.error)

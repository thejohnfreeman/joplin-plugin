import * as fs from 'fs-extra'
import * as os from 'os'

import { extract } from './extract'
import { exec } from './subprocess'

// The paths used in this function are not Windows-safe.
async function pipeline(projectDir: string, ref: string, version: string) {
  await exec(['git', 'checkout', '--force', ref], { cwd: 'joplin' })
  const tsConfigFileName = 'joplin/packages/lib/tsconfig.json'
  const submodule = 'services/plugins/api'
  const declarationDir = `${projectDir}/src/api`
  const tmpDir = await fs.mkdtemp(`${os.tmpdir()}/joplin-`)
  console.log('tmpDir:', tmpDir)
  try {
    await extract(tsConfigFileName, submodule, tmpDir)
    // These commands come from
    // joplin/packages/generator-joplin/updateTypes.sh.
    await (fs.rmdir as any)(declarationDir, { recursive: true })
    await fs.copy(tmpDir, declarationDir)
    await fs.copy(
      'joplin/packages/generator-joplin/generators/app/templates/api_index.ts',
      `${declarationDir}/index.ts`
    )
  } finally {
    await (fs.rmdir as any)(tmpDir, { recursive: true })
  }
  // Copy the version string.
  const json = await fs.readJson(`${projectDir}/package.json`)
  json['version'] = version
  await fs.writeJson(`${projectDir}/package.json`, json, { spaces: 2 })
}

async function main() {
  const projectDir = 'output'
  // The Git ref that we want to publish.
  const ref = 'v1.7.3'
  // Often the version string in joplin/packages/lib/package.json does not
  // match the Git tag. Pass them separately.
  const version = '1.7.3'
  await pipeline(projectDir, ref, version)
}

main().catch(console.error)

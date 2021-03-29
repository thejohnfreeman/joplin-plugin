import * as child_process from 'child_process'
import * as fs from 'fs-extra'
import { sep as pathsep } from 'path'
import * as os from 'os'

class CalledProcessError extends Error {
  public constructor(
    message: string,
    public command: string[],
    public code: number
  ) {
    super(message)
  }
}

type AnyFunction = (...args: any[]) => any

/** Ensures a function is called only once (the first time). */
function once<F extends AnyFunction>(f: F): (...args: Parameters<F>) => void {
  let called = false
  return (...args) => {
    if (called) return
    called = true
    f(...args)
  }
}

async function exec(command: string[], options?: child_process.SpawnOptions) {
  options = { stdio: 'inherit', ...options }
  const promise = new Promise<void>((resolve, reject) => {
    const child = child_process.spawn(command[0], command.slice(1), options)
    const rejectOnce = once(reject)
    child.on('error', (error) => rejectOnce(error))
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
      }
      rejectOnce(new CalledProcessError('process failed', command, code))
    })
  })
  return promise
}

async function pipeline(dstdir: string, ref: string, version: string) {
  await exec(['git', 'checkout', '--force', ref], { cwd: 'joplin' })
  const srcdir = 'joplin/packages/lib'
  await exec(['npm', 'ci'], { cwd: srcdir })
  const tmpdir = await fs.mkdtemp(`${os.tmpdir()}${pathsep}joplin-`)
  console.log('tmpdir:', tmpdir)
  try {
    // This command comes from the generatePluginTypes script in
    // joplin/packages/lib/package.json, which is invoked by
    // joplin/packages/generator-joplin/updateTypes.sh.
    await exec(
      [
        'npx',
        'tsc',
        '--declaration',
        '--declarationDir',
        tmpdir,
        '--project',
        'tsconfig.json',
      ],
      { cwd: 'joplin/packages/lib' }
    )
    // These commands come from
    // joplin/packages/generator-joplin/updateTypes.sh.
    await fs.copy(`${tmpdir}/services/plugins/api`, `${dstdir}/src`)
    await fs.copy(
      `${srcdir}/services/plugins/api/types.ts`,
      `${dstdir}/src/types.ts`
    )
    await fs.rm(`${dstdir}/src/types.d.ts`)
    // index.ts was copied from
    // joplin/packages/generator-joplin/generators/app/templates/api_index.ts.
    // We don't expect it to ever change.
  } finally {
    await fs.rmdir(tmpdir, { recursive: true })
  }
  // Copy the version string.
  const json = await fs.readJson(`${dstdir}/package.json`)
  json['version'] = version
  await fs.writeJson(`${dstdir}/package.json`, json, { spaces: 2 })
}

async function main() {
  const ref = 'v1.7.3'
  // Often the version string in joplin/packages/lib/package.json does not
  // match the Git tag. Pass them separately.
  const version = '1.7.3'
  const dstdir = 'output'
  await pipeline(dstdir, ref, version)
}

main().catch(console.error)

// The Git ref that we want to publish.

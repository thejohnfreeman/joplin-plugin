import * as child_process from 'child_process'

export class CalledProcessError extends Error {
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

export async function exec(
  command: string[],
  options?: child_process.SpawnOptions
) {
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

import * as path from 'path'

export function isBeneath(child: string, parent: string): boolean {
  const relative = path.relative(parent, child)
  return !relative.startsWith('..') && !path.isAbsolute(relative)
}

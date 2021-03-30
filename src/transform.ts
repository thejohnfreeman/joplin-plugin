import { ArgumentParser } from 'argparse'
import { find, name, and, type } from 'node-find'
import { transform, Transformer } from './transformer'

async function main() {
  const parser = new ArgumentParser()
  parser.add_argument('paths', { nargs: '*', default: ['output/src'] })
  const args = parser.parse_args()
  const predicate = and(name('*.d.ts'), type('f'))
  for (const sourceRoot of args.paths) {
    for await (const path of find(predicate, { start: sourceRoot })) {
      // TODO: Remember paths already transformed.
      await transform(path, [Transformer.factory(path)])
    }
  }
}

main()

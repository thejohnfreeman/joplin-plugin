import * as fs from 'fs/promises'
import { parse, print } from 'recast'
import { find, name } from 'node-find'

async function main() {
  const sourceRoot = 'src'
  for await (const path of find(name('*.ts'), { start: sourceRoot })) {
    const filename = path.toString()
    const file = await fs.open(filename, 'r+')
    try {
      const source = await file.readFile({ encoding: 'utf8' })
      console.info(source)
      let ast: any
      try {
        ast = parse(source, {
          parser: require('recast/parsers/typescript'),
          sourceFileName: filename,
          sourceRoot,
        })
      } catch (error) {
        console.error(`${filename}: ${error.message}`)
        break
      }
      file.writeFile(print(ast).code)
    } finally {
      await file.close()
    }
  }
}

main()

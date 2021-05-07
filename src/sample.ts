import * as path from 'path'
import * as ts from 'typescript'

import { isBeneath } from './path'
import { readConfig } from './project'
import { ExtractTransformer } from './extract-transformer'

function relocate(before: string, after: string): ts.WriteFileCallback {
  return function writeFile(
    fileName,
    data,
    writeByteOrderMark,
    onError,
    sourceFiles
  ) {
    const suffix = path.relative(before, fileName)
    fileName = path.join(after, suffix)
    return ts.sys.writeFile(fileName, data, writeByteOrderMark)
  }
}

async function pipeline(
  tsConfigFileName: string,
  submodule: string,
  declarationDir: string
) {
  tsConfigFileName = path.resolve(tsConfigFileName)
  const submoduleDirectory = path.join(
    path.dirname(tsConfigFileName),
    submodule
  )
  // Open the project.
  const config = await readConfig(tsConfigFileName)
  config.options.emitDeclarationOnly = true
  config.options.declaration = true
  config.options.declarationDir = declarationDir
  const program = ts.createProgram(config.fileNames, config.options)
  const typeChecker = program.getTypeChecker()
  // Select the files in the submodule.
  const sourceFiles = program
    .getSourceFiles()
    .filter((sourceFile) => isBeneath(sourceFile.fileName, submoduleDirectory))
  // Emit the files of the submodule, transforming them.
  for (const sourceFile of sourceFiles) {
    console.debug(sourceFile.fileName)
    const result = program.emit(
      sourceFile,
      relocate(path.join(declarationDir, submodule), declarationDir),
      /*cancellationToken=*/ null,
      /*emitOnlyDtsFiles=*/ true,
      {
        afterDeclarations: [
          ExtractTransformer.factory(
            typeChecker,
            submoduleDirectory,
            sourceFile
          ),
        ],
      }
    )
    console.assert(!result.emitSkipped)
  }
}

async function main() {
  /* const tsConfigFileName = */
  /*   '/home/jfreeman/code/joplin-plugin-api/test/examples/tsconfig.json' */
  /* const tsConfigFileName = 'test/examples/tsconfig.json' */
  const tsConfigFileName = 'joplin/packages/lib/tsconfig.json'
  /* const submodule = 'test/examples' */
  const submodule = 'services/plugins/api'
  const declarationDir = 'decls'
  await pipeline(tsConfigFileName, submodule, declarationDir)
}

main().catch(console.error)

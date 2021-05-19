import * as fs from 'fs-extra'
import * as path from 'path'
import * as ts from 'typescript'

import { isBeneath } from './path'
import { readConfig } from './project'
import { ExtractTransformer } from './extract-transformer'

export function relocate(before: string, after: string): ts.WriteFileCallback {
  return function writeFile(fileName, data, writeByteOrderMark) {
    const suffix = path.relative(before, fileName).replace(/.d.ts$/, '.ts')
    fileName = path.join(after, suffix)
    return ts.sys.writeFile(fileName, data, writeByteOrderMark)
  }
}

export async function extract(
  tsConfigFileName: string,
  submodule: string,
  outDir: string
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
  config.options.declarationDir = outDir
  const program = ts.createProgram(config.fileNames, config.options)
  const typeChecker = program.getTypeChecker()
  // Select the files in the submodule.
  const sourceFiles = program
    .getSourceFiles()
    .filter((sourceFile) => isBeneath(sourceFile.fileName, submoduleDirectory))
  // Emit the files of the submodule, transforming them.
  // TypeScript already analyzes which imports are used when it emits
  // declarations. In the absence of a lower-level API for that analysis, we
  // just emit the declarations, and remove the `declare` modifier.
  function emit(sourceFile) {
    const result = program.emit(
      sourceFile,
      relocate(path.join(outDir, submodule), outDir),
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
    return result.emitSkipped
  }
  const skipped = sourceFiles.filter(emit).map((sf) => sf.fileName)
  if (skipped.length > 0) {
    throw `failed to emit: ${skipped}`
  }
}
import * as fs from 'fs-extra'
import * as path from 'path'
import * as ts from 'typescript'

export async function readConfig(
  fileName: string
): Promise<ts.ParsedCommandLine> {
  let basePath = path.dirname(fileName)
  let jsonText = await fs.readFile(fileName, 'utf8')
  let { config: json, error } = ts.parseConfigFileTextToJson(fileName, jsonText)
  if (!json) {
    throw [error]
  }
  let config = ts.parseJsonConfigFileContent(json, ts.sys, basePath)
  if (config.errors.length > 0) {
    throw config.errors
  }
  return config
}

type PathLike = string

export async function openProject(
  tsConfigFile: PathLike = 'tsconfig.json'
): Promise<ts.Program> {
  const config = await readConfig(tsConfigFile)
  const program = ts.createProgram(config.fileNames, config.options)
  return program
}

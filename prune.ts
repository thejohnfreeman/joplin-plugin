import * as fs from 'fs/promises'
import { statSync } from 'fs'
import { resolve } from 'path'
import { find, name, Path } from 'node-find'
import * as ts from 'typescript'

// TODO: Create a CompilerHost and use it for module resolution.
class ModuleResolver {
  public constructor(private path: Path, private knownModules: string[] = []) {}

  public moduleExists(spec) {
    if (['.', '/'].indexOf(spec[0]) < 0) {
      // It's not a fileysystem path import.
      return this.knownModules.indexOf(spec) >= 0
    }
    const directory = this.path.parent.toString()
    for (const extension of ['', '.d.ts', '.ts', '.js']) {
      const pathModule = resolve(directory, spec + extension)
      try {
        const stat = statSync(pathModule)
        if (stat.isFile()) {
          return true
        }
      } catch (_) {}
    }
    return false
  }
}

class Transformer {
  public constructor(
    private moduleResolver: ModuleResolver,
    private context: ts.TransformationContext
  ) {}

  private visit = (node: ts.Node) => this.visitNode(node)

  public visitImportDeclaration(decl: ts.ImportDeclaration) {
    const spec = decl.moduleSpecifier as any
    return this.moduleResolver.moduleExists(spec.text) ? decl : null
  }

  public visitNode(node: ts.Node) {
    if (node.kind === ts.SyntaxKind.ImportDeclaration) {
      return this.visitImportDeclaration(node as ts.ImportDeclaration)
    }
    return ts.visitEachChild(node, this.visit, this.context)
  }

  public static factory(path: Path): ts.TransformerFactory<ts.Node> {
    return (context: ts.TransformationContext) => {
      const moduleResolver = new ModuleResolver(path)
      const transformer = new Transformer(moduleResolver, context)
      return (node: ts.Node) => transformer.visitNode(node)
    }
  }
}

async function main() {
  const sourceRoot = 'src'
  for await (const path of find(name('*.ts'), { start: sourceRoot })) {
    const filename = path.toString()
    const file = await fs.open(filename, 'r+')
    const source = await file.readFile('utf8')
    await file.close()
    const sourceFile = ts.createSourceFile(
      filename,
      source,
      ts.ScriptTarget.ES2016
    )
    const result = ts.transform(sourceFile, [
      Transformer.factory(new Path(filename.split('/'))),
    ])
    const printer = ts.createPrinter()
    const text = printer.printFile(result.transformed[0] as ts.SourceFile)
    await fs.writeFile(filename, text, 'utf8')
  }
}

main()

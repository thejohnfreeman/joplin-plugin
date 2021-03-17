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

function getImportedNames(clause: ts.ImportClause): string[] {
  if (clause.name) {
    return [clause.name.text]
  }
  if (!clause.namedBindings) {
    throw new Error(`unknown variant of import clause: ${clause}`)
  }
  const bindings = clause.namedBindings
  if (bindings.kind == ts.SyntaxKind.NamespaceImport) {
    return [(bindings as ts.NamespaceImport).name.text]
  }
  if (bindings.kind != ts.SyntaxKind.NamedImports) {
    throw new Error(`unknown variant of named bindings: ${bindings}`)
  }
  return bindings.elements.map((spec) => spec.name.text)
}

// If you want to see which nodes are parsed from a program,
// visit https://ts-ast-viewer.com/

class Transformer {
  public constructor(
    private context: ts.TransformationContext,
    private moduleResolver: ModuleResolver,
    private externals: string[] = []
  ) {}

  private visit = (node: ts.Node) => this.visitNode(node)

  public visitImportDeclaration(decl: ts.ImportDeclaration) {
    // Remove import if the module cannot be found.
    const spec = decl.moduleSpecifier as any
    if (this.moduleResolver.moduleExists(spec.text)) {
      return decl
    }
    if (decl.importClause) {
      // Imports can be for side-effects only.
      this.externals.push(...getImportedNames(decl.importClause))
    }
    return null
  }

  public visitPropertyDeclaration(decl: ts.PropertyDeclaration) {
    // Remove private declarations.
    if (
      decl.modifiers?.some(
        (modifier) => modifier.kind == ts.SyntaxKind.PrivateKeyword
      )
    ) {
      return null
    }
    return decl
  }

  /**
   * This implementation is not yet complete, but is good enough for now.
   * @return true if the given type references any external names
   */
  private isExternalType(type: ts.TypeNode) {
    if (!ts.isTypeReferenceNode(type)) {
      return false
    }
    const ref = type as ts.TypeReferenceNode
    let name = ref.typeName
    while (name.kind == ts.SyntaxKind.QualifiedName) {
      name = name.left
    }
    return this.externals.includes(name.text)
  }

  public visitMethodDeclaration(
    method: ts.ConstructorDeclaration | ts.MethodDeclaration
  ) {
    // Remove constructors and methods that reference external names.
    for (const param of method.parameters) {
      if (this.isExternalType(param.type)) {
        return null
      }
    }
    return method
  }

  public visitNode(node: ts.Node) {
    if (node.kind === ts.SyntaxKind.ImportDeclaration) {
      return this.visitImportDeclaration(node as ts.ImportDeclaration)
    }
    if (node.kind == ts.SyntaxKind.PropertyDeclaration) {
      return this.visitPropertyDeclaration(node as ts.PropertyDeclaration)
    }
    if (node.kind == ts.SyntaxKind.Constructor) {
      return this.visitMethodDeclaration(node as ts.ConstructorDeclaration)
    }
    if (node.kind == ts.SyntaxKind.MethodDeclaration) {
      return this.visitMethodDeclaration(node as ts.MethodDeclaration)
    }
    return ts.visitEachChild(node, this.visit, this.context)
  }

  public static factory(path: Path): ts.TransformerFactory<ts.Node> {
    return (context: ts.TransformationContext) => {
      const moduleResolver = new ModuleResolver(path)
      const transformer = new Transformer(context, moduleResolver)
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

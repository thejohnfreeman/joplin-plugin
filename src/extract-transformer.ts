import * as path from 'path'
import * as ts from 'typescript'

import { isBeneath } from './path'

class ModuleResolver {
  public constructor(
    // It's ok if these are both relative as long as they are relative to the
    // same path, but more likely `submodulePath` is relative to the module
    // root and `sourceFilePath` is relative to the current directory. Thus,
    // in practice they tend to be absolute paths.
    private submoduleDirectory: string,
    private sourceFileDirectory: string
  ) {}

  public moduleExists(spec: string) {
    if (['.', '/'].indexOf(spec[0]) < 0) {
      // It's not a fileysystem path import.
      // TODO: Handle baseUrl
      return true
    }
    const importPathPrefix = path.join(this.sourceFileDirectory, spec)
    return isBeneath(importPathPrefix, this.submoduleDirectory)
  }
}

function unalias(typeChecker: ts.TypeChecker, id: ts.Identifier): ts.Symbol {
  let symbol = typeChecker.getSymbolAtLocation(id)
  while (symbol.flags === ts.SymbolFlags.Alias) {
    symbol = typeChecker.getAliasedSymbol(symbol)
  }
  return symbol
}

function getImportedIdentifiers(
  importClause: ts.ImportClause
): ts.Identifier[] {
  const bindings = importClause.namedBindings
  if (!bindings) {
    return [importClause.name]
  }
  if (bindings.kind === ts.SyntaxKind.NamedImports) {
    return bindings.elements.map((element) => element.name)
  }
  console.assert(bindings.kind === ts.SyntaxKind.NamespaceImport)
  return [bindings.name]
}

function getImportedSymbols(
  typeChecker: ts.TypeChecker,
  importClause: ts.ImportClause
): [ts.Identifier, ts.Symbol][] {
  return getImportedIdentifiers(importClause).map((id) => [
    id,
    unalias(typeChecker, id),
  ])
}

/**
 * A transformer that extracts a submodule from a larger module.
 *
 * It identifies any "foreign" imports that are external to the submodule
 * and replaces them with stubs.
 */
export class ExtractTransformer {
  public constructor(
    private context: ts.TransformationContext,
    private typeChecker: ts.TypeChecker,
    private moduleResolver: ModuleResolver
  ) {}

  private visit = (node: ts.Node) => this.visitNode(node)

  private visitImportDeclaration(decl: ts.ImportDeclaration) {
    // Substitute symbols from dangling foreign imports.
    const spec = decl.moduleSpecifier as ts.StringLiteral
    if (this.moduleResolver.moduleExists(spec.text)) {
      return decl
    }
    const symbols = getImportedSymbols(this.typeChecker, decl.importClause)
    return symbols.map(([id, symbol]) => this.substituteSymbol(id, symbol))
  }

  private substituteSymbol(id: ts.Identifier, symbol: ts.Symbol): ts.Statement {
    switch (symbol.flags) {
      case ts.SymbolFlags.Class:
      case ts.SymbolFlags.Interface:
        const decorators = []
        const modifiers = []
        const typeParameters = []
        const type = this.context.factory.createKeywordTypeNode(
          ts.SyntaxKind.AnyKeyword
        )
        return this.context.factory.createTypeAliasDeclaration(
          decorators,
          modifiers,
          id,
          typeParameters,
          type
        )
      default:
        throw `unhandled symbol type for ${id.text}: ${
          ts.SymbolFlags[symbol.flags]
        }`
    }
  }

  private visitPropertyDeclaration(decl: ts.PropertyDeclaration) {
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

  private visitEnumDeclaration(node: ts.EnumDeclaration) {
    node = ts.visitEachChild(node, this.visit, this.context)
    const modifiers = node.modifiers?.filter(
      (modifier) => modifier.kind != ts.SyntaxKind.DeclareKeyword
    )
    return this.context.factory.createEnumDeclaration(
      node.decorators,
      modifiers,
      node.name,
      node.members
    )
  }

  /* @CALL_STACK.log((node: ts.Node) => ts.SyntaxKind[node.kind]) */
  private visitNode(node: ts.Node) {
    switch (node.kind) {
      case ts.SyntaxKind.ImportDeclaration:
        return this.visitImportDeclaration(node as ts.ImportDeclaration)
      case ts.SyntaxKind.EnumDeclaration:
        return this.visitEnumDeclaration(node as ts.EnumDeclaration)
      /* case ts.SyntaxKind.PropertyDeclaration: */
      /*   return this.visitPropertyDeclaration(node as ts.PropertyDeclaration) */
    }
    return ts.visitEachChild(node, this.visit, this.context)
  }

  /**
   * @param submoduleDirectory Absolute path to submodule.
   * @param sourceFile Source file within submodule.
   */
  public static factory<T extends ts.Node>(
    typeChecker: ts.TypeChecker,
    submoduleDirectory: string,
    sourceFile: ts.SourceFile
  ): ts.TransformerFactory<T> {
    console.assert(path.isAbsolute(submoduleDirectory))
    const sourceFileDirectory = path.dirname(path.resolve(sourceFile.fileName))
    console.assert(isBeneath(sourceFileDirectory, submoduleDirectory))
    return (context: ts.TransformationContext) => {
      const moduleResolver = new ModuleResolver(
        submoduleDirectory,
        sourceFileDirectory
      )
      const transformer = new ExtractTransformer(
        context,
        typeChecker,
        moduleResolver
      )
      return transformer.visit
    }
  }
}
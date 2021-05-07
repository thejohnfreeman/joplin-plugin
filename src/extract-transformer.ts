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
    // Remove import if the module cannot be found.
    const spec = decl.moduleSpecifier as ts.StringLiteral
    if (this.moduleResolver.moduleExists(spec.text)) {
      return decl
    }
    console.log(`removed import: ${spec.text}`)
    // TODO: Stub depending on imported aliases.
    // import { Name } from 'module'
    /* node = importDecl.importClause.namedBindings.elements[0].name */
    // import Name from 'module'
    /* node = importDecl.importClause.name */
    /* alias = this.typeChecker.getSymbolAtLocation(node) */
    /* console.assert(symbol.flags == ts.SymbolFlags.Alias) */
    /* symbol = this.typeChecker.getAliasedSymbol(alias) */
    /* ts.SymbolFlags[symbol.flags] */
    return null
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

  /* @CALL_STACK.log((node: ts.Node) => ts.SyntaxKind[node.kind]) */
  public visitNode(node: ts.Node) {
    switch (node.kind) {
      case ts.SyntaxKind.ImportDeclaration:
        return this.visitImportDeclaration(node as ts.ImportDeclaration)
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

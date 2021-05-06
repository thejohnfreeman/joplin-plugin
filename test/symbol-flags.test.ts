import { openProject } from '../src/project'
import * as ts from 'typescript'

function expectIdToAlias(
  typeChecker: ts.TypeChecker,
  id: ts.Identifier,
  flag: ts.SymbolFlags
) {
  const alias = typeChecker.getSymbolAtLocation(id)
  expect(alias.flags).toBe(ts.SymbolFlags.Alias)
  const symbol = typeChecker.getAliasedSymbol(alias)
  expect(symbol.flags).toBe(flag)
}

test('examples', async () => {
  const program = await openProject('test/examples/tsconfig.json')
  expect(program).toBeTruthy()
  const typeChecker = program.getTypeChecker()
  const sourceFile = program.getSourceFile('test/examples/imports.ts')
  expect(program.getSourceFiles().length).toBe(2)

  // import MyNamespace from './exports'
  let importDecl = sourceFile.statements[0] as ts.ImportDeclaration
  let importClause = importDecl.importClause
  expect(importClause.namedBindings).toBeUndefined()
  let id = importClause.name
  expectIdToAlias(typeChecker, id, ts.SymbolFlags.NamespaceModule)

  // import { MyEnum, MyClass, MY_CONSTANT, MyNamespace as ns } from './exports'
  importDecl = sourceFile.statements[1] as ts.ImportDeclaration
  importClause = importDecl.importClause
  expect(importClause.name).toBeUndefined()

  const bindings = importClause.namedBindings as ts.NamedImports
  expect(bindings.kind).toBe(ts.SyntaxKind.NamedImports)
  const ids = bindings.elements.map((element) => element.name)

  expectIdToAlias(typeChecker, ids[0], ts.SymbolFlags.RegularEnum)
  expectIdToAlias(typeChecker, ids[1], ts.SymbolFlags.Class)
  expectIdToAlias(typeChecker, ids[2], ts.SymbolFlags.BlockScopedVariable)
  expectIdToAlias(typeChecker, ids[3], ts.SymbolFlags.NamespaceModule)

  // import * as Exports from './exports'
  importDecl = sourceFile.statements[2] as ts.ImportDeclaration
  importClause = importDecl.importClause
  expect(importClause.name).toBeUndefined()
  const binding = importClause.namedBindings as ts.NamespaceImport
  expect(binding.kind).toBe(ts.SyntaxKind.NamespaceImport)
  id = binding.name
  expectIdToAlias(typeChecker, id, ts.SymbolFlags.ValueModule)
})

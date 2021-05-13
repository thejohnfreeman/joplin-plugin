// Helpers for the TypeScript API
import * as path from 'path'
import * as ts from 'typescript'

export function transform(
  sourceFile: ts.SourceFile,
  factory: ts.TransformerFactory<ts.SourceFile>
): ts.SourceFile {
  try {
    return ts.transform(sourceFile, [factory]).transformed[0]
  } catch (cause) {
    throw `failed to transform ${sourceFile.fileName}: ${cause}`
  }
}

enum QuoteStyle {
  SingleAlways,
  DoubleAlways,
}

function setQuoteStyle(style: QuoteStyle) {
  const singleQuote = style == QuoteStyle.SingleAlways
  return (_hint: ts.EmitHint, node: any) => {
    if (node.kind == ts.SyntaxKind.StringLiteral) {
      node.singleQuote = singleQuote
    }
    return node
  }
}

export function print(sourceFile: ts.SourceFile): string {
  const printer = ts.createPrinter(
    {},
    { substituteNode: setQuoteStyle(QuoteStyle.SingleAlways) }
  )
  return printer.printFile(sourceFile)
}

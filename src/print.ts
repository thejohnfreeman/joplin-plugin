import * as ts from 'typescript'

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

/**
 * Converts plain text math expressions to LaTeX format
 * Examples:
 *   3/4 → \frac{3}{4}
 *   2^2 → 2^{2}
 *   sqrt(16) → \sqrt{16}
 *   3/4*2^2 → \frac{3}{4} \times 2^{2}
 */
export function convertMathToLatex(expression: string): string {
  let latex = expression.trim();

  // Replace sqrt(...) with \sqrt{...}
  latex = latex.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');

  // Replace * with \times
  latex = latex.replace(/\*/g, ' \\times ');

  // Handle fractions - need to detect patterns like a/b, (expr)/(expr), etc.
  // Match fractions with parentheses: (expr)/(expr)
  latex = latex.replace(/\(([^)]+)\)\/\(([^)]+)\)/g, '\\frac{$1}{$2}');

  // Match fractions with left parenthesis: (expr)/number or (expr)/variable
  latex = latex.replace(/\(([^)]+)\)\/([^\s\)]+)/g, '\\frac{$1}{$2}');

  // Match fractions with right parenthesis: number/(expr) or variable/(expr)
  latex = latex.replace(/([^\s\(]+)\/\(([^)]+)\)/g, '\\frac{$1}{$2}');

  // Match simple fractions: number/number or variable/variable
  // This regex looks for word boundaries to avoid replacing in already-processed fracs
  latex = latex.replace(/(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/g, '\\frac{$1}{$2}');

  // Handle powers - wrap exponent in braces for proper LaTeX
  // Match pattern like 2^2 or x^10
  latex = latex.replace(/(\w+)\^(\w+)/g, '$1^{$2}');

  // Handle powers with parentheses in exponent: x^(2+1)
  latex = latex.replace(/(\w+)\^\(([^)]+)\)/g, '$1^{$2}');

  return latex;
}

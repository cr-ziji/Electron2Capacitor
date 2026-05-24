export interface ASTNode {
  type: string;
  value?: string;
  children?: ASTNode[];
  [key: string]: any;
}

export function parseJS(source: string): ASTNode {
  return {
    type: 'Program',
    value: source,
    children: [],
  };
}

export function parseTS(source: string): ASTNode {
  return {
    type: 'TSProgram',
    value: source,
    children: [],
  };
}

export function transformAST(ast: ASTNode, replacements: Array<{ pattern: RegExp; replacement: string }>): ASTNode {
  const transformed = { ...ast };
  if (transformed.value && typeof transformed.value === 'string') {
    let newStr = transformed.value;
    for (const { pattern, replacement } of replacements) {
      newStr = newStr.replace(pattern, replacement);
    }
    transformed.value = newStr;
  }
  if (transformed.children) {
    transformed.children = transformed.children.map(child => transformAST(child, replacements));
  }
  return transformed;
}

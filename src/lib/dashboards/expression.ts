/**
 * A four-operator arithmetic evaluator for prospect dashboard models.
 *
 * Each company's model is written in its config file as a plain formula over
 * named inputs, for example `spend * scrap * net + spend * scrap * late * (mult - 1)`.
 * Keeping the formula as data is what lets the thirteenth dashboard be a
 * content file rather than a component: the page code never knows what a
 * given company's model computes.
 *
 * It is a hand-written parser rather than `new Function`, for two reasons.
 * The production CSP carries no `'unsafe-eval'`, so `new Function` would
 * throw in the browser; and a formula that can only express numbers,
 * names, `+ - * /` and parentheses cannot do anything else by construction.
 */

type Node =
  | { kind: "num"; value: number }
  | { kind: "var"; name: string }
  | { kind: "neg"; operand: Node }
  | { kind: "bin"; op: "+" | "-" | "*" | "/"; left: Node; right: Node };

type Token =
  | { type: "num"; value: number }
  | { type: "id"; name: string }
  | { type: "op"; op: "+" | "-" | "*" | "/" | "(" | ")" };

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const ch = source.charAt(i);
    if (/\s/.test(ch)) {
      i += 1;
    } else if (/[0-9.]/.test(ch)) {
      const match = /^[0-9]*\.?[0-9]+(?:e[+-]?[0-9]+)?/i.exec(source.slice(i));
      if (!match) throw new Error(`Malformed number at ${i} in "${source}"`);
      tokens.push({ type: "num", value: Number(match[0]) });
      i += match[0].length;
    } else if (/[A-Za-z_]/.test(ch)) {
      const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(source.slice(i));
      tokens.push({ type: "id", name: match![0] });
      i += match![0].length;
    } else if ("+-*/()".includes(ch)) {
      tokens.push({ type: "op", op: ch as "+" });
      i += 1;
    } else {
      throw new Error(`Unexpected "${ch}" at ${i} in "${source}"`);
    }
  }
  return tokens;
}

/** Recursive descent: expr = term (('+'|'-') term)*, term = unary (('*'|'/') unary)*. */
export function parse(source: string): Node {
  const tokens = tokenize(source);
  let pos = 0;

  const peek = () => tokens[pos];
  const isOp = (op: string) => {
    const t = peek();
    return t?.type === "op" && t.op === op;
  };

  function primary(): Node {
    const t = tokens[pos++];
    if (!t) throw new Error(`Formula ends early: "${source}"`);
    if (t.type === "num") return { kind: "num", value: t.value };
    if (t.type === "id") return { kind: "var", name: t.name };
    if (t.op === "(") {
      const inner = expr();
      if (!isOp(")")) throw new Error(`Missing ")" in "${source}"`);
      pos += 1;
      return inner;
    }
    throw new Error(`Unexpected "${t.op}" in "${source}"`);
  }

  function unary(): Node {
    if (isOp("-")) {
      pos += 1;
      return { kind: "neg", operand: unary() };
    }
    return primary();
  }

  function term(): Node {
    let node = unary();
    while (isOp("*") || isOp("/")) {
      const op = (tokens[pos++] as { op: "*" | "/" }).op;
      node = { kind: "bin", op, left: node, right: unary() };
    }
    return node;
  }

  function expr(): Node {
    let node = term();
    while (isOp("+") || isOp("-")) {
      const op = (tokens[pos++] as { op: "+" | "-" }).op;
      node = { kind: "bin", op, left: node, right: term() };
    }
    return node;
  }

  const tree = expr();
  if (pos !== tokens.length) throw new Error(`Trailing input in "${source}"`);
  return tree;
}

/** Every name the formula reads, so a config can be checked before it ships. */
export function variablesOf(
  node: Node,
  found = new Set<string>(),
): Set<string> {
  if (node.kind === "var") found.add(node.name);
  if (node.kind === "neg") variablesOf(node.operand, found);
  if (node.kind === "bin") {
    variablesOf(node.left, found);
    variablesOf(node.right, found);
  }
  return found;
}

export function evaluate(node: Node, vars: Record<string, number>): number {
  switch (node.kind) {
    case "num":
      return node.value;
    case "var": {
      const value = vars[node.name];
      if (value === undefined) throw new Error(`Unknown input "${node.name}"`);
      return value;
    }
    case "neg":
      return -evaluate(node.operand, vars);
    case "bin": {
      const a = evaluate(node.left, vars);
      const b = evaluate(node.right, vars);
      if (node.op === "+") return a + b;
      if (node.op === "-") return a - b;
      if (node.op === "*") return a * b;
      return a / b;
    }
  }
}

export type { Node as ExpressionNode };

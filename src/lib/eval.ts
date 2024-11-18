import { NodeType, Node, Operations, parse } from "./parser.ts";

type Value = string | number;
type LookupTable = Record<string, number>;

const isOperator = (char: any) =>
    typeof char === "string" && Operations[char] !== undefined;

// Convert the parse tree into a list of
// values in reverse polish notation. We do this
// so that we don't have the overhead of recursion
// when we're evaluating the expression
function flatten(node: Node, table: LookupTable): Value[] {
    let values: Value[] = [];

    // Map each variable to a value in the lookup table
    if (node.type == NodeType.Variable)
        table[node.data] = 0;

    if (node.type == NodeType.Constant ||
        node.type == NodeType.Variable) {
        values.push(node.data);
        return values;
    }

    // Push the operands
    if (node.left !== undefined)
        values.push(...flatten(node.left!, table));
    if (node.right !== undefined)
        values.push(...flatten(node.right!, table));

    values.push(node.data); // Push the operator
    return values;
}

export function processExpression(
    expression: string
): [Value[], LookupTable] | undefined {
    const tree = parse(expression, true);
    if (tree === undefined) return undefined;

    let table: LookupTable = {};
    const values = flatten(tree, table);
    return [values, table];
}

// Evaluate the expression in a single pass
export function evaluateExpression(
    values: Value[],
    table: LookupTable
): number {
    // Return the answer if it's already been evaluated
    if (values.length == 1) return values[0] as number;

    const lookup = (v: string): number => {
        if (table[v] === undefined)
            throw Error(`Unknown variable ${v}`);
        return table[v];
    };

    let stack = [];
    for (const value of values) {
        // Push operand on the stack
        if (!isOperator(value)) {
            stack.push(value);
            continue;
        }

        let rawRight = stack.pop()!;
        let rawLeft = stack.pop();
        if (rawLeft === undefined)
            rawLeft = 0; // Since it must be an unary operator

        const a = typeof rawLeft === "string" ? lookup(rawLeft) : rawLeft;
        const b = typeof rawRight === "string" ? lookup(rawRight) : rawRight;
        const newOperand = Operations[value](a, b);
        stack.push(newOperand);
    }
    return stack[0] as number;
}


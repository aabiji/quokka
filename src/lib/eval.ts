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

export class EmptyExpression extends Error {
    constructor() {
        super();
        this.message = "Empty expression. Nothing to evaluate";
    }
}

export class Expression {
    values: Value[] = [];
    variables: LookupTable = {};

    constructor(expression: string) {
        const tree = parse(expression, true);
        if (tree === undefined) throw new EmptyExpression();
        this.values = flatten(tree, this.variables);
        console.log(this.values);
    }

    private lookup(v: string): number {
        if (this.variables[v] === undefined)
            throw Error(`Unknown variable ${v}`);
        return this.variables[v];
    }

    // Evaluate the expression in a single pass
    evaluate(): number {
        // Return the answer if it's already been evaluated
        if (this.values.length == 1) {
            const v = this.values[0];
            return typeof v === "string" ? this.lookup(v) : v as number;
        }

        let stack = [];
        for (const value of this.values) {
            // Push operand on the stack
            if (!isOperator(value)) {
                stack.push(value);
                continue;
            }

            let right = stack.pop()!;
            let left = stack.pop();
            if (left === undefined)
                left = 0; // Since it must be an unary operator

            const a = typeof left === "string" ? this.lookup(left) : left;
            const b = typeof right === "string" ? this.lookup(right) : right;
            const newOperand = Operations[value](a, b);
            stack.push(newOperand);
        }
        return stack[0] as number;
    }
}

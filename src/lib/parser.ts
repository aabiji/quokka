import { TokenStream, TokenType, Token, operatorInfo } from "./lexer.ts";

interface ParseContext {
    stream: TokenStream,
    insideParentheses: boolean,
}

type ParseOutput = Node | undefined;

export enum NodeType {
    BinaryOperator,
    UnaryOperator,
    Variable,
    Constant
}

export interface Node {
    type: NodeType,
    data?: any,
    left?: Node,
    right?: Node,
}

const operations = {
    '-': (x: number, y: number) => x - y,
    '+': (x: number, y: number) => x + y,
    '*': (x: number, y: number) => x * y,
    '/': (x: number, y: number) => x / y,
    '^': (x: number, y: number) => x ** y,
}

function checkForErrors(context: ParseContext, previous: Token) {
    const next = context.stream.read(false);
    if (next === undefined) return;

    // Cannot not have a sequence of numbers without an operator
    if (previous.type == TokenType.Number && next.type == TokenType.Number)
        throw Error(`Invalid sequence: ${previous.raw} ${next.raw}`);

    // Cannot have a number come after a variable
    if (previous.type == TokenType.Identifier &&
        next.type == TokenType.Number)
        throw Error(`Invalid sequence: ${previous.raw} ${next.raw}`);

    // Each closing parentheses needs a corresponding opening parentheses
    if (!context.insideParentheses && next.type == TokenType.ClosedParen)
        throw Error("Unexpected )");
}

function handleImplicitMultiplication(context: ParseContext, token: Token) {
    const next = context.stream.read(false);
    if (next === undefined) return;

    // We can define an implicit multiplication if our term is a number
    // or a variale and if our coefficient is a variable or set of
    // parentheses. If our term is a set of parentheses, we can have
    // whatever type of coefficient and it would still be a multiplication,
    // Every other possibility is an error
    const [t, n] = [token.type, next.type];
    const validTerm = t == TokenType.Number || t == TokenType.Identifier;
    const validCoefficient =
        n == TokenType.Identifier || n == TokenType.OpenParen;
    const isGrouping = t == TokenType.OpenParen;

    if ((validTerm && validCoefficient) ||
        (isGrouping && (validCoefficient || n == TokenType.Number))) {
        // We insert a multiplication token immediately after our
        // current position so that this token and subsequent tokens
        // are parsed as a multiplication. This way we can handle
        // multiplication even where there's no explicit operator
        context.stream.insert({ type: TokenType.Operator, raw: "*" });
    }
}

function parseOperand(context: ParseContext): ParseOutput {
    const token = context.stream.read();
    if (token === undefined)
        return undefined;

    const isUnary = token.type == TokenType.Operator &&
        (token.raw == '-' || token.raw == '+');
    let node: ParseOutput = { data: 0, type: NodeType.Constant };

    if (token.type == TokenType.Number) {
        node.data = Number(token.raw);
        node.type = NodeType.Constant;
    }

    else if (token.type == TokenType.Identifier) {
        node.data = token.raw;
        node.type = NodeType.Variable;
    }

    else if (token.type == TokenType.OpenParen) {
        // Parse a new expression
        context.insideParentheses = true;
        node = prattParse(context, 0);
        context.insideParentheses = false;

        // Parse the closing parentheses
        const next = context.stream.read();
        const ending = next === undefined ? "" : `, found ${next.raw}`;
        if (next === undefined || next.type != TokenType.ClosedParen)
            throw Error(`Expecting a closing parentheses${ending}`);
    }
    else if (isUnary) {
        node.data = token.raw;
        node.type = NodeType.UnaryOperator;
        node.left = parseOperand(context);
        if (node.left === undefined)
            throw Error("Expecting operand found nothing");
    }

    else
        throw Error(
            `Expected a number, variable or grouping, found ${token.raw}`
        );

    checkForErrors(context, token);
    handleImplicitMultiplication(context, token);
    return node;
}

function prattParse(context: ParseContext, currentPrecedence: number): ParseOutput {
    // Parse the left hand side
    let currentNode = parseOperand(context);
    if (currentNode == undefined) return undefined;

    // Build the parse tree by accumulating nodes on the right hand side.
    // We're treating the expression as a successive list of binary operators.
    while (true) {
        const token = context.stream.read(false);
        if (token === undefined) break;
        const [precedence, groupLeft] = operatorInfo(token);
        if (token.type != TokenType.Operator ||
            precedence <= currentPrecedence)
            break;

        // Adjust the precedence based on the operator associativity
        const nextPrecedence = groupLeft ? precedence : precedence - 1;
        context.stream.read();
        currentNode = {
            data: token.raw,
            type: NodeType.BinaryOperator,
            left: currentNode,
            right: prattParse(context, nextPrecedence)
        };
    }

    if (currentNode.type == NodeType.BinaryOperator &&
        currentNode.right === undefined)
        throw Error("No right operand found");

    return currentNode;
}

// Simplify repeating binary operators that have identical operands
// or are partially reducible. Ex: x + x + x + x should be reduced to 4 * x
function reduceRepeating(
    left: Node, right: Node,
    targetOperator: string
): ParseOutput {
    const equal = (a: Node, b: Node) =>
        JSON.stringify(a) === JSON.stringify(b);

    // Simplify identical operands (ex: x + x => 2 * x)
    if (equal(left, right)) {
        return {
            type: NodeType.BinaryOperator,
            data: targetOperator, right,
            left: { type: NodeType.Constant, data: 2 },
        }
    }

    // The left hand side needs to be an expression
    if (left.type == NodeType.Constant || left.type == NodeType.Variable)
        return undefined;

    // Combine factors with identical terms (ex: 2x + x => 3x)
    const operand = left.right!;
    const coefficient = left.left!.data;
    if (left.data == targetOperator && equal(operand, right)) {
        return {
            type: NodeType.BinaryOperator,
            data: targetOperator, right,
            left: { type: NodeType.Constant, data: coefficient + 1 }
        };
    }

    return undefined; // Can't reduce
}

// Walk through the tree and evaluate nodes we can already
// evaluate. Also try to simplify expressions we can't
// directly evaluate. We do this to avoid having a deeply
// nested parse tree and to make it easier to evaluate it.
function reduce(root: Node): Node {
    if (root.type == NodeType.Constant || root.type == NodeType.Variable)
        return root;

    const key = root.data as keyof typeof operations;

    if (root.type == NodeType.UnaryOperator) {
        const left = reduce(root.left!);

        // Apply the unary operator if we can
        if (left.type == NodeType.Constant) {
            const data = operations[key](0, left.data);
            return { type: NodeType.Constant, data };
        }

        // Return the simplified node as is
        return { type: NodeType.UnaryOperator, data: root.data, left };
    }

    if (root.type == NodeType.BinaryOperator) {
        const left = reduce(root.left!);
        const right = reduce(root.right!);

        // Apply the binary operator directly if we can
        if (left.type == NodeType.Constant &&
            right.type == NodeType.Constant) {
            const data = operations[key](left.data, right.data);
            return { type: NodeType.Constant, data };
        }

        // Repeating addition reduces to multiplication
        if (root.data == '+') {
            const node = reduceRepeating(left, right, '*');
            if (node != undefined) return node;
        }

        // Repeating multiplication reduces to exponentiation
        if (root.data == '*') {
            const node = reduceRepeating(left, right, '^');
            if (node != undefined) return node;
        }

        // Return the simplified node as is
        return {
            type: NodeType.BinaryOperator,
            data: root.data, left, right
        };
    }

    throw Error(`Invalid node: ${root}`);
}

export function parse(expression: string, canReduce: boolean): ParseOutput {
    const context = {
        stream: new TokenStream(expression),
        insideParentheses: false
    };
    const tree = prattParse(context, 0);
    return canReduce && tree !== undefined ? reduce(tree) : tree;
}


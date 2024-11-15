import { TokenReader, TokenType, Token, operatorInfo } from "./lexer.ts";

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

type ParseOutput = Node | undefined;

let insideParentheses = false; // TODO: this shouldn't be global

const operations = {
    '-': (x, y) => x - y,
    '+': (x, y) => x + y,
    '*': (x, y) => x * y,
    '/': (x, y) => x / y,
    '^': (x, y) => x ** y,
}

function checkForErrors(reader: TokenReader, previous: Token) {
    const next = reader.read(false);
    if (next === undefined) return;

    // Cannot not have a sequence of numbers without an operator
    if (previous.type == TokenType.Number && next.type == TokenType.Number)
        throw Error(`Invalid sequence: ${previous.raw} ${next.raw}`);

    // Cannot have a number come after a variable
    if (previous.type == TokenType.Identifier && next.type == TokenType.Number)
        throw Error(`Invalid sequence: ${previous.raw} ${next.raw}`);

    // Each closing parentheses needs a corresponding opening parentheses
    if (!insideParentheses && next.type == TokenType.ClosedParen)
        throw Error("Unexpected )");
}

function handleImplicitMultiplication(reader: TokenReader, token: Token) {
    const next = reader.read(false);
    if (next === undefined) return;

    // We can define an implicit multiplication if our term is a number
    // or a variale and if our coefficient is a variable or set of
    // parentheses. If our term is a set of parentheses, we can have
    // whatever type of coefficient and it would still be a multiplication,
    // Every other possibility is an error
    const [t, n] = [token.type, next.type];
    const validTerm = t == TokenType.Number || t == TokenType.Identifier;
    const validCoefficient = n == TokenType.Identifier || n == TokenType.OpenParen;
    const isGrouping = t == TokenType.OpenParen;

    if ((validTerm && validCoefficient) ||
        (isGrouping && (validCoefficient || n == TokenType.Number))) {
        // We insert a multiplication token immediately after our
        // current position so that this token and subsequent tokens
        // are parsed as a multiplication. This way we can handle
        // multiplication even where there's no explicit operator
        reader.insert({ type: TokenType.Operator, raw: "*" });
    }
}

function parseOperand(reader: TokenReader): ParseOutput {
    const token = reader.read();
    if (token === undefined)
        return undefined;

    const isUnary = token.type == TokenType.Operator && (token.raw == '-' || token.raw == '+');
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
        insideParentheses = true;
        node = prattParse(reader, 0);
        insideParentheses = false;

        // Parse the closing parentheses
        const next = reader.read();
        const ending = next === undefined ? "" : `, found ${next.raw}`;
        if (next === undefined || next.type != TokenType.ClosedParen)
            throw Error(`Expecting a closing parentheses${ending}`);
    }

    else if (isUnary) {
        node.data = token.raw;
        node.type = NodeType.UnaryOperator;
        node.left = parseOperand(reader);
        if (node.left === undefined)
            throw Error("Expecting operand found nothing");
    }

    else
        throw Error(`Expected a number, variable or grouping, found ${token.raw}`);

    checkForErrors(reader, token);
    handleImplicitMultiplication(reader, token);
    return node;
}

function prattParse(reader: TokenReader, currentPrecedence: number): ParseOutput {
    let currentNode = parseOperand(reader); // Parse the left hand side
    if (currentNode == undefined) return undefined;

    // Build the parse tree by accumulating nodes on the right hand side.
    // We're treating the expression as a successive list of binary operators.
    while (true) {
        const token = reader.read(false);
        if (token === undefined) break;
        const [precedence, groupLeft] = operatorInfo(token);
        if (token.type != TokenType.Operator || precedence <= currentPrecedence)
            break;

        // Adjust the precedence based on the operator associativity
        const nextPrecedence = groupLeft ? precedence : precedence - 1;
        reader.read();
        currentNode = {
            data: token.raw,
            type: NodeType.BinaryOperator,
            left: currentNode,
            right: prattParse(reader, nextPrecedence)
        };
    }

    if (currentNode.type == NodeType.BinaryOperator &&
        currentNode.right === undefined)
        throw Error("No right operand found");

    return currentNode;
}

export function parse(expression: string): ParseOutput {
    const reader = new TokenReader(expression);
    return prattParse(reader, 0);
}

// TODO; test this
// TODO: if we have something like 'x + x + x' we should turn it into '3x'
// TODO: now flatten the simplified parse tree into tokens in reverse polish notation
//       so we can evaluate the entire expression in a single pass
// Walk through the tree and fuse nodes we can already compute
export function simplify(root: Node): Node {
    if (root.type == NodeType.Constant || root.type == NodeType.Variable)
        return root;

    if (root.type == NodeType.UnaryOperator) {
        const left = simplify(root.left!);
        if (left.type == NodeType.Constant) {
            const result = operations[root.data](0, left.data);
            return { type: NodeType.Constant, data: result };
        }
        return { type: NodeType.UnaryOperator, data: root.data, left };
    }

    if (root.type == NodeType.BinaryOperator) {
        const left = simplify(root.left!);
        const right = simplify(root.right!);
        if (left.type == NodeType.Constant && right.type == NodeType.Constant) {
            const result = operations[root.data](left.data, right.data);
            return { type: NodeType.Constant, data: result };
        }
        return { type: NodeType.BinaryOperator, data: root.data, left, right };
    }

    throw Error(`Invalid node: ${root}`);
}


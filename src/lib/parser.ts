import { TokenReader, TokenType, operatorInfo } from "./lexer.ts";

// TODO: each node should have a type
export interface Node {
    left: Node | undefined,
    right: Node | undefined,
    value: number | string | undefined,
}

/*
Some parsing rules:
- A number immediately next to a variable should count as a multiplication.
  The other way around is an error.
- A variable immediately next to another variable should count as a multiplication
- A number or variable immediately next to (before or after) a grouping
  should count as a multiplication
- A number or a variale or a grouping followed by a operator and then another
  number or variable or grouping is a binary operation
- An expression that starts with a unary operator (+, -) is a unary expression
  ex: -123, -1 * x, -y, -(12 / 2)

Some parsing errors:
- A number immediately followed by a number is an error
- An operator that's not immediately followed by an expression is an error 
    - An operator immediately followed by another operator is an error
- A non unary operator that's not preceded by an expression is an error
- An unclosed parentheses is an error
*/

// Parse a single node
function parseOperand(reader: TokenReader): Node {
    let node: Node = { value: undefined, left: undefined, right: undefined };

    const token = reader.read();
    if (token === undefined)
        throw Error("Expecting a token, found undefined");

    switch (token.type) {
        case TokenType.Number:
            node.value = Number(token.raw);
            break;
        case TokenType.Variable:
            node.value = token.raw;
            break;
        case TokenType.OpenParen:
            node = prattParse(reader, 0); // Parse a new expression
            const closing = reader.read();
            const raw = token === undefined ? "undefined" : token.raw;
            if (closing === undefined || closing.type != TokenType.ClosedParen)
                throw Error(`Expecting a closing parentheses, found ${raw}`);
            break;
        default:
            throw Error(`Expecting a number or opening parentheses, found ${token.raw}`);
    }

    return node;
}

function prattParse(reader: TokenReader, currentPrecedence: number): Node {
    let currentNode = parseOperand(reader); // Parse the left hand side

    // Build the parse tree by accumulating nodes on the right hand side.
    // We're treating the expression as a successive list of binary operators.
    while (true) {
        const token = reader.read(false);
        if (token === undefined ||
            token.type != TokenType.Operator ||
            operatorInfo(token)[0] <= currentPrecedence)
            break;

        // Adjust the precedence based on the operator associativity
        const [precedence, groupLeft] = operatorInfo(token);
        const next = groupLeft ? precedence : precedence - 1;

        reader.read();
        currentNode = {
            left: currentNode,
            right: prattParse(reader, next),
            value: token.raw
        };
    }

    return currentNode;
}

export function parse(expression: string): Node {
    const reader = new TokenReader(expression);
    return prattParse(reader, 0);
}

console.log(parse("(123 * 2)"));

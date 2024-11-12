import { TokenReader, TokenType, operatorInfo } from "./lexer.ts";

export interface Node {
    left: Node | undefined,
    right: Node | undefined,
    value: number | string | undefined,
}

// Parse a single node
function prattParseNode(reader: TokenReader): Node {
    let node: Node = { value: undefined, left: undefined, right: undefined };

    const token = reader.read();
    if (token === undefined)
        throw Error("Expecting a token, found undefined");

    switch (token.type) {
        case TokenType.Number:
            node.value = Number(token.raw);
            break;
        case TokenType.Identifier:
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

// TODO: a number or identifier immediately next to a parentheses (before or after) should be a multiplication
// TODO: how should we parse functions
// TODO: test this function against different inputs
function prattParse(reader: TokenReader, currentPrecedence: number): Node {
    let currentNode = prattParseNode(reader); // Parse the left hand side

    // Build the parse tree
    while (true) {
        const token = reader.read(false);
        if (token === undefined ||
            token.type != TokenType.Operator ||
            operatorInfo(token)[0] <= currentPrecedence)
            break;

        // Adjust the precedence based on the operator associativity
        const [precedence, groupLeft] = operatorInfo(token);
        const next = groupLeft ? precedence : precedence - 1;

        reader.read(); // Advance reader
        currentNode = { // Accumulate on the right hand side
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

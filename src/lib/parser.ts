import { TokenReader, TokenType, operatorInfo } from "./lexer.ts";

// TODO: rewrite this entirely

export interface Node {
    data: any, // TODO: make this more defined
    left: Node | undefined,
    right: Node | undefined,
}

// Parse a single node
function parseOperand(reader: TokenReader): Node | undefined {
    const token = reader.read();
    if (token === undefined)
        return undefined;

    let node: Node = { data: undefined, left: undefined, right: undefined };

    switch (token.type) {
        case TokenType.Number:
            node.data = Number(token.raw);
            break;
        case TokenType.Identifier:
            node.data = token.raw;
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

    // TODO: what if we just inserted implicit tokens???
    return node;
}

function prattParse(reader: TokenReader, currentPrecedence: number): Node | undefined {
    let currentNode = parseOperand(reader); // Parse the left hand side
    if (currentNode == undefined) return undefined;

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
            data: token.raw
        };
    }

    return currentNode;
}

export function parse(expression: string): Node | undefined {
    const reader = new TokenReader(expression);
    return prattParse(reader, 0);
}


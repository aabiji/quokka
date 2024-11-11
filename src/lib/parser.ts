
enum TokenType {
    Number,
    Operator,
    OpenParen,
    ClosedParen,
    Identifier,
}

interface Token {
    type: TokenType,
    raw: string,
}

interface OperatorInfo {
    precedence: number,
    groupLeft: boolean
}

function operatorInfo(token: Token): OperatorInfo {
    // Every operation except exponentiation is left associative
    let groupLeft = token.raw != "^" ? true : false;

    // Precedence levels based on the arithmetic operation
    let precedence = 0;
    if (token.raw == "+" || token.raw == "-") precedence = 1;
    if (token.raw == "*" || token.raw == "/") precedence = 2;
    if (token.raw == "^") precedence = 3;

    return { precedence, groupLeft };
}

// Tokenize the input expression and return an array of tokens.
// Throw an error if there are any.
function tokenize(input: string): Token[] {
    const special = {
        "+": TokenType.Operator, "-": TokenType.Operator,
        "*": TokenType.Operator, "/": TokenType.Operator,
        "(": TokenType.OpenParen, ")": TokenType.ClosedParen,
    };
    let i = 0;
    let tokens: Token[] = [];

    while (i < input.length) {
        // Read up to a special character, ignoring whitespace
        let value = "";
        while (!Object.keys(special).includes(input[i]) && i < input.length) {
            let char = input[i++];
            if (char != ' ') value += char;
        }

        let raw = value.length == 0 ? input[i] : value;
        let token = { raw, type: TokenType.Identifier };
        if (Object.keys(special).includes(raw)) {
            i++; // Since we didn't read anything;
            token.type = special[raw as keyof typeof special];
        } else if (!isNaN(Number(raw))) {
            token.type = TokenType.Number
        }
        tokens.push(token);
    }

    return tokens;
}

class TokenReader {
    tokens: Token[];
    index: number;

    constructor(input: string) {
        this.index = 0;
        this.tokens = tokenize(input);
    }

    consume(): Token | undefined {
        const eof = this.index >= this.tokens.length;
        return eof ? undefined : this.tokens[this.index++];
    }

    peek() {
        const eof = this.index >= this.tokens.length;
        return eof ? undefined : this.tokens[this.index];
    }
}

interface Node {
    value: number,
    left: Node | undefined,
    right: Node | undefined,
    operator: string | undefined,
}

function parse(reader: TokenReader, currentPrecedence: number): Node {
    const token = reader.consume();
    if (token === undefined)
        throw Error("Expecting a token, found undefined");

    // Parse the left hand side
    let currentNode: Node = { value: 0, left: undefined, right: undefined, operator: undefined };
    if (token.type == TokenType.Number) {
        currentNode.value = Number((token as Token).raw);
    } else if (token.type == TokenType.OpenParen) {
        // Parse a new expression
        currentNode = parse(reader, 0);
        const closing = reader.consume();
        if (closing === undefined || closing.type != TokenType.ClosedParen)
            throw Error("Expecting a closing parentheses");
    } else
        throw Error(`Expecting a number or opening parentheses, found ${token.raw}`);

    // Build the parse tree
    while (true) {
        const token = reader.peek();
        if (token === undefined ||
            token.type != TokenType.Operator ||
            operatorInfo(token).precedence <= currentPrecedence)
            break;

        // Adjust the precedence based on the operator associativity
        const { precedence, groupLeft } = operatorInfo(token);
        const next = groupLeft ? precedence : precedence - 1;

        reader.consume(); // Advance reader
        currentNode = { // Accumulate on the right hand side
            left: currentNode,
            right: parse(reader, next),
            operator: token.raw,
            value: 0
        };
    }

    return currentNode;
}

// TODO: so, our parser is working! now we need to test it and try to break it. Better error messages would be nice too.
// TODO: then add support for identifiers and functions (sin, cos, log, etc)
// TODO: then maybe figure out how to simplify the parse by evaluating nodes we can
// TODO: then wrap our parse function in an outer function and expose to the frontend
const node = parse(new TokenReader("(12 - 34) + (123 + 456)"), 0);
console.log(node);

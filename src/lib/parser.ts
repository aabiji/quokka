
enum TokenType {
    Number, // TODO: just a thought, what if the numbers are too big????
    Operator
}

interface Token {
    type: TokenType,
    raw: string,
}

// Tokenize the input expression and return an array of tokens.
// Throw an error if there are any.
function tokenize(input: string): Token[] {
    let i = 0;
    let tokens: Token[] = [];
    let operators = ["+", "-", "*", "/", "^"];

    while (i < input.length) {
        // Read up to an operator, ignoring whitespace
        let value = "";
        while (!operators.includes(input[i]) && i < input.length) {
            let char = input[i++];
            if (char != ' ') value += char;
        }

        if (value.length == 0) {
            tokens.push({ type: TokenType.Operator, raw: input[i] });
            i++; // Since we didn't read anything
        }
        else if (!isNaN(Number(value)))
            tokens.push({ type: TokenType.Number, raw: value });
        else
            throw Error(`Invalid input ${value}`);
    }

    return tokens;
}

class TokenReader {
    tokens: Token[];
    tokenIndex: number;

    constructor(input: string) {
        this.tokenIndex = 0;
        this.tokens = tokenize(input);
    }

    // TODO: separate functions for peeking and consuming
    read(advance: boolean = true): Token | undefined {
        if (this.tokenIndex >= this.tokens.length)
            return undefined;
        const current = this.tokens[this.tokenIndex];
        this.tokenIndex += advance ? 1 : 0;
        return current;
    }
}

// TODO: this has to go at some point
function validateToken(token: Token | undefined, expected: TokenType) {
    if (token == undefined)
        throw Error("Expected a token, found undefined");
    if (token.type != expected)
        throw Error(`Expected ${expected}, found ${token.type} instead`);
}

// TODO: combine associativity and precedence
function isLeftAssociative(operator: string): boolean {
    return operator != "^" ? true : false;
}

function getPrecedence(token: Token): number {
    // FIXME: storing operators in string this way is kinda dodgy
    if (token.raw == "+" || token.raw == "-") return 1;
    if (token.raw == "*" || token.raw == "/") return 2;
    if (token.raw == "^") return 3;
    return 0;
}

// TODO: helper for creatng a new node in a nicer way
class Node {
    value: number = 0;
    left: Node | undefined = undefined;
    right: Node | undefined = undefined;
    operator: string | undefined = undefined;
}

// TODO: how about parentheses??
function parse(reader: TokenReader, precedence: number): Node {
    const numberToken = reader.read();
    validateToken(numberToken, TokenType.Number);

    let currentNode = new Node();
    currentNode.value = Number((numberToken as Token).raw);

    // Accumulate nodes on the right hand side
    while (true) {
        const token = reader.read(false);
        const nextPrecedence = token == undefined ? 0 : getPrecedence(token);
        if (token == undefined ||
            token.type != TokenType.Operator ||
            nextPrecedence <= precedence)
            break;

        // temporarily change precedence to group to the left or right based on associativity
        const newPrecedence = isLeftAssociative(token.raw) ? nextPrecedence : nextPrecedence - 1;

        reader.read();
        let node = new Node();
        node.operator = token.raw;
        node.left = currentNode;
        node.right = parse(reader, newPrecedence);
        currentNode = node;
    }

    return currentNode;
}

const node = parse(new TokenReader("12 - 34 + 56"), 0);
console.log(node);

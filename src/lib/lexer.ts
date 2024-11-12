
export enum TokenType {
    Number,
    Operator,
    Identifier,
    OpenParen,
    ClosedParen,
}

interface Token {
    type: TokenType,
    raw: string,
}

// Return the precedence and associativity of a operator
export function operatorInfo(token: Token): [number, boolean] {
    // Every operation except exponentiation is left associative
    let groupLeft = token.raw != "^" ? true : false;

    // Precedence levels based on the arithmetic operation
    let precedence = 0;
    if (token.raw == "+" || token.raw == "-") precedence = 1;
    if (token.raw == "*" || token.raw == "/") precedence = 2;
    if (token.raw == "^") precedence = 3;

    return [precedence, groupLeft];
}

// Tokenize the input expression and return an array of tokens.
// Throw an error if there are any.
export function tokenize(input: string): Token[] {
    const tokenTypes = {
        '+': TokenType.Operator, '-': TokenType.Operator,
        '*': TokenType.Operator, '/': TokenType.Operator,
        '^': TokenType.Operator, '(': TokenType.OpenParen,
        ')': TokenType.ClosedParen,
    };

    // Matches a whole or decimal number
    const numberRegex = new RegExp(/\d+(\.\d+)?/, "g");

    // Every character that can't be in an identifier string
    const invalidChars = [...Object.keys(tokenTypes), ' ', ',', '.', '?', '<', '_',
        '>', ';', ':', "'", '"', '\\', '|', '[', ']', '{',
        '}', '=', '&', '%', '$', '#', '@', '!', '~', '`'];

    let i = 0;
    let tokens: Token[] = [];
    while (i < input.length) {
        // Extract single character token
        if (input[i] in tokenTypes) {
            let key = input[i] as keyof typeof tokenTypes;
            tokens.push({ type: tokenTypes[key], raw: input[i] });
            i++;
            continue;
        }

        // Extract number token
        if (!isNaN(parseInt(input[i]))) {
            let match = input.slice(i).match(numberRegex)![0];
            tokens.push({ type: TokenType.Number, raw: match });
            i += match.length;
            continue;
        }

        // Extract identifier strings
        let identifier = "";
        while (i < input.length) {
            if (invalidChars.includes(input[i]) || !isNaN(parseInt(input[i])))
                break;
            identifier += input[i++];
        }

        if (identifier.length > 0) {
            // NOTE: Variables can only be 1 letter long.
            // We won't support functions for now
            const characters = identifier.split("");
            for (const char of characters) {
                tokens.push({ type: TokenType.Identifier, raw: char });
            }
            continue;
        }

        // Throw on invalid characters
        if (input[i] != ' ')
            throw Error(`Invalid character: ${input[i]}`);

        i++;
    }

    return tokens;
}

export class TokenReader {
    tokens: Token[];
    index: number;

    constructor(input: string) {
        this.index = 0;
        this.tokens = tokenize(input);
    }

    read(advance: boolean = true): Token | undefined {
        const eof = this.index >= this.tokens.length;
        let value = eof ? undefined : this.tokens[this.index];
        if (advance && !eof) this.index++;
        return value;
    }
}


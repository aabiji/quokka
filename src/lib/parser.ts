
enum TokenType {
    Number,
    Operator
}

interface Token {
    type: TokenType,
    raw: string,
    numeric: number
}

// Tokenize the input expression and return an array of tokens.
// Throw an error if there are any.
function tokenize(input: string): Token[] {
    let i = 0;
    let tokens: Token[] = [];
    let operators = ["+", "-", "*", "/"];

    while (i < input.length) {
        // Read up to an operator, ignoring whitespace
        let value = "";
        while (!operators.includes(input[i]) && i < input.length) {
            let char = input[i++];
            if (char != ' ') value += char;
        }

        if (value.length == 0) {
            tokens.push({ type: TokenType.Operator, raw: input[i], numeric: 0 });
            i++; // Since we didn't read anything
        }
        else if (!isNaN(Number(value)))
            tokens.push({ type: TokenType.Number, raw: value, numeric: Number(value) });
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

    read(advance: boolean): Token | undefined {
        if (this.tokenIndex >= this.tokens.length)
            return undefined;
        const current = this.tokens[this.tokenIndex];
        this.tokenIndex += advance ? 1 : 0;
        return current;
    }
}

/*
[Pratt parsing](https://engineering.desmos.com/articles/pratt-parser/)
- Only recurse when the next operator has higher precedence than our previous operator
- When we have things like parentheses, we can recursively parse with the precedence reset
*/

function parse(reader: TokenReader) {
}

parse(new TokenReader("123 + 456 / 789"));

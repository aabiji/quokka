import { expect, test } from "bun:test";
import { TokenType, tokenize } from "./lexer.ts";

test("Tokenize Operators", () => {
    const expected = [
        { type: TokenType.Operator, raw: "+" },
        { type: TokenType.Operator, raw: "-" },
        { type: TokenType.Operator, raw: "*" },
        { type: TokenType.Operator, raw: "/" },
        { type: TokenType.Operator, raw: "^" },
    ];
    const tokens = tokenize("+-*/^");
    expect(tokens).toEqual(expected);
});

test("Tokenize Values", () => {
    const expected = [
        { type: TokenType.Number, raw: "123" },
        { type: TokenType.Variable, raw: "x" },
        { type: TokenType.Operator, raw: "-" },
        { type: TokenType.Number, raw: "1.23" },
        { type: TokenType.Operator, raw: "+" },
        { type: TokenType.Variable, raw: "x" },
    ];
    const tokens = tokenize("  123x -  1.23 + x");
    expect(tokens).toEqual(expected);
});

test("Tokenize Extra", () => {
    const expected = [
        { type: TokenType.Operator, raw: "-" },
        { type: TokenType.Number, raw: "456" },
        { type: TokenType.OpenParen, raw: "(" },
        { type: TokenType.Variable, raw: "x" },
        { type: TokenType.Operator, raw: "-" },
        { type: TokenType.Variable, raw: "y" },
        { type: TokenType.ClosedParen, raw: ")" },
        { type: TokenType.OpenParen, raw: "(" },
        { type: TokenType.Number, raw: "789" },
        { type: TokenType.Operator, raw: "*" },
        { type: TokenType.Variable, raw: "z" },
        { type: TokenType.ClosedParen, raw: ")" },
    ];
    const tokens = tokenize("-456(x - y)(789 * z)");
    expect(tokens).toEqual(expected);
});

test("Tokenize Invalid", () => {
    const invalids = ["123_02384", "s$me.t@ing", "x % y", "something"]
    for (const expression of invalids) {
        expect(() => tokenize(expression)).toThrow();
    }
});

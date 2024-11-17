import { expect, test } from "bun:test";
import { TokenType, tokenize } from "./lexer.ts";

test("Tokenize operators", () => {
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

test("Tokenize values", () => {
    const expected = [
        { type: TokenType.Number, raw: "123" },
        { type: TokenType.Identifier, raw: "x" },
        { type: TokenType.Operator, raw: "-" },
        { type: TokenType.Number, raw: "1.23" },
        { type: TokenType.Operator, raw: "+" },
        { type: TokenType.Identifier, raw: "x" },
        { type: TokenType.Operator, raw: "/" },
        { type: TokenType.Identifier, raw: "x" },
        { type: TokenType.Identifier, raw: "y" },
        { type: TokenType.Identifier, raw: "z" },
    ];
    const tokens = tokenize("  123x -  1.23 + x / xyz");
    expect(tokens).toEqual(expected);
});

test("Tokenize extra", () => {
    const expected = [
        { type: TokenType.Operator, raw: "-" },
        { type: TokenType.Number, raw: "456" },
        { type: TokenType.OpenParen, raw: "(" },
        { type: TokenType.Identifier, raw: "x" },
        { type: TokenType.Operator, raw: "-" },
        { type: TokenType.Identifier, raw: "y" },
        { type: TokenType.ClosedParen, raw: ")" },
        { type: TokenType.OpenParen, raw: "(" },
        { type: TokenType.Number, raw: "789" },
        { type: TokenType.Operator, raw: "*" },
        { type: TokenType.Identifier, raw: "z" },
        { type: TokenType.ClosedParen, raw: ")" },
    ];
    const tokens = tokenize("-456(x - y)(789 * z)");
    expect(tokens).toEqual(expected);
});

test("Tokenize invalid", () => {
    const invalids = ["123_02384", "s$me.t@ing", "x % y"];
    for (const expression of invalids) {
        expect(() => tokenize(expression)).toThrow();
    }
});

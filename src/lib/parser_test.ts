import { expect, test } from "bun:test";
import { Node, parse } from "./parser.ts";

test("Test Precedence Parsing", () => {
    /*
    {
        data: "+", type: Operator,
        left: {
            data: "-", type: Operator,
            left: {
                data: "*", type: Operator,
                left: { Constant, data: 12 },
                right: {
                    data: "^", type: Operator,
                    left:  { Constant, data: 34 },
                    right: { Constant, data: 45 },
                }
            },
            right: { type: Constant, data: 123 }
        },
        right: {
            data: "*", type: Operator,
            left:  { Variable, data: "x" },
            right: { Variable, data: "y" },
        }
    }
    */

    // TODO: expecting binary operator parsing with precedence
    const tree = parse("12 * 34^45 - 123 + xy");
    console.log(JSON.stringify(tree, null, 4));
});

test("Test Implicit Multiplication", () => {
    /*
    {
        type: Operator, data: "+",
        left: {
            type: Operator, data: "+",
            left: {
                type: Operator, data: "+",
                left: {
                    type: Operator, data: "*",
                    left:  { type: Constant, data: 123 },
                    right: { type: Variable, data: 'x' },
                },
                right: {
                    type: Operator, data: "*",
                    left:  { type: Variable, data: 'x' },
                    right: { type: Variable, data: 'z' },
                }
            },
            right: {
                type: Operator, data: "*",
                left: {
                    type: Operator, data: "*",
                    left:  { type: Variable, data: 'w' },
                    right: { type: Constant, data: 123 },
                },
                right: { type: Constant, data: 456 },
            }
        },
        right: {
            type: Operator, data: "*",
            left: {
                type: Operator, data: "+",
                left:  { type: Variable, data: 'x' },
                right: { type: Variable, data: 'y' },
            },
            right: {
                type: Operator, data: "-",
                left:  { type: Variable, data: 'x' },
                right: { type: Variable, data: 'y' },
            }
        }
    }
    */

    // TODO: expecting these to be multiplications
    const tree = parse("123x + xz + w(123)456 + (x + y)(x - y)");
    //console.log(JSON.stringify(tree, null, 4));
});

test("Test Unary Parsing", () => {
    // TODO: expecting unary operations to be parsed properly
    const tree = parse("-123 * -x(+123)");
    //console.log(JSON.stringify(tree, null, 4));
});

test("Test Invalid Expressions", () => {
    const examples = ["123 123", "x123", "123 + + 456", "(x + y",
        "x + y)", "+", " * x"];
    for (const invalid of examples) {
        expect(() => parse(invalid)).toThrow();
    }
});

test("Test Empty Expressions", () => {
    expect(parse("")).toBe(undefined);
    expect(parse("()")).toBe(undefined);
});

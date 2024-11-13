import { expect, test } from "bun:test";
import { NodeType, Node, parse } from "./parser.ts";

test("Test Precedence Parsing", () => {
    const expected: Node = {
        data: "+", type: NodeType.BinaryOperator,
        left: {
            data: "-", type: NodeType.BinaryOperator,
            left: {
                data: "*", type: NodeType.BinaryOperator,
                left: { type: NodeType.Constant, data: 12 },
                right: {
                    data: "^", type: NodeType.BinaryOperator,
                    left: { type: NodeType.Constant, data: 34 },
                    right: { type: NodeType.Constant, data: 45 },
                }
            },
            right: { type: NodeType.Constant, data: 123 }
        },
        right: {
            data: "*", type: NodeType.BinaryOperator,
            left: { type: NodeType.Variable, data: "x" },
            right: { type: NodeType.Variable, data: "y" },
        }
    }

    // TODO: expecting binary operator parsing with precedence
    const tree = parse("12 * 34^45 - 123 + xy");
    expect(tree).toEqual(expected);
});

test("Test Implicit Multiplication", () => {
    const expected: Node = {
        type: NodeType.BinaryOperator, data: "+",
        left: {
            type: NodeType.BinaryOperator, data: "+",
            left: {
                type: NodeType.BinaryOperator, data: "+",
                left: {
                    type: NodeType.BinaryOperator, data: "*",
                    left: { type: NodeType.Constant, data: 123 },
                    right: { type: NodeType.Variable, data: 'x' },
                },
                right: {
                    type: NodeType.BinaryOperator, data: "*",
                    left: { type: NodeType.Variable, data: 'x' },
                    right: { type: NodeType.Variable, data: 'z' },
                }
            },
            right: {
                type: NodeType.BinaryOperator, data: "*",
                left: {
                    type: NodeType.BinaryOperator, data: "*",
                    left: { type: NodeType.Variable, data: 'w' },
                    right: { type: NodeType.Constant, data: 123 },
                },
                right: { type: NodeType.Constant, data: 456 },
            }
        },
        right: {
            type: NodeType.BinaryOperator, data: "*",
            left: {
                type: NodeType.BinaryOperator, data: "+",
                left: { type: NodeType.Variable, data: 'x' },
                right: { type: NodeType.Variable, data: 'y' },
            },
            right: {
                type: NodeType.BinaryOperator, data: "-",
                left: { type: NodeType.Variable, data: 'x' },
                right: { type: NodeType.Variable, data: 'y' },
            }
        }
    }

    // TODO: expecting these to be multiplications
    const tree = parse("123x + xz + w(123)456 + (x + y)(x - y)");
    expect(tree).toEqual(expected);
});

test("Test Unary Parsing", () => {
    const expected: Node = {
        type: NodeType.BinaryOperator, data: "*",
        left: {
            type: NodeType.BinaryOperator, data: "*",
            left: {
                type: NodeType.UnaryOperator, data: "-",
                left: { type: NodeType.Constant, data: 123 },
            },
            right: {
                type: NodeType.UnaryOperator, data: "-",
                left: { type: NodeType.Variable, data: 'x' },
            }
        },
        right: {
            type: NodeType.UnaryOperator, data: "+",
            left: { type: NodeType.Constant, data: 123 },
        }
    }
    // TODO: expecting unary operations to be parsed properly
    const tree = parse("-123 * -x(+123)");
    expect(tree).toEqual(expected);
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

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
                },
            },
            right: {
                data: "/", type: NodeType.BinaryOperator,
                left: { type: NodeType.Constant, data: 123 },
                right: { type: NodeType.Constant, data: 789 }
            }
        },
        right: {
            data: "+", type: NodeType.BinaryOperator,
            left: { type: NodeType.Constant, data: 256 },
            right: { type: NodeType.Constant, data: 652 }
        }
    }
    const tree = parse("12 * 34^45 - 123 / 789 + (256 + 652)", false);
    expect(tree).toEqual(expected);
    expect(parse("", false)).toBe(undefined);
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
                    right: { type: NodeType.Variable, data: "x" },
                },
                right: {
                    type: NodeType.BinaryOperator, data: "*",
                    left: { type: NodeType.Variable, data: "x" },
                    right: { type: NodeType.Variable, data: "z" },
                }
            },
            right: {
                type: NodeType.BinaryOperator, data: "*",
                left: {
                    type: NodeType.BinaryOperator, data: "*",
                    left: { type: NodeType.Variable, data: "w" },
                    right: { type: NodeType.Constant, data: 123 },
                },
                right: { type: NodeType.Constant, data: 456 },
            }
        },
        right: {
            type: NodeType.BinaryOperator, data: "*",
            left: {
                type: NodeType.BinaryOperator, data: "+",
                left: { type: NodeType.Variable, data: "x" },
                right: { type: NodeType.Variable, data: "y" },
            },
            right: {
                type: NodeType.BinaryOperator, data: "-",
                left: { type: NodeType.Variable, data: "x" },
                right: { type: NodeType.Variable, data: "y" },
            }
        }
    }

    const tree = parse("123x + xz + w(123)456 + (x + y)(x - y)", false);
    expect(tree).toEqual(expected);
});

test("Test Unary Parsing", () => {
    const expected: Node = {
        type: NodeType.BinaryOperator, data: "+",
        left: {
            type: NodeType.BinaryOperator, data: "*",
            left: {
                type: NodeType.UnaryOperator, data: "-",
                left: { type: NodeType.Constant, data: 123 },
            },
            right: {
                type: NodeType.UnaryOperator, data: "-",
                left: { type: NodeType.Variable, data: "x" },
            }
        },
        right: { type: NodeType.Constant, data: 456 },
    }
    const tree = parse("-123 * -x + 456", false);
    expect(tree).toEqual(expected);
});

test("Test Reducing Variable Expression", () => {
    const expected = [
        {
            type: NodeType.BinaryOperator, data: "*",
            left: { type: NodeType.Constant, data: 4 },
            right: { type: NodeType.Variable, data: 'x' }
        },
        {
            type: NodeType.BinaryOperator, data: "^",
            left: { type: NodeType.Constant, data: 4 },
            right: { type: NodeType.Variable, data: 'x' }
        },
        {
            type: NodeType.BinaryOperator, data: "*",
            left: { type: NodeType.Constant, data: 5 },
            right: { type: NodeType.Variable, data: "x" }
        },
    ];
    const expressions = ["x + x + x + x", "x * x * x * x", "3 * x + x + x"];
    for (let i = 0; i < 3; i++) {
        const tree = parse(expressions[i], true);
        expect(tree).toEqual(expected[i]);
    }
});

test("Test Reducing Numeric Expression", () => {
    const expected: Node = { type: NodeType.Constant, data: 20008 };
    const tree = parse("(12 + 34 * 56 / 2 ^ 2) * 123 / 3", true);
    expect(tree).toEqual(expected);
});

test("Test Invalid Expressions", () => {
    const examples = ["123 123", "x123", "123 +", "(x + y",
        "x + y)", "+", " * x", "()"];
    for (const invalid of examples) {
        expect(() => parse(invalid, false)).toThrow();
    }
});

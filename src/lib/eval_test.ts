import { test, expect } from "bun:test";
import { Expression } from "./eval.ts";

test("Test evaluation", () => {
    const expected = [40, 100, 260, 580, 1120, 1940];
    let expression = new Expression("10x^3 + 20x^2 + 30x + 40");
    for (let i = 0; i < 6; i++) {
        expression.variables["x"] = i;
        const result = expression.evaluate();
        expect(result).toEqual(expected[i]);
    }
});

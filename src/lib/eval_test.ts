import { test, expect } from "bun:test";
import { processExpression, evaluateExpression } from "./eval.ts";

test("Test evaluation", () => {
    const expression = "10x^3 + 20x^2 + 30x + 40";
    const expected = [40, 100, 260, 580, 1120, 1940];
    const [values, table] = processExpression(expression)!;
    for (let i = 0; i < 6; i++) {
        table["x"] = i;
        const result = evaluateExpression(values, table);
        expect(result).toEqual(expected[i]);
    }
});

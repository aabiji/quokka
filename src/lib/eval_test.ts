import { test, expect } from "bun:test";
import { Expression } from "./eval.ts";

test("Test evaluation", () => {
    const expected = [[0, 40], [1, 100], [2, 260], [3, 580], [4, 1120], [5, 1940]];
    const expression = new Expression("10x^3 + 20x^2 + 30x + 40");
    const coordinates = expression.sample(0, 6, 1);
    expect(coordinates).toEqual(expected);
});


export class Vec2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

export const distance = (a: Vec2, b: Vec2) =>
        Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2); // Euclidean distance
export const add = (a: Vec2, b: Vec2) => new Vec2(a.x + b.x, a.y + b.y);
export const sub = (a: Vec2, b: Vec2) => new Vec2(a.x - b.x, a.y - b.y);
export const mulf = (a: Vec2, b: number) => new Vec2(a.x * b, a.y * b);
export const divf = (a: Vec2, b: number) => new Vec2(a.x / b, a.y / b);
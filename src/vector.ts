
export class Vec2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    addf(b: number): Vec2 {
        return new Vec2(this.x + b, this.y + b);
    }

    mulf(b: number): Vec2 {
        return new Vec2(this.x * b, this.y * b);
    }

    divf(b: number): Vec2 {
        return new Vec2(this.x / b, this.y / b);
    }

    add(b: Vec2): Vec2 {
        return new Vec2(this.x + b.x, this.y + b.y);
    }

    sub(b: Vec2): Vec2 {
        return new Vec2(this.x - b.x, this.y - b.y);
    }

    mul(b: Vec2): Vec2 {
        return new Vec2(this.x * b.x, this.y * b.y);
    }

    distance(b: Vec2): number { // Euclidean distance
        return Math.sqrt((b.x - this.x) ** 2 + (b.y - this.y) ** 2);
    }
}


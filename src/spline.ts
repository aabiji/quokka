import { Vec2, distance, add, sub, mulf, divf } from "./math.ts";

// A Catmull-Rom spline can be expressed as a cubic polynomial
// under the form: ax^3 + bx^2 + cx + d. So instead of using
// the complicated and slow piecewise polynomial equation,
// we'll use the simpler cubic polynomial. Here we're just
// precomputing the coefficients of the polynomial.
// Explanation and reference implementation comes from here:
// https://qroph.github.io/2018/07/30/smooth-paths-using-catmull-rom-splines.html
export class SplineSegment {
    a: Vec2;
    b: Vec2;
    c: Vec2;
    d: Vec2;

    // p0, p1, p2 and p3 are the spline control points
    // alpha is the parametization of the spline. A value of 0.5 will give
    // a centripetal spline.
    constructor(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, alpha: number) {
        const t01 = distance(p0, p1) ** alpha;
        const t12 = distance(p1, p2) ** alpha;
        const t23 = distance(p2, p3) ** alpha;

        const m1 = add(sub(p2, p1), mulf(sub(divf(sub(p1, p0), t01), divf(sub(p2, p0), t01 + t12)), t12));
        const m2 = add(sub(p2, p1), mulf(sub(divf(sub(p3, p2), t23), divf(sub(p3, p1), t12 + t23)), t12));

        this.a = add(add(mulf(sub(p1, p2), 2), m1), m2);
        this.b = sub(sub(sub(mulf(sub(p1, p2), -3), m1), m1), m2);
        this.c = m1;
        this.d = p1;
    }

    // Evaluate the cubic polynomial equation
    interpolate(t: number) {
        const x = this.a.x * t * t * t + this.b.x * t * t + this.c.x * t + this.d.x;
        const y = this.a.y * t * t * t + this.b.y * t * t + this.c.y * t + this.d.y;
        return new Vec2(x, y);
    }
}

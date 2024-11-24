import { Canvas } from "./canvas.ts";
import { Expression } from "./lib/eval.ts";
import { Vec2 } from "./vector.ts";

const size = 45; // tile size
let expressions: Expression[] = [];

function renderGraphBackground(canvas: Canvas) {
    canvas.clear();

    const [gray, black] = ["#cabccc", "#000000"];
    const [cx, cy] = [canvas.centerX, canvas.centerY];
    const numTilesX = Math.ceil(canvas.centerX / size) + 1;
    const numTilesY = Math.ceil(canvas.centerY / size) + 1;

    // Draw the grid from the center outwards. This way, if
    // the canvas dimensions are not a multiple of `size`, the
    // outer tiles will be clipped accordingly
    for (let y = 0; y < numTilesY; y++) {
        for (let x = 0; x < numTilesX; x++) {
            // Draw squares at the top and bottom of the horizantal
            // axis and left and right of the vertical axis
            canvas.drawRect(canvas.pos(-x, -y, size), size, size, gray);
            canvas.drawRect(canvas.pos(x, -y, size), size, size, gray);
            canvas.drawRect(canvas.pos(-x, y, size), size, size, gray);
            canvas.drawRect(canvas.pos(x, y, size), size, size, gray);

            // Draw the horizantal and vertical axis labels
            // TODO; refactor this
            if (x != numTilesX - 1 && y != numTilesY - 1 && x != 0 && y != 0) {
                canvas.drawText(`${x}`, canvas.pos(x - 0.1, 0.5, size), 15, black);
                canvas.drawText(`-${x}`, canvas.pos(-x - 0.2, 0.5, size), 15, black);
                canvas.drawText(`${y}`, canvas.pos(0.2, y + 0.1, size), 15, black);
                canvas.drawText(`-${y}`, canvas.pos(0.2, -y + 0.1, size), 15, black);
            }
        }
    }

    // Draw horizantal and vertical axes
    canvas.drawLine(new Vec2(cx, 0), new Vec2(cx, canvas.height), black, 2);
    canvas.drawLine(new Vec2(0, cy), new Vec2(canvas.width, cy), black, 2);
}

function getExpressionPoints(canvas: Canvas, expression: Expression): Vec2[] {
    const numTilesX = Math.ceil(canvas.centerX / size) + 1;

    // For points on the left and right of the vertical axis
    let keepPlotting = [true, true];
    let points: Vec2[][] = [[], []];

    // Calculate points from the center outwards
    for (let i = 0; i < numTilesX; i++) {
        const values = [-i, i];
        // Find point on the left (-x) and on the right (x)
        for (let j = 0; j < values.length; j++) {
            if (!keepPlotting[j]) continue;

            const x = values[j];
            expression.variables["x"] = x;
            const y = expression.evaluate();

            const position = canvas.pos(x, -y, size);
            points[j].push(position);

            // Stop plotting in the current direction (left or right) when
            // the on screen x or y position is outside the viewing range
            if (!canvas.visible(position)) keepPlotting[j] = false;
        }
    }

    return [...points[0], ...points[1]];
}

// Describes a spline segment used in the Catmull-Rom spline interplation algorithm
// Formalae is adapting from this nice explanation:
// https://qroph.github.io/2018/07/30/smooth-paths-using-catmull-rom-splines.html
// Splines are also nicely explained here:
// https://www.youtube.com/watch?v=jvPPXbo87ds
class SplineSegment {
    // Constants used to quickly interpolate a spline segment
    a: Vec2;
    b: Vec2;
    c: Vec2;
    d: Vec2;

    // Precomputing constants used to represent the spline
    // segment between p1 and p2. p0, p1, p2, p3 are the 4 control points.
    // t is the tension. Going from 0 to 1 it describes how taut the spline is.
    // a is the alpha. Going from 0 to 1 it describes the type of spline.
    // 0.0 for a uniform spline, 0.5 for a centripetal spline
    // and 1.0 for a chordal spline
    constructor(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number, a: number) {
        const t01 = p0.distance(p1) ** a;
        const t12 = p1.distance(p2) ** a;
        const t23 = p2.distance(p3) ** a;

        const x = p2.sub(p1).addf(t12);
        const y = p1.sub(p0).divf(t01).sub(p2.sub(p0).divf(t01 + t12));
        const z = p3.sub(p2).divf(t23).sub(p3.sub(p1).divf(t12 + t23));
        const m1 = x.mul(y).mulf(1 - t);
        const m2 = x.mul(z).mulf(1 - t);

        this.a = p1.sub(p2).mulf(2).add(m1).add(m2);
        this.b = p1.sub(p2).mulf(-3).sub(m1).sub(m1).sub(m2);
        this.c = m1;
        this.d = p1;
    }

    // t describes time, the distance between the 2
    // points we're interpolating between
    interpolate(t: number): Vec2 {
        const ax = this.a.mulf(t ** 3);
        const bx = this.b.mulf(t ** 2);
        const cx = this.c.mulf(t);
        return ax.add(bx).add(cx).add(this.d);
    }
}

function renderSpline(canvas: Canvas, points: Vec2[]) {
    // TODO: what if any of the points are undefined??
    // FIXME: there's something wrong with our splines!
    let segments = [];
    for (let i = 0; i < points.length - 3; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const p2 = points[i + 2];
        const p3 = points[i + 3];
        const segment = new SplineSegment(p0, p1, p2, p3, 0, 0.5);
        segments.push(segment);
    }

    for (const segment of segments) {
        let previous = segment.interpolate(0);
        for (let t = 0; t <= 1; t += 0.05) {
            const point = segment.interpolate(t);
            canvas.drawLine(point, previous, "#0000ff", 3);
            previous = point;
        }
    }

    for (const point of points) {
        canvas.drawPoint(point, 3, "#ff0000");
    }
}

function renderExpressions(canvas: Canvas) {
    renderGraphBackground(canvas);
    // TODO: expressions should be different colors
    // TODO; cache points
    for (const expression of expressions) {
        if (expression.values.length == 0)
            continue; // Empty expression
        const points = getExpressionPoints(canvas, expression);
        renderSpline(canvas, points);
    }
}

function handleInput(event: KeyboardEvent, canvas: Canvas) {
    const element = event.target as HTMLInputElement;
    const index = Number(element.id);
    try {
        expressions[index] = new Expression(element.value);
        element.classList.remove("bad-input");
        // TODO: make this faster. we're rerendering the whole graph and all the
        //       expressions on every keystroke. can we be more efficient?
        renderExpressions(canvas);
    } catch (error) {
        element.classList.add("bad-input");
    }
}

function addInputExpression(canvas: Canvas) {
    const list = document.getElementById("expressions")!;
    const newInput = document.createElement("input");
    newInput.onkeyup = (event) => handleInput(event, canvas);
    newInput.id = `${expressions.length}`;
    expressions.push(new Expression(""));
    list.appendChild(newInput);
}

function handleScroll(event: WheelEvent) {
    // TODO: render the expression and graph at different zoom levels
    event.preventDefault();
    console.log(event.deltaY);
}

window.onload = () => {
    const canvasElement = document.getElementsByTagName("canvas")[0]!;
    const canvas = new Canvas(canvasElement, 1100, 700);
    canvasElement.onwheel = (event) => handleScroll(event);

    const button = document.getElementById("add")!;
    button.onclick = () => addInputExpression(canvas);

    addInputExpression(canvas);
    renderExpressions(canvas);
}

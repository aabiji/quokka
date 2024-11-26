import { Canvas, Vec2 } from "./canvas.ts";
import { Expression } from "./lib/eval.ts";

// TODO: completely refactor everything

let size = 60; // tile size
let step = 1; // Increment the labels by `step` units each time
let expressions: Expression[] = [];

function randomColor(): string {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
}

// TODO: better scientific notation
function formatNum(x: number) {
    if (x > 10_000 || x < -0.0001) return x.toExponential();
    return x;
}

// Render the labels for the x and y axis
function renderAxisLabels(canvas: Canvas, x: number, y: number) {
    const [h, c] = [15, "#000000"];
    const labelX = formatNum(x * step);
    const labelY = formatNum(y * step);

    if (x == 0 && y == 0) {
        canvas.drawText("0", canvas.pos(0.2, 0.4, size), h, c);
    }

    if (x != 0) {
        canvas.drawText(`${labelX}`, canvas.pos(x, 0.4, size), h, c);
        canvas.drawText(`-${labelX}`, canvas.pos(-x, 0.4, size), h, c);
    }

    if (y != 0) {
        canvas.drawText(`-${labelY}`, canvas.pos(0.2, y, size), h, c);
        canvas.drawText(`${labelY}`, canvas.pos(0.2, -y, size), h, c);
    }
}

function renderBackground(canvas: Canvas) {
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
            const onAxis = x == 0 || y == 0;
            const onExtremity = x == numTilesX - 1 || y == numTilesX - 1;
            if (onAxis && !onExtremity) renderAxisLabels(canvas, x, y);
        }
    }

    // Draw horizantal and vertical axes
    canvas.drawLine(new Vec2(cx, 0), new Vec2(cx, canvas.height), black, 2);
    canvas.drawLine(new Vec2(0, cy), new Vec2(canvas.width, cy), black, 2);
}

// TODO: we shouldn't need canvas here
function samplePoints(canvas: Canvas, expression: Expression): Vec2[] {
    const maxX = Math.ceil(canvas.centerX / size) + 1;

    // For points on the left and right of the vertical axis
    let keepPlotting = [true, true];
    let points: Vec2[][] = [[], []];

    // Calculate points from the center outwards
    for (let i = 0; i < maxX * step; i += step) {
        const values = i == 0 ? [i] : [-i, i];

        // Find point on the left (-x) and on the right (x)
        for (let j = 0; j < values.length; j++) {
            if (!keepPlotting[j]) continue;

            const x = values[j];
            expression.variables["x"] = x;
            const y = expression.evaluate();

            // if we zoom in, the rendered graph should be more spaced apart
            // if we zoom out, the rendered graph should be spaced in
            const position = canvas.pos(x, -y, size * (1 / step));
            points[j].push(position);

            // Stop plotting in the current direction (left or right) when
            // the on screen x or y position is outside the viewing range
            //if (!canvas.visible(position)) keepPlotting[j] = false;
        }
    }

    // Return points from the left quadrant to the right quadrant in order
    return [...points[0].reverse(), ...points[1]];
}

// Use the Catmull-Rom algorithm to interpolate
// a spline that passes through all of our points.
// t is the measure of how far along we are along
// our spline. For example, if t = 3.15, we are 15%
// along our 3rd cubic bezier curve
// These are good explanations of the algorithm:
// https://www.youtube.com/watch?v=9_aJGUTePYo
// https://en.wikipedia.org/wiki/Centripetal_Catmull%E2%80%93Rom_spline
function interpolateSpline(points: Vec2[], t: number): Vec2 {
    // Point indexes
    const p1 = Math.floor(t) + 1;
    const p2 = p1 + 1;
    const p3 = p2 + 1;
    const p0 = p1 - 1;

    // Make t be between 0 and 1
    t = t - Math.floor(t);

    // Calculate the influences for the 4 control points
    const t2 = t * t;
    const t3 = t * t * t;
    const q0 = -t3 + 2 * t2 - t;
    const q1 = 3 * t3 - 5 * t2 + 2;
    const q2 = -3 * t3 + 4 * t2 + t;
    const q3 = t3 - t2;

    // Calculate x and y based on the 4 control point influences
    const x = points[p0].x * q0 + points[p1].x * q1 + points[p2].x * q2 + points[p3].x * q3;
    const y = points[p0].y * q0 + points[p1].y * q1 + points[p2].y * q2 + points[p3].y * q3;
    return new Vec2(x * 0.5, y * 0.5);
}

// TODO: this falls apart with the expression `xxx` and the step is 5
function renderSpline(canvas: Canvas, points: Vec2[], color: string) {
    // To interpolate k points, we need k + 2 points since we
    // won't draw the spline through the first and last points
    points.splice(0, 0, points[0]);
    points.push(points[points.length - 1]);
    const maxT = points.length - 3;

    let previousPoint = interpolateSpline(points, 0);
    for (let t = 0; t < maxT; t += 0.05) {
        const point = interpolateSpline(points, t);
        canvas.drawLine(point, previousPoint, color, 3);
        previousPoint = point;
    }
}

function renderExpressions(canvas: Canvas) {
    // TODO; cache points
    renderBackground(canvas);
    for (const expression of expressions) {
        if (expression.values.length == 0)
            continue; // Empty expression
        const points = samplePoints(canvas, expression);
        // TODO; colors should stay constant
        renderSpline(canvas, points, randomColor());
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

function handleScroll(event: WheelEvent, canvas: Canvas) {
    event.preventDefault();

    // TODO our floating point arithmetic with `step is problematic`
    // Go through the sequence of the multiples of 1, 2 and 5
    // Ex: 1, 2, 5, 10, 20, 50, 100, 200, 500, ...
    const digit = step.toString()[0];
    const factor = digit == '2' ? 2.5 : 2;

    const direction = event.deltaY < 0 ? -1 : 1;
    size += 10 * direction;

    if (size < 40) {
        size = 100;
        step *= factor;
    }
    if (size > 100) {
        size = 40;
        step /= factor;
    }

    renderBackground(canvas);
    renderExpressions(canvas);
}

window.onload = () => {
    const canvasElement = document.getElementsByTagName("canvas")[0]!;
    const canvas = new Canvas(canvasElement, 1100, 700);
    canvasElement.onwheel = (event) => handleScroll(event, canvas);

    const button = document.getElementById("add")!;
    button.onclick = () => addInputExpression(canvas);

    addInputExpression(canvas);
    renderExpressions(canvas);
}

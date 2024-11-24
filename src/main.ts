import { Canvas } from "./canvas.ts";
import { Expression } from "./lib/eval.ts";
import { Vec2 } from "./vector.ts";

const size = 45; // tile size
let expressions: Expression[] = [];

function randomColor(): string {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
}

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
    renderGraphBackground(canvas);
    for (const expression of expressions) {
        if (expression.values.length == 0)
            continue; // Empty expression
        const points = getExpressionPoints(canvas, expression);
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

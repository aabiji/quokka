import { Canvas } from "./canvas.ts";
import { Expression } from "./lib/eval.ts";

const size = 45; // tile size
let expressions: Expression[] = [];

function renderGraph(canvas: Canvas) {
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
            const [left, right] = [cx - x * size, cx + x * size];
            const [top, bottom] = [cy - y * size, cy + y * size];
            canvas.drawRect(left, top, size, size, gray);
            canvas.drawRect(right, top, size, size, gray);
            canvas.drawRect(right, bottom, size, size, gray);
            canvas.drawRect(left, bottom, size, size, gray);

            // Draw the horizantal and vertical axis labels
            if (x != numTilesX - 1 && y != numTilesY - 1 && x != 0 && y != 0) {
                canvas.drawText(`${x}`, right - 10, cy + 15, 15, black);
                canvas.drawText(`-${x}`, left - 10, cy + 15, 15, black);
                canvas.drawText(`${y}`, cx + 8, top + 5, 15, black);
                canvas.drawText(`-${y}`, cx + 8, bottom + 5, 15, black);
            }
        }
    }

    // Draw horizantal and vertical axes
    canvas.drawLine(cx, 0, cx, canvas.height, black, 2);
    canvas.drawLine(0, cy, canvas.width, cy, black, 2);
}

// TODO: draw a smooth line through our set of points
function graphExpression(canvas: Canvas, expression: Expression) {
    const [cx, cy] = [canvas.centerX, canvas.centerY];
    const numTilesX = Math.ceil(canvas.centerX / size) + 1;
    let keepPlotting = [true, true];
    let prevX = [0, 0];
    let prevY = [0, 0];

    // Plot the expression from the center outwards
    for (let i = 0; i < numTilesX; i++) {
        const values = [-i, i];
        // Plot on the left (-x) and on the right (x)
        for (let j = 0; j < values.length; j++) {
            if (!keepPlotting[j]) continue;

            const x = values[j];
            expression.variables["x"] = x;
            const y = expression.evaluate();

            const x1 = cx + x * size;
            const y1 = cy - y * size;

            // Stop plotting in the current direction (left or right) when
            // the on screen x or y position is outside the viewing range
            if (x1 < 0 || y1 < 0 || x1 > canvas.width || y1 > canvas.height)
                keepPlotting[j] = false;

            const x2 = x == 0 ? x1 : cx + prevX[j] * size;
            const y2 = x == 0 ? y1 : cy - prevY[j] * size;
            canvas.drawLine(x1, y1, x2, y2, "#0000ff", 2);
            prevX[j] = x;
            prevY[j] = y;
        }
    }
}

function renderExpressions(canvas: Canvas) {
    renderGraph(canvas);
    // TODO: expressions should be different colors
    for (const expression of expressions) {
        if (expression.values.length == 0)
            continue; // Empty expression
        graphExpression(canvas, expression);
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

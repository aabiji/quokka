import { Expression, EmptyExpression } from "./lib/eval.ts";

class Canvas {
    width: number;
    height: number;
    centerX: number;
    centerY: number;
    ctx: CanvasRenderingContext2D;

    constructor(element: HTMLCanvasElement, width: number, height: number) {
        this.width = width * window.devicePixelRatio;
        this.height = height * window.devicePixelRatio;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;

        element.width = this.width;
        element.height = this.height;
        element.style.width = `${width}px`;
        element.style.height = `${height}px`;
        this.ctx = element.getContext("2d")!;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    drawLine(
        x1: number, y1: number, x2: number,
        y2: number, color: string, thickness: number
    ) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = thickness;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    drawSquare(x: number, y: number, size: number, color: string) {
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.rect(x, y, size, size);
        this.ctx.stroke();
    }

    drawText(text: string, x: number, y: number, color: string, size: number) {
        this.ctx.font = `normal normal ${size}px Arial`;
        this.ctx.textAlign = "center";
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
    }
}

const size = 45; // tile size
let zoom = 1.0; // TODO; render the expression at different zoom levels

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
            canvas.drawSquare(left, top, size, gray);
            canvas.drawSquare(right, top, size, gray);
            canvas.drawSquare(right, bottom, size, gray);
            canvas.drawSquare(left, bottom, size, gray);

            // Draw the horizantal and vertical axis labels
            if (x != numTilesX - 1 && y != numTilesY - 1 && x != 0 && y != 0) {
                canvas.drawText(`${x}`, right, cy + 15, black, 15);
                canvas.drawText(`-${x}`, left, cy + 15, black, 15);
                canvas.drawText(`${y}`, cx + 8, top + 5, black, 15);
                canvas.drawText(`-${y}`, cx + 8, bottom + 5, black, 15);
            }
        }
    }

    // Draw horizantal and vertical axes
    canvas.drawLine(cx, 0, cx, canvas.height, black, 2);
    canvas.drawLine(0, cy, canvas.width, cy, black, 2);
}

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

function handleInput(canvas: Canvas, event: KeyboardEvent) {
    const element = event.target as HTMLInputElement;
    try {
        renderGraph(canvas);
        graphExpression(canvas, new Expression(element.value));
        element.classList.remove("bad-input");
    } catch (error) {
        if (!(error instanceof EmptyExpression))
            element.classList.add("bad-input");
    }
}

function handleScroll(event: WheelEvent) {
    event.preventDefault();
    console.log(event.deltaY);
}

window.onload = () => {
    const canvasElement = document.getElementById("graph")!;
    const canvas = new Canvas(canvasElement as HTMLCanvasElement, 1100, 700);
    canvasElement.onwheel = (event) => handleScroll(event);

    const input = document.getElementsByTagName("input")[0];
    input.onkeyup = (event) => handleInput(canvas, event);

    renderGraph(canvas);
    input.value = "";
}

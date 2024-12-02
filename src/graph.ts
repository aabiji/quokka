import { Canvas } from "./canvas.ts";
import { Expression } from "./lib/eval.ts";
import { Vec2 } from "./math.ts";
import { SplineSegment } from "./spline.ts";

class Context {
    tileSize: number;  // A "tile" is just a square on the grid
    minTileSize: number;
    maxTileSize: number;
    zoomLevel: number; // Scale at which the graph is drawn

    constructor() {
        this.tileSize = 60;
        this.minTileSize = 50;
        this.maxTileSize = 100;
        this.zoomLevel = 1;
    }

    reset() {
        this.zoomLevel = 1;
        this.tileSize = 60;
    }

    zoom(zoomIn: boolean) {
        this.tileSize += 10 * (zoomIn ? 1 : -1);

        // When zooming out, the grid tiles get smaller and smaller until we zoom out
        // The zoom level follows a sequence like 1, 2, 5, 10, 20, 50, 100, 200 ...
        if (this.tileSize < this.minTileSize) {
            this.tileSize = this.maxTileSize;
            const firstDigit = this.zoomLevel.toString()[0];
            this.zoomLevel = firstDigit == '2' ? this.zoomLevel * 2.5 : this.zoomLevel * 2;
        }

        // When zooming in, the tiles get bigger and bigger until we zoom in
        // The zoom level follows a sequence like 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01
        if (this.tileSize > this.maxTileSize) {
            this.tileSize = this.minTileSize;
            this.zoomLevel = Math.floor(this.zoomLevel / 2);
        }

        // Clamp float to 2 decimal places
        this.zoomLevel = Math.round((this.zoomLevel + Number.EPSILON) * 100) / 100;
    }
}

// Format the number in scientific notation if it's too big or too small
function formatNum(x: number): string {
    const exponent = Math.floor(Math.log10(Math.abs(x)));
    const coefficient = x / 10 ** exponent;
    const roundedCo = parseFloat(coefficient.toFixed(3));
    const roundedX = parseFloat(x.toFixed(3));
    if (exponent <= -3 || exponent >= 4)
        return `${roundedCo} • 10^${exponent}`;
    return `${roundedX}`;
}

// TODO: what if we draw this to an offscren canvas
// and only redraw when the graph changes??
export class Background {
    canvas: Canvas;
    ctx: Context;

    constructor(ref: Canvas, context: Context) {
        this.canvas = ref;
        this.ctx = context;
    }

    // Get the number of horizantal tiles in a quadrant
    // and the number of vertical tiles in a quadrant
    private tileCount(): Vec2 {
        const x = Math.ceil(this.canvas.centerX / this.ctx.tileSize) + 1;
        const y = Math.ceil(this.canvas.centerY / this.ctx.tileSize) + 1;
        return new Vec2(x, y);
    }

    // Get the scaled coordinate from the center
    private pos(x: number, y: number): Vec2 {
        let p = new Vec2(0, 0);
        p.x = this.canvas.centerX + x * this.ctx.tileSize;
        p.y = this.canvas.centerY + y * this.ctx.tileSize;
        return p;
    }

    // Draw the grid from the center outwards.
    private drawGrid() {
        const c = this.canvas.darkMode ? "#323333" : "#cabccc";
        const count = this.tileCount();
        for (let y = 0; y < count.y; y++) {
            for (let x = 0; x < count.x; x++) {
                // Draw at top left, top right, bottom left,
                // bottom right of the horizantal and vertical axis
                this.canvas.drawSquare(this.pos(-x, -y), this.ctx.tileSize, c);
                this.canvas.drawSquare(this.pos(x, -y), this.ctx.tileSize, c);
                this.canvas.drawSquare(this.pos(-x, y), this.ctx.tileSize, c);
                this.canvas.drawSquare(this.pos(x, y), this.ctx.tileSize, c);
            }
        }
    }

    // Draw the labels for the x and y axis
    private drawLabels() {
        const h = 15; // font size
        const c = this.canvas.darkMode ? "#ffffff" : "#000000";
        const count = this.tileCount();

        this.canvas.drawText("0", this.pos(0.2, 0.4), h, c);

        // Horizantal axis
        for (let x = 1; x < count.x - 1; x++) {
            const actualX = formatNum(x * this.ctx.zoomLevel);
            this.canvas.drawText(`${actualX}`, this.pos(x, 0.4), h, c);
            this.canvas.drawText(`-${actualX}`, this.pos(-x, 0.4), h, c);
        }

        // Vertical axis
        for (let y = 1; y < count.y - 1; y++) {
            const actualY = formatNum(y * this.ctx.zoomLevel);
            this.canvas.drawText(`-${actualY}`, this.pos(0.2, y), h, c);
            this.canvas.drawText(`${actualY}`, this.pos(0.2, -y), h, c);
        }
    }

    draw() {
        // Draw horizantal and vertical axes
        const c = this.canvas.darkMode ? "#ffffff" : "#000000";
        const [cx, cy] = [this.canvas.centerX, this.canvas.centerY];
        this.canvas.drawLine(new Vec2(cx, 0), new Vec2(cx, this.canvas.height), c, 2);
        this.canvas.drawLine(new Vec2(0, cy), new Vec2(this.canvas.width, cy), c, 2);

        this.drawGrid();
        this.drawLabels();
    }
}

class Plot {
    canvas: Canvas;
    expression: Expression;
    ctx: Context;
    points: Vec2[];
    color: string;
    visible: boolean;

    constructor(
        ref: Canvas,
        expression: Expression,
        context: Context,
        color: string,
    ) {
        this.canvas = ref;
        this.expression = expression;
        this.ctx = context;
        this.color = color;
        this.points = [];
        this.visible = true;
    }

    // Get the position from the center based on the zoom level
    // When zooming in, the points should be more spaced apart
    // When zooming out, the points should be more spaced in
    private pos(x: number, y: number): Vec2 {
        const scaledTilesize = this.ctx.tileSize / (1 * this.ctx.zoomLevel);
        let p = new Vec2(0, 0);
        p.x = this.canvas.centerX + x * scaledTilesize;
        p.y = this.canvas.centerY + y * scaledTilesize;
        return p;
    }

    // Get the on screen coordinates of the plot based on the sampled values
    // TODO: zoom out with an equation plotted to see just how buggy this is
    computePoints() {
        if (this.expression.empty()) return;

        this.points = [];
        const xrange = Math.ceil(this.canvas.centerX / this.ctx.tileSize) + 1;
        const coords = this.expression.sample(-xrange, xrange, this.ctx.zoomLevel);
        for (const coordinate of coords) {
            this.points.push(this.pos(coordinate[0], -coordinate[1]));
        }
    }

    update(input: string) {
        this.expression = new Expression(input);
        this.computePoints();
    }

    draw() {
        if (this.expression.empty() || !this.visible) return;
        let previousPoint = undefined;
        for (let i = 0; i < this.points.length - 3; i++) {
            const segment = new SplineSegment(
                this.points[i],
                this.points[i+1],
                this.points[i+2],
                this.points[i+3],
                0.5
            );
            for (let t = 0; t < 1; t += 0.05) {
                const point = segment.interpolate(t);
                const prev = previousPoint === undefined ? point : previousPoint;
                this.canvas.drawLine(point, prev, this.color, 3);
                previousPoint = point;
            }
        }
    }
}

export class Graph {
    canvas: Canvas;
    ctx: Context;
    bg: Background;
    plots: Plot[];

    constructor(ref: Canvas) {
        this.canvas = ref;
        this.ctx = new Context();
        this.bg = new Background(ref, this.ctx);
        this.plots = [];
    }

    draw() {
        this.canvas.clear();
        this.bg.draw(); // TODO: don't need to draw this unless we're zooming
        for (const plot of this.plots) {
            plot.draw();
        }
    }

    changeZoom(zoomIn: boolean) {
        this.ctx.zoom(zoomIn);
        this.draw();
    }

    resetZoom() {
        this.ctx.reset();
        this.draw();
    }

    addPlot(color: string): number {
        const lengthBefore = this.plots.length;
        const expr = new Expression("");
        this.plots.push(new Plot(this.canvas, expr, this.ctx, color));
        return lengthBefore;
    }
}

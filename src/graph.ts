import { Canvas } from "./canvas.ts";
import { Expression } from "./lib/eval.ts";
import { Vec2 } from "./math.ts";
import { SplineSegment } from "./spline.ts";

function randomColor(): string {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
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
    zoomLevel: number;
    tileSize: number;

    constructor(ref: Canvas, tileSize: number, zoomLevel: number) {
        this.canvas = ref;
        this.zoomLevel = zoomLevel;
        this.tileSize = tileSize;
    }

    // Get the number of horizantal tiles in a quadrant
    // and the number of vertical tiles in a quadrant
    private tileCount(): Vec2 {
        const x = Math.ceil(this.canvas.centerX / this.tileSize) + 1;
        const y = Math.ceil(this.canvas.centerY / this.tileSize) + 1;
        return new Vec2(x, y);
    }

    // Get the scaled coordinate from the center
    private pos(x: number, y: number): Vec2 {
        let p = new Vec2(0, 0);
        p.x = this.canvas.centerX + x * this.tileSize;
        p.y = this.canvas.centerY + y * this.tileSize;
        return p;
    }

    // Draw the grid from the center outwards.
    private drawGrid() {
        const c = "#cabccc";
        const count = this.tileCount();
        for (let y = 0; y < count.y; y++) {
            for (let x = 0; x < count.x; x++) {
                // Draw at top left, top right, bottom left,
                // bottom right of the horizantal and vertical axis
                this.canvas.drawSquare(this.pos(-x, -y), this.tileSize, c);
                this.canvas.drawSquare(this.pos(x, -y), this.tileSize, c);
                this.canvas.drawSquare(this.pos(-x, y), this.tileSize, c);
                this.canvas.drawSquare(this.pos(x, y), this.tileSize, c);
            }
        }
    }

    // Draw the labels for the x and y axis
    private drawLabels() {
        const [h, c] = [15, "#000000"];
        const count = this.tileCount();

        this.canvas.drawText("0", this.pos(0.2, 0.4), h, c);

        // Horizantal axis
        for (let x = 1; x < count.x - 1; x++) {
            const actualX = formatNum(x * this.zoomLevel);
            this.canvas.drawText(`${actualX}`, this.pos(x, 0.4), h, c);
            this.canvas.drawText(`-${actualX}`, this.pos(-x, 0.4), h, c);
        }

        // Vertical axis
        for (let y = 1; y < count.y - 1; y++) {
            const actualY = formatNum(y * this.zoomLevel);
            this.canvas.drawText(`-${actualY}`, this.pos(0.2, y), h, c);
            this.canvas.drawText(`${actualY}`, this.pos(0.2, -y), h, c);
        }
    }

    updateScale(tileSize: number, zoomLevel: number) {
        this.tileSize = tileSize;
        this.zoomLevel = zoomLevel;
    }

    draw() {
        // Draw horizantal and vertical axes
        const [cx, cy, c] = [this.canvas.centerX, this.canvas.centerY, "#000000"];
        this.canvas.drawLine(new Vec2(cx, 0), new Vec2(cx, this.canvas.height), c, 2);
        this.canvas.drawLine(new Vec2(0, cy), new Vec2(this.canvas.width, cy), c, 2);

        this.drawGrid();
        this.drawLabels();
    }
}

class Plot {
    canvas: Canvas;
    tileSize: number;
    zoomLevel: number;
    color: string;
    points: Vec2[];
    expression: Expression;

    constructor(
        ref: Canvas,
        expression: Expression,
        tileSize: number,
        zoomLevel: number
    ) {
        this.canvas = ref;
        this.color = randomColor();
        this.tileSize = tileSize;
        this.zoomLevel = zoomLevel;
        this.expression = expression;
        this.points = [];
    }

    // Get the position from the center based on the zoom level
    // When zooming in, the points should be more spaced apart
    // When zooming out, the points should be more spaced in
    private pos(x: number, y: number): Vec2 {
        const scaledTilesize = this.tileSize / (1 * this.zoomLevel);
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
        const xrange = Math.ceil(this.canvas.centerX / this.tileSize) + 1;
        const coordinates = this.expression.sample(-xrange, xrange, this.zoomLevel);
        for (let i = 0; i < coordinates.length; i++) {
            const coordinate = coordinates[i];
            this.points.push(this.pos(coordinate[0], -coordinate[1]));
        }
    }

    update(input: string, tileSize: number, zoomLevel: number) {
        if (input.length > 0)
            this.expression = new Expression(input);
        this.tileSize = tileSize;
        this.zoomLevel = zoomLevel;
        this.computePoints();
    }

    draw() {
        if (this.expression.empty()) return;
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

// TODO figure out a better way to scale the zoom level
// Cycle through multiples of 1, 2 and 5
// ex: 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50
class Zoom {
    index: number = 0;
    magnitude: number = 0;
    possibleFactors: number[] = [1, 2, 5];

    in() {
        this.index--;
        if (this.index < 0) {
            this.magnitude--;
            this.index = this.possibleFactors.length - 1;
        }
    }

    out() {
        this.index++;
        if (this.index == this.possibleFactors.length) {
            this.index = 0;
            this.magnitude ++;
        }
    }

    // Compute using scientific notation as inspiration to
    // avoid compounding precision errors
    level(): number {
        return this.possibleFactors[this.index] * 10 ** this.magnitude;
    }
}

export class Graph {
    tileSize: number;
    minTileSize: number;
    maxTileSize: number;
    zoom: Zoom;

    canvas: Canvas;
    bg: Background;
    plots: Plot[];

    constructor(ref: Canvas) {
        this.tileSize = 60;
        this.minTileSize = 50;
        this.maxTileSize = 100;
        this.zoom = new Zoom();
        this.plots = [];
        this.canvas = ref;
        this.bg = new Background(ref, this.tileSize, this.zoom.level());
    }

    draw() {
        this.canvas.clear();
        this.bg.draw(); // TODO: don't need to draw this unless we're zooming
        for (const plot of this.plots) {
            plot.draw();
        }
    }

    changeScale(zoomIn: boolean) {
        this.tileSize += 10 * (zoomIn ? 1 : -1);

        // When zooming out, the grid tiles get smaller
        // and smaller until we zoom out
        if (this.tileSize < this.minTileSize) {
            this.tileSize = this.maxTileSize;
            this.zoom.out();
        }

        // When zooming in, the tiles get bigger and
        // bigger until we zoom in
        if (this.tileSize > this.maxTileSize) {
            this.tileSize = this.minTileSize;
            this.zoom.in();
        }

        this.bg.zoomLevel = this.zoom.level();
        this.bg.tileSize = this.tileSize;
        for (let plot of this.plots) {
            plot.update("", this.tileSize, this.zoom.level());
        }

        this.draw();
    }

    addPlot(): number {
        const lengthBefore = this.plots.length;
        const expr = new Expression("");
        const p = new Plot(this.canvas, expr, this.tileSize, this.zoom.level());
        this.plots.push(p);
        return lengthBefore;
    }
}

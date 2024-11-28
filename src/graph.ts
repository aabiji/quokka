import { Canvas } from "./canvas.ts";
import { Expression } from "./lib/eval.ts";
import { Vec2 } from "./math.ts";
import { SplineSegment } from "./spline.ts";

// TODO: move this into utils.ts
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

export class GraphPaper {
    cv: Canvas;
    zoomLevel: number;
    tileSize: number;

    constructor(ref: Canvas, tileSize: number, zoomLevel: number) {
        this.cv = ref;
        this.zoomLevel = zoomLevel;
        this.tileSize = tileSize;
    }

    // Get the number of horizantal tiles in a quadrant
    // and the number of vertical tiles in a quadrant
    private tileCount(): Vec2 {
        const x = Math.ceil(this.cv.centerX / this.tileSize) + 1;
        const y = Math.ceil(this.cv.centerY / this.tileSize) + 1;
        return new Vec2(x, y);
    }

    private pos(x: number, y: number): Vec2 {
        return this.cv.pos(x, y, this.tileSize);
    }

    // Draw the grid from the center outwards.
    private drawGrid() {
        const c = "#cabccc";
        const count = this.tileCount();
        for (let y = 0; y < count.y; y++) {
            for (let x = 0; x < count.x; x++) {
                // Draw at top left, top right, bottom left,
                // bottom right of the horizantal and vertical axis
                this.cv.drawSquare(this.pos(-x, -y), this.tileSize, c);
                this.cv.drawSquare(this.pos(x, -y), this.tileSize, c);
                this.cv.drawSquare(this.pos(-x, y), this.tileSize, c);
                this.cv.drawSquare(this.pos(x, y), this.tileSize, c);
            }
        }
    }

    // Draw the labels for the x and y axis
    private drawLabels() {
        const [h, c] = [15, "#000000"];
        const count = this.tileCount();

        this.cv.drawText("0", this.pos(0.2, 0.4), h, c);

        // Horizantal axis
        for (let x = 1; x < count.x - 1; x++) {
            const actualX = formatNum(x * this.zoomLevel);
            this.cv.drawText(`${actualX}`, this.pos(x, 0.4), h, c);
            this.cv.drawText(`-${actualX}`, this.pos(-x, 0.4), h, c);
        }

        // Vertical axis
        for (let y = 1; y < count.y - 1; y++) {
            const actualY = formatNum(y * this.zoomLevel);
            this.cv.drawText(`-${actualY}`, this.pos(0.2, y), h, c);
            this.cv.drawText(`${actualY}`, this.pos(0.2, -y), h, c);
        }
    }

    draw() {
        // Draw horizantal and vertical axes
        const [cx, cy, c] = [this.cv.centerX, this.cv.centerY, "#000000"];
        this.cv.drawLine(new Vec2(cx, 0), new Vec2(cx, this.cv.height), c, 2);
        this.cv.drawLine(new Vec2(0, cy), new Vec2(this.cv.width, cy), c, 2);

        this.drawGrid();
        this.drawLabels();
    }
}

class Plot {
    cv: Canvas;
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
        this.cv = ref;
        this.color = randomColor();
        this.tileSize = tileSize;
        this.zoomLevel = zoomLevel;
        this.expression = expression;
        this.points = [];
    }

    computePoints() {
        const maxX = Math.ceil(this.cv.centerX / this.tileSize) + 1;
        const values = this.expression.sample(-maxX, maxX, this.zoomLevel);

        this.points = [];
        let previousPoint = new Vec2(-1, -1);
        for (const value of values) {
            // If we zoom in, the rendered graph should be more spaced apart
            // If we zoom out, the rendered graph should be spaced in
            const scale = this.tileSize * (1 / this.zoomLevel);
            const point = this.cv.pos(value[0], -value[1], scale);

            // Include 1 point on both ends (left quadrant
            // and right quadrant) that's invisible
            if (this.cv.visible(point)) {
                if (!this.cv.visible(previousPoint))
                    this.points.push(previousPoint);
                this.points.push(point);
            } else {
                if (this.cv.visible(previousPoint))
                    this.points.push(point);
            }
            previousPoint = point;
        }
    }

    updateExpression(value: string) {
        this.expression = new Expression(value); // TODO; handle error
        this.computePoints();
    }

    draw() {
        if (this.expression.empty()) return;

        // TODO; why are we missing the start and end???
        // To interpolate k points, we need k + 2 points since we
        // won't draw the spline through the first and last points
        const points = [...this.points];

        // TODO: draw connecting lines
        for (let i = 0; i < points.length - 3; i++) {
            const [p0, p1, p2, p3] = [points[i], points[i+1], points[i+2], points[i+3]];
            const segment = new SplineSegment(p0, p1, p2, p3, 0.5);
            for (let t = 0; t < 1; t += 0.01) {
                const point = segment.interpolate(t);
                this.cv.drawPoint(point, 1, "#000000");
            }
        }
    }
}

export class Graph {
    tileSize: number;
    minTileSize: number;
    maxTileSize: number;
    zoomLevel: number;

    cv: Canvas;
    bg: GraphPaper;
    plots: Plot[];

    constructor(ref: Canvas) {
        this.tileSize = 60;
        this.minTileSize = 40;
        this.maxTileSize = 100;
        this.zoomLevel = 1;
        this.plots = [];
        this.cv = ref;
        this.bg = new GraphPaper(ref, this.tileSize, this.zoomLevel);
    }

    draw() {
        this.cv.clear();
        this.bg.draw(); // TODO: don't need to draw this unless we're zooming
        for (const plot of this.plots) {
            plot.draw();
        }
    }

    // direction is either -1 to zoom in our 1 to zoom out
    zoom(direction: number) {
        // TODO: explain logic

        // TODO our floating point arithmetic with `zoomLevel` is problematic
        // Go through the sequence of the multiples of 1, 2 and 5
        // Ex: 1, 2, 5, 10, 20, 50, 100, 200, 500, ...
        const digit = this.zoomLevel.toString()[0];
        const factor = digit == '2' ? 2.5 : 2;

        this.tileSize += 10 * direction;

        if (this.tileSize < this.minTileSize) {
            this.tileSize = this.maxTileSize;
            this.zoomLevel *= factor;
        }

        if (this.tileSize > this.maxTileSize) {
            this.tileSize = this.minTileSize;
            this.zoomLevel /= factor;
        }

        // Update values
        this.bg.tileSize = this.tileSize;
        this.bg.zoomLevel = this.zoomLevel;
        for (let i = 0; i < this.plots.length; i++) {
            this.plots[i].tileSize = this.tileSize;
            this.plots[i].zoomLevel = this.zoomLevel;
            this.plots[i].computePoints();
        }
    }

    addPlot(): number {
        const lengthBefore = this.plots.length;
        const p = new Plot(this.cv, new Expression(""), this.tileSize, this.zoomLevel);
        this.plots.push(p);
        return lengthBefore;
    }
}

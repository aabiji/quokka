import { Vec2 } from "./math.ts";

export class Canvas {
    width: number;
    height: number;
    centerX: number;
    centerY: number;
    element: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    darkMode: boolean;

    constructor(
        element: HTMLCanvasElement,
        width: number,
        height: number,
        theme: boolean,
    ) {
        this.element = element;
        this.width = this.height = this.centerX = this.centerY = 0;
        this.ctx = element.getContext("2d", { alpha: false })!;
        this.resize(width, height);
        this.darkMode = theme;
    }

    resize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.centerX = Math.floor(width / 2);
        this.centerY = Math.floor(height / 2);

        const dpr = window.devicePixelRatio;
        this.element.width = width * dpr;
        this.element.height = height * dpr;
        this.element.style.width = `${width}px`;
        this.element.style.height = `${height}px`;
        this.ctx.scale(dpr, dpr);
    }

    clear() {
        this.ctx.beginPath();
        this.ctx.fillStyle = this.darkMode ? "#000000" : "#ffffff";
        this.ctx.rect(0, 0, this.width, this.height);
        this.ctx.fill();
    }

    drawLine(p1: Vec2, p2: Vec2, color: string, thickness: number) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = thickness;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();
    }

    drawSquare(position: Vec2, size: number, color: string) {
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.rect(position.x, position.y, size, size);
        this.ctx.stroke();
    }

    drawPoint(position: Vec2, size: number, color: string) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(position.x, position.y, size, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    // TODO: Instead of using the canvas api to draw text, we should directly
    // position text using DOM nodes so We do this so that accessibility
    // can be handled by the browser and so that the text is rendered better.
    // However, doing this is slow. So, what's a fast and accessible way to render text?
    drawText(text: string, position: Vec2, size: number, color: string) {
        this.ctx.font = `normal normal ${size}px Arial`;
        this.ctx.fillStyle = color;

        // Center the text
        const metrics = this.ctx.measureText(text);
        const height =
            metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        position.x -= metrics.width / 2;
        position.y += height / 2;

        this.ctx.fillText(text, position.x, position.y);
    }
}


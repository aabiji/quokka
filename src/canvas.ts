
export class Canvas {
    width: number;
    height: number;
    centerX: number;
    centerY: number;
    ctx: CanvasRenderingContext2D;

    constructor(element: HTMLCanvasElement, width: number, height: number) {
        const dpr = window.devicePixelRatio;
        this.width = width;
        this.height = height;
        this.centerX = Math.floor(width / 2);
        this.centerY = Math.floor(height / 2);

        element.width = width * dpr;
        element.height = height * dpr;
        element.style.width = `${width}px`;
        element.style.height = `${height}px`;

        this.ctx = element.getContext("2d", { alpha: false })!;
        this.ctx.scale(dpr, dpr);
    }

    clear() {
        this.ctx.beginPath();
        this.ctx.fillStyle = "#ffffff";
        this.ctx.rect(0, 0, this.width, this.height);
        this.ctx.fill();
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

    drawRect(x: number, y: number, w: number, h: number, color: string) {
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.rect(x, y, w, h);
        this.ctx.stroke();
    }

    // TODO: Instead of using the canvas api to draw text, we should directly
    // position text using DOM nodes so We do this so that accessibility
    // can be handled by the browser and so that the text is rendered better.
    // However, doing this is slow. So, what's a fast and accessible way to render text?
    drawText(text: string, x: number, y: number, size: number, color: string) {
        this.ctx.font = `normal normal ${size}px Arial`;
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
    }
}


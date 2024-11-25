
export class Vec2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

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

    drawLine(p1: Vec2, p2: Vec2, color: string, thickness: number) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = thickness;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();
    }

    drawRect(position: Vec2, w: number, h: number, color: string) {
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.rect(position.x, position.y, w, h);
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
        this.ctx.fillText(text, position.x, position.y);
    }

    // Get the position from the center of the canvas
    pos(x: number, y: number, step: number): Vec2 {
        let p = new Vec2(0, 0);
        p.x = this.centerX + x * step;
        p.y = this.centerY + y * step;
        return p;
    }

    // Return true if the position is within the canvas viewing range
    visible(p: Vec2): boolean {
        return p.x >= 0 && p.y >= 0 && p.x <= this.width && p.y <= this.height;
    }
}


import { Expression, EmptyExpression } from "./lib/eval.ts";

function resetGraph(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.canvas.width = width;
    ctx.canvas.height = height;
    ctx.strokeStyle = "#737272";
    ctx.fillStyle = "blue";
    ctx.clearRect(0, 0, width, height);

    // Vertical axis
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    // Horizantal axis
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
}

// TODO: draw the entire parabola when we have x ^ 2
// TODO: xx is interpreted as 2 ^ x when it should be x ^ 2
// TODO: draw tiles that are gap x gap
// TODO: show x and y on hover, show intersections on click
// TODO: zoom in and out
function graphExpression(ctx: CanvasRenderingContext2D, expression: Expression) {
    const [w, h] = [ctx.canvas.width, ctx.canvas.height];
    const gap = 10; // Gap between each point
    const halfRange = Math.round(w / gap / 2);
    const [startX, endX] = [-halfRange, halfRange];

    let previousX = undefined;
    let previousY = undefined;

    // Plot the points
    for (let x = startX; x < endX; x++) {
        expression.variables["x"] = x;
        const y = expression.evaluate();
        const xpos = w / 2 + x * gap;
        const ypos = h / 2 - y * gap;

        // TODO: maybe we tweak startX and endX so that we don't have to do this
        if (xpos < 0 || ypos < 0 || xpos > w || ypos > h) {
            previousX = xpos;
            previousY = ypos;
            continue; // Not visible
        }

        ctx.beginPath();
        ctx.moveTo(xpos, ypos);
        ctx.lineTo(
            previousX == undefined ? xpos : previousX,
            previousY == undefined ? ypos : previousY
        );
        ctx.stroke();
        previousX = xpos;
        previousY = ypos;
    }
}

function handleInput(ctx: CanvasRenderingContext2D, event: KeyboardEvent) {
    const element = event.target as HTMLInputElement;
    try {
        resetGraph(ctx, 1100, 700);
        graphExpression(ctx, new Expression(element.value));
        element.classList.remove("bad-input");
    } catch (error) {
        if (!(error instanceof EmptyExpression))
            element.classList.add("bad-input");
    }
}

window.onload = () => {
    const canvas = document.getElementsByTagName("canvas")[0];
    const ctx = canvas.getContext("2d")!;
    resetGraph(ctx, 1100, 700);

    const input = document.getElementsByTagName("input")[0];
    input.onkeyup = (event) => handleInput(ctx, event);
    input.value = "";
}

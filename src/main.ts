import { Canvas } from "./canvas.ts";
import { Graph } from "./graph.ts";

/*
Things to explore:
- Replace button text with actual icons
- FIX: plotting gets slower because the x sampling range is wrong
(we should be using the zoom level)
- Panning around the graph with the mouse
We'll need to change to be albe to change the origin
- Improve drawing of labels when they're in scientific notation
- Do we really need to pass in tileSize and zoomLevel into the subclasses?
Simplify, simplify, simpplify
- Fix buggy spline drawing. Try to understand fast Catmull-Rom again
- Observe how desmos scales its labels and rework our implementation
- Only redraw the graph background when it changes
  Could maybe render the background to an offscreen canvas
- Use MathJax to render math expression
- Parse equations: y = ... or x + y = 0 or v = 10 or equations like that
- Parse functions like sin, cos, tan, sqrt, log
*/

let graph: Graph;
let canvas: Canvas;

function handleInput(event: KeyboardEvent) {
    const element = event.target as HTMLInputElement;
    const index = Number(element.id);
    try {
        graph.plots[index].update(element.value, graph.tileSize, graph.zoom.level());
        graph.draw();
    } catch (error) {
        element.classList.add("bad-input");
    }
}

function addInputExpression() {
    const list = document.getElementById("expressions")!;
    const newInput = document.createElement("input");
    newInput.onkeyup = (event) => handleInput(event);
    newInput.id = `${graph.addPlot()}`;
    list.appendChild(newInput);
}

function handleScroll(event: WheelEvent) {
    event.preventDefault();
    graph.changeZoom(event.deltaY < 0 ? true : false);
}

function toggleTheme() {
    let body = document.getElementsByTagName("body")[0];
    const before = body.style.colorScheme;
    body.style.colorScheme = before == "light" ? "dark" : "light";
}

window.onload = () => {
    const canvasElement = document.getElementsByTagName("canvas")[0]!;
    canvasElement.onwheel = (event) => handleScroll(event);

    const canvasX = canvasElement.getBoundingClientRect().left;
    canvas = new Canvas(canvasElement, window.innerWidth - canvasX, window.innerHeight);
    graph = new Graph(canvas);

    const add = document.getElementById("add")!;
    add.onclick = () => addInputExpression();

    const zoomIn = document.getElementById("zoom-in")!;
    zoomIn.onclick = () => graph.changeZoom(true);

    const zoomOut = document.getElementById("zoom-out")!;
    zoomOut.onclick = () => graph.changeZoom(false);

    const zoomReset = document.getElementById("zoom-reset")!;
    zoomReset.onclick = () => graph.resetZoom();

    const toggle = document.getElementById("theme-toggle")!;
    toggle.onclick = () => toggleTheme();

    //addInputExpression();
    graph.draw();
}

import { Canvas } from "./canvas.ts";
import { Graph } from "./graph.ts";

let graph: Graph;
let canvas: Canvas;

function handleInput(event: KeyboardEvent) {
    const element = event.target as HTMLInputElement;
    const index = Number(element.id);
    try {
        graph.plots[index].updateExpression(element.value);
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
    const direction = event.deltaY < 0 ? -1 : 1;
    graph.zoom(direction);
    graph.draw();
}

window.onload = () => {
    const canvasElement = document.getElementsByTagName("canvas")[0]!;
    canvas = new Canvas(canvasElement, 1100, 700);
    canvasElement.onwheel = (event) => handleScroll(event);

    const button = document.getElementById("add")!;
    button.onclick = () => addInputExpression();

    graph = new Graph(canvas);
    addInputExpression();
    graph.draw();
}

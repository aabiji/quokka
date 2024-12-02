import { Canvas } from "./canvas.ts";
import { Graph } from "./graph.ts";

/*
Things to explore:
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
let parser: DOMParser;

// TODO: only generate easily visible colors
// (also take theme into account)
function randomColor(): string {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
}

function handleInput(event: KeyboardEvent) {
    const element = event.target as HTMLInputElement;
    const index = Number(element.id);
    try {
        graph.plots[index].update(element.value, graph.tileSize, graph.zoom.level());
        graph.draw();
        element.parentElement!.classList.remove("bad-input");
    } catch (error) {
        element.parentElement!.classList.add("bad-input");
    }
}

function addInputExpression() {
    const color = randomColor();
    const index = graph.addPlot(color);

    const html = `
        <div class="expression">
            <div class="selector-background">
                <input type="checkbox" class="selector"/>
            </div>
            <input type="text" class="expression-input"/>
            <button class="close"><img src="/icons/close.svg"/></button>
        </div>
    `;
    const doc = parser.parseFromString(html, "text/html");
    let div = doc.getElementsByTagName("div")[0];

    let input = div.getElementsByClassName("expression-input")[0] as HTMLElement;
    input.onkeyup = (event) => handleInput(event);
    input.id = `${index}`;

    let checkbox = div.getElementsByClassName("selector")[0] as HTMLInputElement;
    checkbox.checked = true;
    checkbox.style.backgroundColor = checkbox.checked ? color : "";
    checkbox.onchange = () => {
        checkbox.style.backgroundColor = checkbox.checked ? color : "";
        graph.plots[index].visible = checkbox.checked;
        graph.draw();
    };

    const button = div.getElementsByClassName("close")[0] as HTMLElement;
    button.onclick = () => {
        graph.plots.slice(index, 1);
        div.remove();
    }

    document.getElementById("expressions")!.appendChild(div);
}

function handleScroll(event: WheelEvent) {
    event.preventDefault();
    graph.changeZoom(event.deltaY < 0 ? true : false);
}

function toggleTheme(event: MouseEvent) {
    // Change css to dark mode
    let body = document.getElementsByTagName("body")[0];
    const before = body.style.colorScheme;
    body.style.colorScheme = before == "" || before == "light" ? "dark" : "light";
    const after = body.style.colorScheme;

    // Change the theme toggle icon
    const src = after == "light" ? "/icons/moon.svg" : "/icons/sun.svg";
    (event.target! as HTMLImageElement).src = src;

    // Change icon colors
    const blackFilter =
        "invert(0%) sepia(100%) saturate(7500%) hue-rotate(328deg) brightness(89%) contrast(114%)";
    const whiteFilter =
        "invert(94%) sepia(4%) saturate(0%) hue-rotate(89deg) brightness(112%) contrast(73%)";
    let images = document.getElementsByTagName("img");
    for (let img of images) {
        console.log(img);
        img.style.filter = after == "light" ? blackFilter : whiteFilter;
    }

    // Change canvas theme
    canvas.darkMode = after == "light" ? false : true;
    graph.draw();
}

window.onresize = () => {
    const canvasElement = document.getElementsByTagName("canvas")[0]!;
    const canvasX = canvasElement.getBoundingClientRect().x;
    canvas.resize(window.innerWidth - canvasX, window.innerHeight)
    graph.draw();
}

window.onload = () => {
    const canvasElement = document.getElementsByTagName("canvas")[0]!;
    canvasElement.onwheel = (event) => handleScroll(event);

    const canvasX = canvasElement.getBoundingClientRect().left;
    const [width, height] = [window.innerWidth - canvasX, window.innerHeight];
    canvas = new Canvas(canvasElement, width, height, false);
    graph = new Graph(canvas);

    document.getElementById("add")!.onclick = () => addInputExpression();
    document.getElementById("zoom-in")!.onclick = () => graph.changeZoom(true);
    document.getElementById("zoom-out")!.onclick = () => graph.changeZoom(false);
    document.getElementById("zoom-reset")!.onclick = () => graph.resetZoom();
    document.getElementById("theme-toggle")!.onclick = (event) => toggleTheme(event);

    parser = new DOMParser();
    addInputExpression();
    graph.draw();
}

import { Canvas } from "./canvas.ts";
import { Graph } from "./graph.ts";

// TODO: pan around the graph with the mouse
// TODO: correct graph axis position relative to zoom (look at desmos for inspiration)

let graph: Graph;
let canvas: Canvas;
let parser: DOMParser;

function resizeCanvas() {
    const canvasElement = document.getElementsByTagName("canvas")[0]!;
    const canvasX = canvasElement.getBoundingClientRect().x;
    canvas.resize(window.innerWidth - canvasX, window.innerHeight);
    graph.draw(true);
}

// Generate random colors that have full saturation
function randomColor(): string {
    const h = Math.floor(Math.random() * 360);
    return `hsl(${h}, 100%, 50%)`;
}

function handleInput(event: KeyboardEvent) {
    const element = event.target as HTMLInputElement;
    const index = Number(element.id);
    try {
        graph.plots[index].update(element.value);
        graph.draw();
        element.parentElement!.classList.remove("bad-input");
    } catch (error) {
        element.parentElement!.classList.add("bad-input");
    }
}

function removePlot(event: MouseEvent) {
    const parent = (event.target as HTMLElement).parentElement!.parentElement!; // FIXME!
    const inputElement = parent.querySelector("input[type=text]")!;
    const index = Number(inputElement.id);

    graph.plots.splice(index, 1);
    graph.draw();

    // Adjust subsequent input ids
    // TODO: come up with a better id scheme so we don't have to do this
    const inputs = document.querySelectorAll("input[type=text]");
    for (let element of inputs) {
        const numId = Number(element.id);
        if (numId > index) element.id = `${numId - 1}`;
    }
    parent.remove();
}

// TODO: make this less messy
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
    button.onclick = (event) => removePlot(event);

    document.getElementById("expressions")!.appendChild(div);
}

function handleScroll(event: WheelEvent) {
    event.preventDefault();
    graph.changeZoom(event.deltaY < 0 ? 1 : -1);
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
        img.style.filter = after == "light" ? blackFilter : whiteFilter;
    }

    // Change canvas theme
    canvas.darkMode = after == "light" ? false : true;
    graph.draw();
}

function toggleSidebar() {
    let button = document.getElementById("hide")!;
    let img = button.firstChild as HTMLImageElement;
    let sidebar = document.getElementsByClassName("sidebar")[0];
    let controls = sidebar.getElementsByClassName("controls")[0];
    const visible = !sidebar.classList.contains("hidden-sidebar");

    sidebar.classList.toggle("hidden-sidebar");
    resizeCanvas();

    if (visible) {
        controls.removeChild(button);
        img.src = "/icons/double-angle-right.svg";
        button.classList.add("show");
        document.body.prepend(button);
    } else {
        document.body.removeChild(button);
        button.classList.remove("show");
        img.src = "/icons/double-angle-left.svg";
        controls.appendChild(button);
    }
}

window.onresize = () => resizeCanvas();

window.onload = () => {
    const canvasElement = document.getElementsByTagName("canvas")[0]!;
    canvasElement.onwheel = (event) => handleScroll(event);

    const canvasX = canvasElement.getBoundingClientRect().left;
    const [width, height] = [window.innerWidth - canvasX, window.innerHeight];
    canvas = new Canvas(canvasElement, width, height, false);
    graph = new Graph(canvas);

    document.getElementById("add")!.onclick = () => addInputExpression();
    document.getElementById("zoom-in")!.onclick = () => graph.changeZoom(1);
    document.getElementById("zoom-out")!.onclick = () => graph.changeZoom(-1);
    document.getElementById("zoom-reset")!.onclick = () => graph.changeZoom(0);
    document.getElementById("theme-toggle")!.onclick = (event) => toggleTheme(event);
    document.getElementById("hide")!.onclick = () => toggleSidebar();

    parser = new DOMParser();
    addInputExpression();
    graph.draw();
}

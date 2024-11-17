import { parse } from "./lib/parser.ts";

function processMathInput(value: string) {
    const tree = parse(value, true);
    const element = document.getElementById("debugInfo")!;
    const content = tree === undefined ? "" : JSON.stringify(tree, null, 4);
    element.textContent = content;
}

function handleInput(event: KeyboardEvent) {
    const element = event.target as HTMLInputElement;
    try {
        processMathInput(element.value);
        element.classList.remove("bad-input");
    } catch (error) {
        element.classList.add("bad-input");
        document.getElementById("debugInfo")!.textContent = "";
    }
}

window.onload = () => {
    const input = document.getElementsByTagName("input")[0];
    input.value = "";
    input.onkeyup = (event) => handleInput(event);
}

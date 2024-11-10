function processMathInput(value: string) {
    console.log(value);
}

window.onload = () => {
    const input = document.getElementsByTagName("input")[0];
    input.onkeyup = (event) => {
        if (event.key == "Enter") {
            event.preventDefault();
            processMathInput((event.target as HTMLInputElement).value);
        }
    }
}

class CalcEditor {
    constructor(rootEl, app, content) {
        this.rootEl = rootEl;
        this.rootEl.className = "calcEditorContainer";
        this.app = app;

        this.scrollArea = document.createElement('div');
        this.scrollArea.className = "calcEditorScroll";
        this.rootEl.append(this.scrollArea);

        this.textarea = document.createElement('textarea');
        this.textarea.className = "calcArea";
        this.textarea.id = "calcInputArea";
        this.scrollArea.append(this.textarea);
        this.textarea.focus();

        this.responseArea = document.createElement('div');
        this.responseArea.className = "calcArea";
        this.responseArea.id = "responseArea";
        this.responseArea.disabled = true;
        this.scrollArea.append(this.responseArea);

        this.textarea.addEventListener("input", () => {
            this.adjustHeight();
            this.render();

            let filename = this.app.selectedFilename;
            let filedata = this.textarea.value;

            if (this.saveTimer) clearTimeout(this.saveTimer);
            this.saveTimer = setTimeout(() => {
                this.app.storage.writeFile(filename, filedata);
            }, this.app.storage.saveTimer);
        }, false);

        this.textarea.value = content;
        this.adjustHeight();
        this.render();
    }
    adjustHeight() {
        this.textarea.style.height = 0;
        this.textarea.style.height = (this.textarea.scrollHeight) + "px";
        this.scrollArea.style.height = (this.textarea.scrollHeight) + "px";
    }
    render() {
        let input = this.textarea.value;
        let fcalEngine = new fcal.Fcal();

        let Lines = input.split('\n');
        let Results = [];

        Lines.forEach(line => {
            let output, resultLine;

            if (line.charAt(0) == "#") {
                resultLine = "<p class='response_emphasis'>" + line.slice(1).trim() + "</p>";
            } else if (line.length == 0) {
                resultLine = "<p>&nbsp;</p>";
            } else {
                try {
                    output = fcalEngine.evaluate(line.toString()).toFormat();
                    resultLine = "<p>" + output.replace(/(\d+\.\d\d\d)\d*/, function ($0, $1) { return Math.round($1 * 100) / 100; }) + "</p>";
                } catch (e) {
                    resultLine = "Woops";
                    console.error(e);
                }
            }

            Results.push(resultLine);
        });

        this.responseArea.innerHTML = Results.join("\n");
    };
}

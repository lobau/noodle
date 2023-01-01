class TodoEditor {
    constructor(rootEl, app, content) {
        this.rootEl = rootEl;
        this.rootEl.className = "todoEditor";
        this.app = app;
        this.data = content;

        this.view = document.createElement('div');
        this.view.className = "todoEditorScroll";
        this.rootEl.append(this.view);

        this.newItemRow = document.createElement('div');
        this.newItemRow.className = "newItemRow";
        this.view.append(this.newItemRow);

        this.newItemInput = document.createElement('input');
        this.newItemInput.type = "text";
        this.newItemInput.className = "todoEntry";
        this.newItemInput.placeholder = "todo +project @context";
        this.newItemRow.append(this.newItemInput);

        this.todosContainer = document.createElement('div');
        this.todosContainer.className = "todosContainer";
        this.view.append(this.todosContainer);

        this.render();
        this.newItemInput.focus();

        this.newItemInput.onchange = (e) => {
            e.preventDefault();
            if (this.newItemInput.value != "") {
                this.data += this.newItemInput.value + "\n";
                let row = new Todo(this, this.newItemInput.value);
                this.todosContainer.prepend(row.view);
                row.render();

                this.newItemInput.value = "";
                this.triggerSave();
            }
        }
    }
    render() {
        let Lines = this.data.trim().split('\n');
        Lines.forEach((line, index) => {
            if (line != "") {
                let row = new Todo(this, line);
                this.todosContainer.appendChild(row.view);
                row.render();
            }
        });
    };
    triggerSave() {

        let filename = this.app.selectedFilename;
        let filedata = '';
        [...this.todosContainer.childNodes].forEach(item => {
            filedata += item.dataset.line + "\n";
        })

        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
            this.app.storage.writeFile(filename, filedata);
        }, this.app.storage.saveTimer);
    }
}

class Todo {
    constructor(editor, line) {
        this.editor = editor;

        this.view = document.createElement('div');
        this.view.className = "todoRow";
        this.view.dataset.line = line;

        this.todo = new TodoTxtItem(line);

        this.isEditMode = false;
        this.line = line;
    }
    render() {
        this.view.innerHTML = ``;
        this.view.dataset.complete = this.todo.complete;

        if (this.isEditMode) {

            let inputField = document.createElement('input');
            inputField.type = "text";
            inputField.className = "todoEntry";
            inputField.value = this.line;
            inputField.placeholder = "enter a todo";
            this.view.append(inputField);

            inputField.onchange = (e) => {
                e.preventDefault();
                // console.log("here");
                if (inputField.value != "") {
                    if (this.line != inputField.value) {
                        this.line = inputField.value;
                        this.view.dataset.line = this.line;
                        this.todo = new TodoTxtItem(this.line);
                        this.isEditMode = false;
                        this.render();
                        this.editor.triggerSave();
                    } else {
                        console.log("nothing changed");
                    }

                } else {
                    this.view.remove();
                    this.editor.triggerSave();
                }
            }

            inputField.onkeyup = (e) => {
                if (e.key.toLowerCase() === "escape") {
                    this.isEditMode = false;
                    this.render();
                }
            }

            let cancelButton = document.createElement('button');
            cancelButton.innerText = "Cancel";
            this.view.append(cancelButton);

            cancelButton.onclick = () => {
                this.isEditMode = false;
                this.render();
            }

            let saveButton = document.createElement('button');
            saveButton.innerText = "Save";
            this.view.append(saveButton);

            saveButton.onclick = () => {
                this.line = inputField.value;
                this.view.dataset.line = this.line;
                this.todo = new TodoTxtItem(this.line);
                this.isEditMode = false;
                this.render();
                this.editor.triggerSave();
            }

            inputField.focus();
        } else {

            if (this.todo.complete) {
                let el = document.createElement('div');
                el.className = "todoCheckbox";
                el.innerHTML = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="8" fill="none" stroke="var(--border)" stroke-width="2"></circle>
                    <circle cx="16" cy="16" r="3" fill="var(--ink)" stroke="none" stroke-width="0"></circle>
                </svg>`;
                this.view.append(el);
            } else {
                let el = document.createElement('div');
                el.className = "todoCheckbox";
                el.innerHTML = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="8" fill="none" stroke="var(--border)" stroke-width="2"></circle>
                </svg>`;
                this.view.append(el);
            }

            if (this.todo.priority) {
                let el = document.createElement('span');
                el.className = "lemon";
                el.innerText = this.todo.priority;
                this.view.append(el);
            }

            let todotext = document.createElement('div');
            todotext.className = this.todo.complete ? "todoText todoComplete" : "todoText";
            todotext.innerText = this.todo.text;
            this.view.append(todotext);

            let spacer = document.createElement('div');
            spacer.innerHTML = "&nbsp;";
            Object.assign(spacer.style, {
                padding: "0.5rem 0",
                flexGrow: "1"
            });
            this.view.append(spacer);


            if (this.todo.projects) {
                this.todo.projects.forEach(project => {
                    let el = document.createElement('span');
                    let color = (this.todo.complete) ? "disabled" : "grape";
                    el.className = `todoToken ${color}`;
                    el.innerText = "+" + project;
                    this.view.append(el);
                });
            }

            if (this.todo.contexts) {
                this.todo.contexts.forEach(context => {
                    let el = document.createElement('span');
                    let color = (this.todo.complete) ? "disabled" : "cloud";
                    el.className = `todoToken ${color}`;
                    el.innerText = "@" + context;
                    this.view.append(el);
                });
            }

            if (this.todo.date) {
                let shortDate = new Date(this.todo.date).toLocaleDateString();
                this.view.innerHTML += `<span class="todoToken brick" title="${this.todo.date}">${shortDate}</span>`;
            }

            if (!this.todo.complete) {
                let editButton = document.createElement('button');
                editButton.innerText = "Edit";
                this.view.append(editButton);

                editButton.onclick = (e) => {
                    e.stopPropagation();
                    this.isEditMode = true;
                    this.render();
                }
            } else {

                let deleteButton = document.createElement('button');
                deleteButton.innerText = "Delete";
                this.view.append(deleteButton);

                deleteButton.onclick = (e) => {
                    e.stopPropagation();
                    this.view.remove();
                    this.editor.triggerSave();
                }
            }



            this.scratchSound = new Audio();
            if (this.scratchSound.canPlayType("audio/ogg")) {
                this.scratchSound.src = "assets/pencil.ogg";
            } else {
                // for FOSS-unfriendly browsers
                this.scratchSound.src = "assets/pencil.mp3";
            }
            this.scratchSound.volume = 0.4;

            todotext.onclick = spacer.onclick = () => {
                if (!this.todo.complete) {
                    this.scratchSound.play();
                    this.todo.complete = true;
                    this.todo.completed = new Date();
                } else {
                    this.todo.complete = false;
                    this.todo.completed = null;
                }
                this.line = this.todo.toString();
                this.view.dataset.line = this.line;
                this.render();
                this.editor.triggerSave();
            }


        }

    }
    getLine() {
        return this.line;
    }
}

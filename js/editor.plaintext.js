class PlaintextEditor {
  constructor(rootEl, app, content) {
    this.rootEl = rootEl;
    this.rootEl.className = "plaintextEditor";
    this.app = app;

    this.textarea = document.createElement('textarea');
    this.textarea.placeholder="The beginning is the most…";
    this.rootEl.append(this.textarea);
    this.textarea.focus();

    this.textarea.addEventListener("input", () => {
      this.adjustHeight();
      let filename = this.textarea.value;
      let filedata = this.app.selectedFilename;

      if (this.saveTimer) clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => {
        this.app.storage.writeFile(filename, filedata);
      }, this.app.storage.saveTimer);
    }, false);

    this.textarea.value = content;
    this.adjustHeight();
  }
  adjustHeight() {
    this.textarea.style.height = 0;
    this.textarea.style.height = (this.textarea.scrollHeight) + "px";
  }
}

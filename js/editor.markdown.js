class MarkdownEditor {
  constructor(rootEl, app, content) {
    this.rootEl = rootEl;
    this.rootEl.className = "markdownEditor";

    this.app = app;

    this.textarea = document.createElement('textarea');
    this.textarea.id = "markdownRoot";
    this.rootEl.append(this.textarea);

    this.renderContainer = document.createElement('div');
    this.renderContainer.className = "renderContainer";
    this.rootEl.append(this.renderContainer);    

    this.markdownRender = document.createElement('div');
    this.markdownRender.className = "markdownRender";
    this.renderContainer.append(this.markdownRender);    

    this.editor = CodeMirror.fromTextArea(this.textarea, {
      mode: "markdown",
      theme: "uxmap",
      scrollPastEnd: true,
      highlightActiveLine: true,
      lineNumbers: true,
      lineWrapping: true
    });

    this.editor.focus();

    this.editor.on('change', (i, op) => {
      this.render();
    });

    this.editor.on('keyup', () => {
      if (this.saveTimer) clearTimeout(this.saveTimer);

      let filename = this.app.selectedFilename;
      let filedata = this.editor.getValue();

      this.saveTimer = setTimeout(() => {  
        this.app.storage.writeFile(filename, filedata);
      }, this.app.storage.saveTimer);
    });

    // customize the renderer
    const renderer = {
      link(href, title, text) {
        return `<a target="_blank" href="${href}" title="${title}">${text}</a>`;
      }
    };
    
    marked.use({ renderer });

    this.editor.setValue(content);
    this.render();
  }
  render() {
    let markdown = this.editor.getValue();
    this.markdownRender.innerHTML = marked.parse(markdown);
  };

}

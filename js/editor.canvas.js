const snap = (s) => { return Math.round(s / 24) * 24 }
const snapFloor = (s) => { return Math.floor(s / 24) * 24 }
const snapCeil = (s) => { return Math.ceil(s / 24) * 24 }

const getTextContent = (el) => {
    // Convert <div> and <br> from HTML to newlines in plain text
    let html = el.innerHTML.replace(/(<div>|<br>)/g, "\n").replace(/<.*?>/g, "").replace(/\n$/, "");

    // Decode HTML entities
    var tmp = document.createElement("textarea");
    tmp.innerHTML = html;
    return tmp.textContent;
}

class CanvasEditor {
    constructor(rootEl, app, content) {
        this.snapSize = 24;
        this.app = app;

        this.rootEl = rootEl;
        Object.assign(this.rootEl.style, {
            position: "relative",
            top: "0",
            left: "0",
            overflowY: "auto"
        });

        this.scrollableArea = document.createElement('div');
        Object.assign(this.scrollableArea.style, {
            position: "relative",
            width: "100%",
            height: "3000px",
            background: `radial-gradient(var(--border) 5%, var(--paper-row) 7%) -12px -12px / ${this.snapSize}px ${this.snapSize}px`,
            cursor: "crosshair"
        });
        this.rootEl.append(this.scrollableArea);

        this.selectedElement = null;
        this.clickTarget = null;

        this.scrollableArea.addEventListener('mousedown', e => {
            e.preventDefault();

            if (e.button === 1) {
                this.eraseElement(e.target);
            } else if (e.button === 2) {
                if (e.target.tagName == 'P') {
                    this.scrollableArea.prepend(e.target.parentNode);
                } else if (e.target.tagName == 'SECTION') {
                    this.scrollableArea.prepend(e.target);
                }
                this.selectElement(this.scrollableArea);
            } else {
                this.dragstart = [e.clientX, e.clientY];
                this.clickTarget = e.target;

                this.placeholder = document.createElement('div');
                Object.assign(this.placeholder.style, {
                    position: "absolute",
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    zIndex: "9999",
                    outline: "2px dotted var(--border)",
                    outlineOffset: "-1px",
                    borderRadius: "4px"
                });

                this.scrollableArea.append(this.placeholder);
            }
        }, false);

        this.scrollableArea.addEventListener('mousemove', e => {
            let rootRect = this.getRootRect();

            if (this.dragstart) {
                let p1 = [snap(this.dragstart[0] - rootRect.x), snap(this.dragstart[1] - rootRect.y)];
                let p2 = [snap(e.clientX - rootRect.x), snap(e.clientY - rootRect.y)];
                let left = Math.min(p1[0], p2[0]);
                let top = Math.min(p1[1], p2[1]);
                let right = Math.max(p1[0], p2[0]);
                let bottom = Math.max(p1[1], p2[1]);
                let width = right - left;
                let height = bottom - top;

                Object.assign(this.placeholder.style, {
                    left: snapFloor(left) + "px",
                    top: snapFloor(top) + "px",
                    width: snapCeil(width) + "px",
                    height: snapCeil(height) + "px"
                });
            }
        }, false);

        this.scrollableArea.addEventListener('mouseup', e => {
            if (this.placeholder) this.placeholder.remove();

            if (this.dragstart) {
                let rootRect = this.getRootRect();
                var p1 = [snap(this.dragstart[0] - rootRect.x), snap(this.dragstart[1] - rootRect.y)];
                var p2 = [snap(e.clientX - rootRect.x), snap(e.clientY - rootRect.y)];

                // started in an empty area on the canvas and moved
                if (p1[0] != p2[0] && p1[1] != p2[1]) {

                    var left = Math.min(p1[0], p2[0]);
                    var top = Math.min(p1[1], p2[1]);
                    var right = Math.max(p1[0], p2[0]);
                    var bottom = Math.max(p1[1], p2[1]);
                    var width = right - left;
                    var height = bottom - top;

                    let obj = {
                        "content": "",
                        "left": snapFloor(left),
                        "top": snapFloor(top),
                        "width": snapCeil(width),
                        "height": snapCeil(height),
                        "decoration": 0
                    }

                    let section = new Section(obj.left, obj.top, obj.width, obj.height, obj.content, obj.decoration, this.scrollableArea, this);
                    this.selectElement(section.el)
                } else {
                    this.selectElement(this.clickTarget)
                }
            }

            this.dragstart = null;
            this.moveTarget = null;
            this.clickTarget = null;

            this.triggerSave();
        });

        this.loadData(content);
    }
    triggerSave() {
        let saveData = Array.from(this.scrollableArea.querySelectorAll("section")).map(e => {
            let element = {
                content: getTextContent(e),
                left: (parseInt(e.style.left.slice(0, -2)) || 0),
                top: (parseInt(e.style.top.slice(0, -2)) || 0),
                width: (parseInt(e.style.width.slice(0, -2)) || 0),
                height: (parseInt(e.style.height.slice(0, -2)) || 0),
                decoration: (parseInt(e.dataset.decoration) || 0)
            }
            return element
        });
        let filename = this.app.selectedFilename;
        let filedata = JSON.stringify(saveData);

        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
            this.app.storage.writeFile(filename, filedata);
        }, this.app.storage.saveTimer);
    }
    eraseElement(target) {
        if (target != this.scrollableArea && target.tagName != 'SECTION') target = target.parentNode;
        if (target != this.scrollableArea) target.remove()
    }
    selectElement(target) {
        this.scrollableArea.querySelectorAll('*').forEach(e => {
            e.classList.remove('selected')
            e.querySelectorAll('.grabby').forEach(grabby => grabby.style.display = "none");
        });

        if (target != this.scrollableArea && target.tagName != 'SECTION') target = target.parentNode;

        if (target != this.scrollableArea && target.tagName == 'SECTION') {

            target.querySelectorAll('.grabby').forEach(e => e.style.display = "block");

            target.classList.add('selected');
            this.selectedElement = target;

            // Move the node last (bring to front)
            target.parentNode.appendChild(target);

            // Focus the first <p> in the box and select all text
            let p = target.getElementsByTagName('p')[0];
            p.focus();
            var range = document.createRange();
            range.selectNodeContents(p);

            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);

        } else {
            let sel = document.getSelection();
            sel.removeAllRanges();

            this.selectedElement = null;
            this.clickTarget = null;
        }
    }
    loadData(data) {
        let JSONdata;
        try {
            JSONdata = JSON.parse(data);
        } catch (e) {
            JSONdata = [{ "content": "Error opening the file", "left": 72, "top": 72, "width": 192, "height": 48, "decoration": 6 }];
            this.app.toast("Error opening the file!!", "warning");
        }
        this.scrollableArea.innerHTML = "";
        JSONdata.forEach(obj => {
            let el = new Section(obj.left, obj.top, obj.width, obj.height, obj.content, obj.decoration, this.scrollableArea, this);
        });
    }
    getRootRect() {
        let boundingRect = this.scrollableArea.getBoundingClientRect();
        return { x: boundingRect.left, y: boundingRect.top, w: boundingRect.width, h: boundingRect.height }
    }
}

class Section {
    constructor(x, y, w, h, content, decoration, rootEl, parent) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.content = content;
        this.decoration = decoration;
        this.rootEl = rootEl;
        this.parent = parent;

        this.snapSize = 24;

        this.el = document.createElement('section');
        Object.assign(this.el.style, {
            overflow: "visible",
            position: "absolute",
            left: this.x + "px",
            top: this.y + "px",
            width: this.w + "px",
            height: this.h + "px"
        });

        this.brgrabby = document.createElement('div');
        this.brgrabby.className = "grabby";
        Object.assign(this.brgrabby.style, {
            bottom: "-20px",
            right: "-20px"
        });
        this.el.append(this.brgrabby);

        this.el.dataset.decoration = this.decoration;

        let text = document.createElement('p');
        text.contentEditable = 'true';
        // fix the line breaks
        text.innerHTML = (new Option(content)).innerHTML.replace(/\n/g, '<br>');
        this.el.append(text);

        this.el.onpaste = (e) => {
            e.stopPropagation();
            e.preventDefault();

            let clipboardData = e.clipboardData || window.clipboardData;
            let pastedData = clipboardData.getData('Text');

            text.focus();
            text.innerText = pastedData.replace(/\n/g, '<br>');

            var range = document.createRange();
            range.selectNodeContents(text);

            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }

        this.el.addEventListener('wheel', e => {
            if (this.el.classList.contains("selected") && e.ctrlKey) {
                e.preventDefault();
                let direction = (e.deltaY > 0) ? 6 : 1
                let decoration = (parseInt(this.el.dataset.decoration || 0) + direction) % 7;
                this.setDecoration(decoration);
                this.parent.app.toast("set decoration: " + decoration, 0);
            }
        }, { passive: false });

        this.el.addEventListener('contextmenu', e => {
            e.preventDefault();
        }, false);

        this.el.addEventListener("mousedown", e => {

            if (e.button === 1) {
                this.el.remove()

            } else if (e.button === 2) {
                if (e.target.tagName == 'P' || e.target.tagName == 'DIV') {
                    this.rootEl.prepend(e.target.parentNode);
                } else if (e.target.tagName == 'SECTION') {
                    this.rootEl.prepend(e.target);
                }
                this.parent.selectElement(this.rootEl);

            } else if (this.el.classList.contains("selected")) {
                e.preventDefault();
                e.stopPropagation();

                // Elements initial width and height
                this.h = this.el.offsetHeight;
                this.w = this.el.offsetWidth;
                this.t = this.el.offsetTop;
                this.l = this.el.offsetLeft;
                // Click position within element
                this.y = this.t + this.h - e.pageY;
                this.x = this.l + this.w - e.pageX;

                const hasMoved = () =>
                    !(this.t === this.offsetTop && this.l === this.offsetLeft);

                const follow = (e) => {
                    this.el.style.top = snap(e.pageY + this.y - this.h) + "px";
                    this.el.style.left = snap(e.pageX + this.x - this.w) + "px";
                }

                const unfollow = (e) => {
                    document.removeEventListener('mousemove', follow);
                    document.removeEventListener("mouseup", unfollow);

                    // Emit events according to interaction
                    if (hasMoved(e)) dispatchEvent(new Event('moved'));
                    else this.dispatchEvent(new Event('clicked'));
                    e.preventDefault();
                }

                document.addEventListener("mousemove", follow);
                document.addEventListener("mouseup", unfollow);
            }
        }, false);

        this.brgrabby.addEventListener('mousedown', e => {
            e.preventDefault();
            e.stopPropagation();

            // Elements initial width and height
            this.h = this.el.offsetHeight;
            this.w = this.el.offsetWidth;
            this.t = this.el.offsetTop;
            this.l = this.el.offsetLeft;
            // Click position within element
            this.y = this.t + this.h - e.pageY;
            this.x = this.l + this.w - e.pageX;

            const hasResized = () =>
                !(this.w === this.offsetWidth && this.h === this.offsetHeight);
            const resize = (e) => {
                let width = Math.max(e.pageX - this.l + this.x, this.snapSize * 2);
                let height = Math.max(e.pageY - this.t + this.y, this.snapSize * 2);

                this.el.style.width = snap(width) + "px";
                this.el.style.height = snap(height) + "px";
            }

            const unresize = (e) => {
                // Remove listeners that were bound to document
                document.removeEventListener('mousemove', resize);
                document.removeEventListener("mouseup", unresize);
                // Emit events according to interaction
                if (hasResized(e)) dispatchEvent(new Event('resized'));
                else this.dispatchEvent(new Event('clicked'));
                e.preventDefault();
            }

            document.addEventListener("mousemove", resize);
            document.addEventListener("mouseup", unresize);
        }, false);

        this.setDecoration(this.decoration);
        text.focus()
        this.rootEl.append(this.el);
    }
    setDecoration(decoration) {
        if (decoration || this.el.dataset.decoration) this.el.dataset.decoration = decoration
    }
}

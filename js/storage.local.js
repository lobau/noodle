class LocalStorage {
    constructor(app) {
        this.user = "local storage";
        this.saveTimer = 500;
        this.app = app;

        this.app.setStorageData("Local storage");
    }
    async loadFile(filename) {
        let filecontent = JSON.parse(localStorage.getItem(filename));
        return filecontent.content;
    }
    async createFile(filename, template) {

        return new Promise((resolve, reject) => {
            let file = {
                content: template,
                modified: Date.now()
            }
            localStorage.setItem(filename, JSON.stringify(file));

            resolve();
        });
    }
    writeFile(filename, content) {
        let file = {
            content: content,
            modified: Date.now()
        }
        localStorage.setItem(filename, JSON.stringify(file));
        this.app.selectedFile.modified = new Date();
        // this.app.setStatus("just then.");
    }
    async renameFile(oldname, newname) {
        if (!localStorage.getItem(newname)) {
            let file = JSON.parse(localStorage.getItem(oldname));
            file.name = newname;

            localStorage.setItem(newname, JSON.stringify(file));
            localStorage.removeItem(oldname);
        } else {
            if (oldname != newname) this.app.toast("A file with this name already exists!", "warning");
        }
    }
    async deleteFile() {
        localStorage.removeItem(this.app.selectedFilename);

        const searchParams = new URLSearchParams(location.search);
        searchParams.set('file', "");
        location.search = searchParams.toString();
    }
    async archiveFile() {
        let archive;
        if (localStorage.getItem("__archive") != null) {
            archive = JSON.parse(localStorage.getItem("__archive"));
        } else {
            archive = [];
        }

        let fileToArchive = JSON.parse(localStorage.getItem(this.app.selectedFilename));
        archive.push(fileToArchive);

        localStorage.setItem("__archive", JSON.stringify(archive));
        localStorage.removeItem(this.app.selectedFilename);

        const searchParams = new URLSearchParams(location.search);
        searchParams.set('file', "");
        location.search = searchParams.toString();
    }
    downloadFile() {
        let file = JSON.parse(localStorage.getItem(this.app.selectedFilename));
        const blob = new Blob([file.content], { type: 'text/plain' });

        const a = document.createElement('a');
        a.setAttribute('download', this.app.selectedFilename);
        a.setAttribute('href', window.URL.createObjectURL(blob));
        a.click();

        return false;
    }
    structureMatches(obj, structure) {
        for (const key in structure) {
            if (!obj.hasOwnProperty(key)) {
                return false;
            }

            if (typeof obj[key] !== structure[key]) {
                return false;
            }

            if (typeof structure[key] === 'object') {
                if (!this.structureMatches(obj[key], structure[key])) {
                    return false;
                }
            }
        }

        return true;
    }
    async getFileList() {
        let entries = [];
        for (var key in localStorage) {
            if (localStorage.getItem(key) != null && key != this.app.appID) {
                let stringified = localStorage.getItem(key);
                let obj;

                try {
                    obj = JSON.parse(stringified);
                } catch(e) {
                    console.error(e);
                }

                const structure = {
                    content: 'string',
                    modified: 'number'
                };

                // there can be other stuff in the localStorage (extensions, other pages, experiments)
                // so we need to check if the structure of what we get is expected
                if (this.structureMatches(obj, structure)) {
                    try {
                        let entry = this.app.filenameComponent(key);
                        entry.modified = new Date(obj.modified);
                        entries.push(entry);

                    } catch (e) {
                        console.error(key + " is not a valid file");
                    }

                }
            }
        }
        return entries;
    }
}

class DropboxStorage {
    constructor(clientID, accessToken, app) {
        this.clientID = clientID;
        this.accessToken = accessToken;
        this.saveTimer = 3000;
        this.app = app;

        this.dbx = new Dropbox.Dropbox({
            accessToken: accessToken
        });

        this.dbx.usersGetCurrentAccount()
            .then(response => {
                this.user = response.result.email;
                this.app.setStorageData(this.user);
            })
            .catch(function (error) {
                console.error(error);
            });
    }
    async loadFile(filename) {
        let filecontent;

        await this.dbx.filesDownload({ path: '/' + filename }).then((response) => {
            filecontent = response.result.fileBlob;
        }).catch(function (error) {
            console.error(error);
        })

        return new Promise((resolve, reject) => {
            var reader = new FileReader();
            reader.onload = () => {
                resolve(reader.result)
            };
            reader.onerror = reject;
            reader.readAsText(filecontent);
        });
    }
    async createFile(filename, template) {
        return new Promise((resolve, reject) => {
            let file = new File([template], filename, { type: "text/plain" });

            this.dbx.filesUpload({ path: "/" + file.name, contents: file })
                .then(function (response) {
                    resolve();
                })
                .catch(function (error) {
                    console.error(error);
                    reject();
                });
        });

    }
    writeFile(filename, content) {
        const UPLOAD_FILE_SIZE_LIMIT = 150 * 1024 * 1024;

        if (filename && content) {
            let file = new File([content], filename, { type: "text/plain" });
            this.app.setStatus("Saving file…");
            

            if (file.size < UPLOAD_FILE_SIZE_LIMIT) {

                this.dbx.filesUpload({ path: "/" + file.name, contents: file, mode: 'overwrite', mute: true })
                    .then((response) => {
                        this.app.selectedFile.modified = new Date();
                        this.app.setStatus("File saved!");
                        // The next heartbeat will reset the status
                    })
                    .catch(function (error) {
                        this.app.toast(error, "warning");
                        console.error(error);
                    });
            }
        }
    }
    async renameFile(oldname, newname) {
        return new Promise((resolve, reject) => {
            if (oldname != newname) {
                let request = { from_path: "/" + oldname, to_path: "/" + newname, autorename: true };

                this.dbx.filesMove(request)
                    .then((response) => {
                        resolve();
                    })
                    .catch((error) => {
                        this.app.toast(error, "warning");
                        console.error(error);
                        reject();
                    });
            }

        });
    }
    async deleteFile() {
        return new Promise((resolve, reject) => {
            this.dbx.filesDelete({ path: '/' + this.app.selectedFilename })
                .then((response) => {
                    resolve();
                })
                .catch(function (error) {
                    console.error(error);
                    reject();
                });
        });
    }
    async archiveFile() {
        return new Promise((resolve, reject) => {
            this.dbx.filesMove({ from_path: "/" + this.app.selectedFilename, to_path: "/archive/" + this.app.selectedFilename, autorename: true })
                .then(function (response) {
                    resolve();
                })
                .catch(function (error) {
                    console.error(error);
                    reject();
                });
        });
    }
    downloadFile() {
        this.dbx.filesDownload({ path: '/' + this.app.selectedFilename })
            .then((response) => {
                const blob = response.result.fileBlob;

                const a = document.createElement('a');
                a.setAttribute('download', this.app.selectedFilename);
                a.setAttribute('href', window.URL.createObjectURL(blob));
                a.click();
            })
            .catch(function (error) {
                console.error(error);
            });
    }
    async getFileList() {
        let fileList = [];
        await this.dbx.filesListFolder({ path: "" })
            .then(response => {
                response.result.entries.forEach(file => {
                    if (file[".tag"] == "file") {
                        let entry = this.app.filenameComponent(file.name);
                        entry.modified = new Date(file.client_modified);
                        fileList.push(entry);
                    }
                });
            })
            .catch(function (error) {
                console.error(error);
            });

        return fileList;
    }
}

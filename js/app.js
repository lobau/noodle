class App {
    constructor() {
        this.defaultTitle = "Sundown";
        this.dbClientID = 'nqh4k19borzokuy';
        this.appID = "app.sundown.settings";

        if (!localStorage.getItem(this.appID)) {
            this.settings = this.defaultSettings();
        } else {
            this.settings = this.loadSettings();
        }

        if (this.hasStorage()) {

            _("#landing").style.display = "none";
            _("#app").style.display = "grid";

            if (this.settings.storage == "localstorage") {
                this.storage = new LocalStorage(this);
            } else if (this.settings.storage == "dropbox") {
                this.storage = new DropboxStorage(this.dbClientID, this.settings.accessToken, this);
            } else {
                console.error("Storage setting· error. Fallback to localStorage.")
                this.storage = new LocalStorage(this);
            }

            _("#sidebar").dataset.visible = this.settings.sidebar || "true";
            _("#sidebarButton").dataset.visible = this.settings.sidebar || "true";

            _("#sidebarButton").onclick = () => { this.toggleSidebar() }
            _("#dimLayer").onclick = () => { this.toggleSidebar() }

            this.emojiPicker = new EmojiPicker(_("#emojiPicker"), this);

            _("#editor").addEventListener('click', () => {
                if (document.activeElement == _("#filenameInput")) {
                    _("#filenameInput").blur();
                }
            });

            // close all the menus when clicking out
            document.querySelectorAll('.dropdown').forEach(el => {
                document.addEventListener("click", e => {
                    if (!el.contains(e.target)) {
                        el.removeAttribute("open");
                    }
                });
            })

            window.onpopstate = window.history.onpushstate = (event) => {
                this.renderSidebar();
                this.highlightSelection();
            }

            this.loadBackgroundNoise();
            this.requestRender();
            this.beat();

        } else {

            _("#landing").style.display = "flex";
            _("#app").style.display = "none";

            _("#storageDropbox").addEventListener('click', () => {
                this.saveSetting("storage", "dropbox");

                var dbx = new Dropbox.Dropbox({ clientId: this.dbClientID });
                let protocol = (window.location.hostname == "localhost") ? "http" : "https";
                let currentHost = protocol + "://" + window.location.host;

                dbx.auth.getAuthenticationUrl(currentHost)
                    .then((authUrl) => { window.location = authUrl })
            });

            _("#storageLocal").addEventListener('click', () => {
                this.saveSetting("storage", "localstorage");
                window.location = "/";
            });

        }
    }
    async requestRender() {
        this.fileList = await this.storage.getFileList();

        if (this.fileList.length == 0) {
            // TODO: onboarding
            this.createNewFile("md", "✨ Welcome! +onboarding.md");
        } else {
            this.selectFileFromURL();
            this.requestLoadFile(this.selectedFile);

            this.renderSidebar();
            this.highlightSelection();
        }
    }
    pushToHistory(filename) {
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('file', filename);
        window.history.pushState({}, filename, '/?' + searchParams.toString());

        let file = this.filenameComponent(filename);
        document.title = file.base;
        let favicon;
        if (file.emoji != "") {
            favicon = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${file.emoji}</text></svg>`;
        } else {
            favicon = "assets/favicon.svg";
        }
        let setFavicon = document.createElement('link');
        setFavicon.setAttribute('rel', 'shortcut icon');
        setFavicon.setAttribute('href', favicon);
        _('head').appendChild(setFavicon);
    }
    toggleBackgroundNoise() {
        this.whiteNoise = !this.whiteNoise;
        if (this.whiteNoise) {
            this.backgroundAudio.play();
            _("#backgroundNoiseButton").innerHTML = "<figure>🔇</figure>Stop background audio";
        } else {
            this.backgroundAudio.pause();
            _("#backgroundNoiseButton").innerHTML = "<figure>☕</figure>Background audio";
        }
    }
    loadBackgroundNoise() {
        this.whiteNoise = false;
        this.backgroundAudio = new Audio();

        if (this.backgroundAudio.canPlayType("audio/ogg")) {
            this.backgroundAudio.src = "assets/ambience.ogg";
        } else {
            // for FOSS-unfriendly browsers
            this.backgroundAudio.src = "assets/ambience.mp3";
        }
        this.backgroundAudio.loop = true;
        this.backgroundAudio.volume = 0.3;
    }
    selectFileFromURL() {
        let urlparams = new URLSearchParams(window.location.search).get('file');
        this.selectedFilename = (urlparams) ? urlparams : this.fileList[0].name;

        let matchingFiles = this.fileList.filter(entry => { return entry.name === this.selectedFilename });
        this.selectedFile = matchingFiles[0];
    }
    filenameComponent(originalFilename) {
        // Emojis take more than one character so slicing them is weird
        // https://dev.to/acanimal/how-to-slice-or-get-symbols-from-a-unicode-string-with-emojis-in-javascript-lets-learn-how-javascript-represent-strings-h3a

        let charArray = Array.from(originalFilename);
        let emojis = charArray[0].match(/\p{Extended_Pictographic}/gu);
        let emoji, filename;

        if (emojis) {
            emoji = emojis[0];
            filename = charArray.slice(2).join("");
        } else {
            emoji = "";
            filename = charArray.join("");
        }

        return {
            name: originalFilename,
            emoji: emoji,
            base: filename.split(".").slice(0, -1).join(".").trim(),
            extension: filename.split(".").pop(),
            projects: filename.match(/(^|\s)(\+[a-z\d-]+)/ig),
            contexts: filename.match(/(^|\s)(@[a-z\d-]+)/ig)
        };
    }
    defaultIcon(extension) {
        const defaultIcons = {
            "md": "Ⓜ️",
            "canvas": "🟨",
            "txt": "🅿️",
            "calc": "♾️",
            "todo": "✅"
        }
        if (defaultIcons[extension] != undefined) {
            return defaultIcons[extension];
        } else {
            return "🔷";
        }
    }
    hasStorage() {
        const hash = new URLSearchParams(window.location.hash.slice(1));
        var urlParameters = {};
        for (const [key, value] of hash.entries()) {
            urlParameters[key] = value;
        }

        if (this.settings.storage == "dropbox") {

            if (this.settings.accessToken != "") {

                const tokenExpiryDate = new Date(this.settings.accessTokenExpires);
                const now = new Date();
                const isExpired = now > tokenExpiryDate;

                if (isExpired) {
                    this.saveSetting("accessToken", "");
                    this.saveSetting("accessTokenExpires", "");
                    window.history.pushState({}, this.defaultTitle, '/');
                    return false

                } else {
                    return true
                }

            } else if (urlParameters["access_token"]) {
                this.accessToken = urlParameters["access_token"];
                this.saveSetting("accessToken", this.accessToken);

                this.accessTokenExpires = new Date(new Date().getTime() + (1000 * 60 * 60 * 4));
                this.saveSetting("accessTokenExpires", this.accessTokenExpires);

                return true;

            } else {
                return false;

            }

        } else if (this.settings.storage == "localstorage") {
            return true;

        } else {
            return false;

        }
    }
    groupFiles(items) {

        this.groupedFiles = {
            "recency": { "today": [], "thisWeek": [], "older": [] },
            "project": { "none": [] },
            "context": { "none": [] }
        }

        // Sort the files in 3 different views
        // Reverse the table to get the most recents at the top
        items.slice().reverse().forEach(item => {
            const modified = new Date(item.modified);
            const now = new Date();
            const oneDayInMs = 1 * 24 * 60 * 60 * 1000;
            const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
            const timeDiffInMs = now.getTime() - modified.getTime();

            if (timeDiffInMs < oneDayInMs) {
                this.groupedFiles["recency"]["today"].push(item);
            } else if (timeDiffInMs >= oneDayInMs && timeDiffInMs < sevenDaysInMs) {
                this.groupedFiles["recency"]["thisWeek"].push(item);
            } else {
                this.groupedFiles["recency"]["older"].push(item);
            }

            if (item.projects) {
                item.projects.forEach(project => {
                    let projectName = project.trim();
                    if (!this.groupedFiles["project"][projectName]) {
                        this.groupedFiles["project"][projectName] = [];
                    }
                    this.groupedFiles["project"][projectName].push(item);
                });
            } else {
                if (!this.groupedFiles["project"]["none"]) {
                    this.groupedFiles["project"]["none"] = [];
                }
                this.groupedFiles["project"]["none"].push(item);
            }
            this.groupedFiles["project"] = this.sortKeysAlphabetical(this.groupedFiles["project"]);

            if (item.contexts) {
                item.contexts.forEach(context => {
                    let contextName = context.trim();
                    if (!this.groupedFiles["context"][contextName]) {
                        this.groupedFiles["context"][contextName] = [];
                    }
                    this.groupedFiles["context"][contextName].push(item);
                });
            } else {
                this.groupedFiles["context"]["none"].push(item);
            }
            this.groupedFiles["context"] = this.sortKeysAlphabetical(this.groupedFiles["context"]);
        });

        // Sort all the groups (recent, +project, etc)
        Object.keys(this.groupedFiles).forEach(view => {
            Object.keys(this.groupedFiles[view]).forEach(group => {
                this.groupedFiles[view][group].sort((a, b) => b.modified - a.modified);
            });
        });
    }
    highlightSelection() {
        let sections = _("#fileList").childNodes;
        sections.forEach(section => {
            let items = section.childNodes;

            items.forEach(item => {
                if (item.dataset.filename == this.selectedFilename) {
                    item.dataset.selected = true;
                    item.tabIndex = 0;
                    item.focus();
                } else {
                    item.dataset.selected = false;
                }
            });
        });
    }
    renderSidebar(selection) {

        if (!selection) selection = this.settings.groupBy;
        this.saveSetting('groupBy', selection);
        _("#groupByMenu").removeAttribute("open");

        switch (selection) {
            case "recency":
                _("#groupByIcon").innerText = "🕒";
                break;
            case "context":
                _("#groupByIcon").innerText = "💬";
                break;
            case "project":
                _("#groupByIcon").innerText = "🚀";
                break;
            default:
                _("#groupByIcon").innerHTML = "⚠️";
        }

        _("#fileList").innerHTML = '';
        this.groupFiles(this.fileList);
        let groups = this.groupedFiles[selection];

        Object.keys(groups).forEach((key) => {
            if (groups[key].length > 0) {

                let details = document.createElement('details');
                details.className = "sidebarSection";
                details.open = true;

                let summary = document.createElement('summary');
                summary.className = "sidebarSectionTitle";
                summary.innerHTML = key;
                details.appendChild(summary);

                groups[key].forEach((file) => {

                    let button = document.createElement('button');
                    button.className = "fullwidth";
                    let filebase = file.base.replace(/(^|\s)(\+[a-z\d-]+)/ig, "$1<span class='markProject'>$2</span>");
                    filebase = filebase.replace(/(^|\s)(@[a-z\d-]+)/ig, "$1<span class='markContext'>$2</span>");

                    let emoji = (file.emoji) ? file.emoji : this.defaultIcon(file.extension);

                    button.innerHTML = `<figure>${emoji}</figure>
                    <abbr title="${file.name}\n${file.modified}">
                        ${filebase}
                        <span class="markExtension">
                            .${file.extension}
                        </span>
                    </abbr>`;

                    button.dataset.filename = file.name;
                    if (file.name == this.selectedFilename) {
                        button.dataset.selected = "true";
                    }
                    button.addEventListener('click', () => {
                        this.requestLoadFile(file);
                    })
                    button.addEventListener('dblclick', () => {
                        this.toggleSidebar();
                    });
                    details.appendChild(button);
                })

                _("#fileList").appendChild(details);
            }
        });
    }
    async requestLoadFile(file) {
        this.selectedFile = file;
        this.selectedFilename = file.name;
        this.selectedFile.content = await this.storage.loadFile(file.name);

        this.pushToHistory(file.name);
        this.highlightSelection();

        _("#editorExtensions").innerHTML = "";
        _("#editor").innerHTML = "";
        _("#editor").className = "";
        _("#editor").dataset.filename = file.name;
        _("#fileMenuButton").title = `Last modified ${file.modified.toLocaleDateString()} ${file.modified.toLocaleTimeString()}`;
        this.fuzzyTime();

        switch (file.extension) {
            case "md":
                this.editor = new MarkdownEditor(_("#editor"), this, file.content);
                break;
            case "canvas":
                this.editor = new CanvasEditor(_("#editor"), this, file.content);
                break;
            case "txt":
                this.editor = new PlaintextEditor(_("#editor"), this, file.content);
                break;
            case "calc":
                this.editor = new CalcEditor(_("#editor"), this, file.content);
                break;
            case "todo":
                this.editor = new TodoEditor(_("#editor"), this, file.content);
                break;
            default:
                _("#editor").innerHTML = "<div class='disabled' style='display: flex; width: 100%; height: calc(100% - var(--toolbar-height)); justify-content: center; align-items: center;'>No editor for this type yet.</div>";
        }

        _("#filenameInput").value = file.base;

        let emoji = (file.emoji) ? file.emoji : this.defaultIcon(file.extension);
        this.emojiPicker.setEmoji(emoji);

        _("#filenameInput").onblur = async () => {
            let input = _("#filenameInput");
            if (input.value != file.name) {
                // Replace all POSIX illegal characters with an empty string
                const illegalChars = /[\/\0:*?"<>|]/g;
                let newBase = _("#filenameInput").value.replace(illegalChars, "").trim();
                let oldname = file.name;
                let newname;

                if (file.emoji != "") {
                    newname = [file.emoji, " ", newBase, ".", file.extension].join("");
                } else {
                    newname = [newBase, ".", file.extension].join("");
                }

                await this.storage.renameFile(oldname, newname);

                this.selectedFile.base = newBase;
                this.selectedFilename = newname;
                _("#filenameInput").dataset.originalFilebase = newBase;

                this.pushToHistory(newname);
                this.requestRender();

            } else {
                console.warn("no change in the name");
            }
        }

        _("#filenameInput").addEventListener("keydown", (e) => {
            if (e.code === "Enter") {
                _("#filenameInput").blur();
            } else if (e.code === "Escape") {
                _("#filenameInput").value = filenameField.dataset.originalFilebase;
                _("#filenameInput").blur();
            }
        });
    }
    async archiveFile() {
        await this.storage.archiveFile();
        this.pushToHistory(this.fileList[0].name);
        this.requestRender();
    }
    async deleteFile() {
        await this.storage.deleteFile();
        this.pushToHistory(this.fileList[0].name);
        this.requestRender();
    }
    async createNewFile(type, filename) {
        _("#newFileMenu").removeAttribute("open");

        if (!filename) {
            let chars = 'abcdefghijklmnopqrstuvwxyz';
            let str = '';
            for (let i = 0; i < 5; i++) {
                str += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            filename = "untitled " + str + " +draft." + type;
        }

        switch (type) {
            case "txt":
                await this.storage.createFile(filename, ``);
                break;
            case "md":
                let welcome = [
                    "# Markdown",
                    "",
                    "- Use #, ##, etc, for titles",
                    "- Use **bold** and _italic_",
                    "- Make lists like this one",
                    "",
                ]
                await this.storage.createFile(filename, welcome.join('\n'));
                break;
            case "canvas":
                // TODO: Should the canvas text format be easier to read and parse?
                // Plus storing it in localstorage means we're storing a stringified JSON inside another stringified JSON…
                // 2022/12/23 Also, we need to store style values in the documents, we can't rely on a mapping
                let doodle = [
                    {
                        "content": "Create boxes by dragging anywhere on the grid.\n\nWhen a box is selected, press control and scroll to switch the box style.",
                        "left": 144, "top": 144, "width": 264, "height": 216,
                        "decoration": 5
                    },
                    {
                        "content": "This is a box!\n\nBoxes are neat to organize ideas and think visually!\n\nSelect a box by clicking on it.\n\nTry on the box below! 🡦",
                        "left": 72, "top": 72, "width": 264, "height": 240,
                        "decoration": 1
                    },
                ];
                await this.storage.createFile(filename, JSON.stringify(doodle));
                break;
            case "calc":
                let defaultCalc = [
                    "# Calculations",
                    "angle = 45",
                    "56 + 45 / cos(angle)",
                    "",
                    "# Variables",
                    "discount = 20%",
                    "discount of 999",
                    "150 - discount",
                    "",
                    "# Conversions",
                    "15 inch in cm",
                    "52 kmh in mph",
                    "72 F in C"
                ]
                await this.storage.createFile(filename, defaultCalc.join('\n'));
                break;
            case "todo":
                let defaultTodo = [
                    "take a break @work +selfcare",
                    "drink some water +selfcare",
                    "water the plants @house"
                ]
                await this.storage.createFile(filename, defaultTodo.join('\n'));
                break;
            default:
                this.toast("the filetype " + type + " doesn't exists.");
        }

        this.pushToHistory(filename);
        this.requestRender();
    }
    toast(message, color) {
        if (this.toastTimer) clearTimeout(this.toastTimer)

        _("#toast").dataset.type = color;
        _("#toast").dataset.visible = true;
        _("#toast").innerHTML = message;
        this.toastTimer = setTimeout(() => {
            _("#toast").dataset.visible = false;
        }, 2000);
    }
    setStatus(string) {
        _("#status").innerHTML = string;
        // _("#status").selected = true;
    }
    sortKeysAlphabetical(unsortedObj) {
        return Object.keys(unsortedObj).sort().reduce(function (Obj, key) {
            Obj[key] = unsortedObj[key];
            return Obj;
        }, {});
    }
    toggleSidebar() {
        var isVisible = _("#sidebar").dataset.visible == 'true';
        _("#sidebar").dataset.visible = !isVisible;
        _("#sidebarButton").dataset.visible = !isVisible;
        this.saveSetting("sidebar", !isVisible);
    }
    closeSidebar() {
        _("#sidebar").dataset.visible = "false";
        _("#sidebarButton").dataset.visible = "false";
        this.saveSetting("sidebar", false);
    }
    logOut() {
        this.saveSetting("storage", "");
        this.saveSetting("accessToken", "");
        this.saveSetting("accessTokenExpires", "");
        window.location = "/";
    }
    beat() {
        this.fuzzyTime();
        this.heartbeat = setTimeout(() => { this.beat() }, 10000);
    }
    fuzzyTime() {
        if (this.selectedFile) {
            let seconds = Math.floor((+new Date - this.selectedFile.modified) / 1000);
            let minutes = Math.floor(seconds / 60);
            let hours = Math.floor(minutes / 60);
            let days = Math.floor(hours / 24);
            let weeks = Math.floor(days / 7);

            let fuzzyTime = 'Last modified '

            if (seconds < 60) {
                fuzzyTime += "just now.";
            } else if (minutes < 60) {
                fuzzyTime += `${minutes} min ago.`;
            } else if (hours < 24) {
                fuzzyTime += `${hours} hours ago.`;
            } else if (days < 7) {
                fuzzyTime += `${days} days ago.`;
            } else {
                fuzzyTime += `${weeks} weeks ago.`;
            }

            _("#status").innerHTML = fuzzyTime;
        }
    }
    setStorageData(message) {
        _("#storageData").innerHTML = message;
    }
    defaultSettings() {
        let settings = {
            appVersion: 0,
            storage: "",
            groupBy: "recency",
            sidebar: true,
            accessToken: "",
            accessTokenExpires: ""
        }

        localStorage.setItem(this.appID, JSON.stringify(settings));
        return settings;
    }
    saveSetting(key, value) {
        this.settings[key] = value;
        localStorage.setItem(this.appID, JSON.stringify(this.settings));
    }
    loadSettings() {
        return JSON.parse(localStorage.getItem(this.appID));
    }
}

class EmojiPicker {
    constructor(rootEl, app) {
        this.rootEl = rootEl;
        this.app = app;

        this.rootEl.onclick = () => {
            this.showEmojiPicker();
        }

        this.data = [
            { title: "File icon", set: "⏩,⏬,⛎,✅,❎,⭐,✨,✋,✊,⏰,⌚,⌛,⏳,⛽,⛪,⛲,⛳,⛵,⛺,⚽,⚾,⛄,⛅,⭕,❌,❓,❗" },
            { title: "Monochrome", set: "⬛,⬜,⚫,⚪,❕,➕,➗" }
        ];

    }
    showEmojiPicker() {
        this.dimLayer = document.createElement("div");
        Object.assign(this.dimLayer.style, {
            position: "absolute",
            inset: 0,
            background: "rgba(0, 0, 0, 0.1)",
            zIndex: 99,
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
        });
        document.body.appendChild(this.dimLayer);

        this.emojiWindow = document.createElement("div");
        this.emojiWindow.className = "emoji-window";
        this.dimLayer.appendChild(this.emojiWindow);

        this.dimLayer.onclick = () => {
            this.hideEmojiPicker();
        };

        // Populate window
        for (const category of this.data) {
            this.emojiWindow.appendChild(this.emojiCategory(category["title"]));
            for (const emoji of category["set"].split(",")) {
                this.emojiWindow.appendChild(this.createButton(emoji));
            }
        }

        var info = document.createElement("p");
        info.className = "disabled";
        info.innerHTML = "Why so few emoji? Dropbox only support 3-bytes emoji—a very small subset of all emoji. As a preventive measure, noodle only supports those emoji for all storage locations.";
        this.emojiWindow.appendChild(info);
    }
    hideEmojiPicker() {
        this.dimLayer.remove();
    }
    setEmoji(emoji) {
        this.rootEl.innerText = emoji;
    }
    emojiCategory(title) {
        var cat = document.createElement("span");
        cat.className = "emoji-section";
        cat.innerText = title;
        return cat;
    }
    createButton(emoji) {
        let emojiButton = document.createElement("span");
        emojiButton.className = "emoji-btn";
        emojiButton.innerText = emoji;
        emojiButton.onclick = () => {
            this.setEmoji(emoji);
            this.hideEmojiPicker();
            this.applyToFile(emoji);
        };
        return emojiButton;
    }
    async applyToFile(emoji) {
        let originalEmoji = this.app.selectedFile.emoji;
        let base = this.app.selectedFile.base;
        let extension = this.app.selectedFile.extension;
        let oldname, newname;

        if (emoji != originalEmoji) {
            if (originalEmoji == "") {
                oldname = base + "." + extension;
            } else {
                oldname = [originalEmoji, " ", base, ".", extension].join("");
            }

            newname = [emoji, " ", base, ".", extension].join("");
            await this.app.storage.renameFile(oldname, newname);

            this.app.selectedFile.emoji = emoji;
            this.app.selectedFile.name = newname;
            this.app.selectedFilename = newname;

            this.app.pushToHistory(newname);
            this.app.requestRender();
        }

    }
}

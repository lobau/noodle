var CLIENT_ID = 'nqh4k19borzokuy';

function highlightSelected() {
    const selectedFile = new URLSearchParams(window.location.search).get('selectedFile');

    for (var i = 0; i < window.buttons.length; i++) {
        window.buttons[i].classList.remove("loading");
        if (window.buttons[i].dataset.filename == selectedFile) {
            window.buttons[i].classList.add("selected");
        } else {
            window.buttons[i].classList.remove("selected");
        }
    }
}

function loadFile(filePath) {
    var dbx = new Dropbox.Dropbox({
        accessToken: window.access_token
    });

    dbx.filesDownload({ path: '/' + filePath }).then(function (response) {
        var blob = response.result.fileBlob;
        var reader = new FileReader();
        console.log(filePath);
        highlightSelected();
        reader.addEventListener("loadend", function () {
            window.editor.setValue(reader.result);
            render();
        });
        reader.readAsText(blob);
    }).catch(function (error) {
        console.error(error);
    })
}

function newFile(filename) {
    var dbx = new Dropbox.Dropbox({
        accessToken: window.access_token
    });
    // TODO: better template
    const fileTemplate = `# Delete me and start writing
Consult [the Markdown Cheatsheet](https://www.markdownguide.org/cheat-sheet/) to get started.`
    let file = new File([fileTemplate], filename, { type: "text/plain" });

    dbx.filesUpload({ path: "/" + file.name, contents: file })
        .then(function (response) {
            // Update the URL parameters
            const searchParams = new URLSearchParams(location.search);
            searchParams.set('selectedFile', filename);
            location.search = searchParams.toString();
        })
        .catch(function (error) {
            console.error(error);
        });
}

function saveFile() {
    const UPLOAD_FILE_SIZE_LIMIT = 150 * 1024 * 1024;
    const textContent = window.editor.getValue();
    const selectedFile = new URLSearchParams(window.location.search).get('selectedFile');

    if (selectedFile && textContent) {
        var dbx = new Dropbox.Dropbox({
            accessToken: window.access_token
        });
        let file = new File([textContent], selectedFile, { type: "text/plain" });
        document.getElementById('status').innerHTML = "💾 Saving";

        if (file.size < UPLOAD_FILE_SIZE_LIMIT) {
            dbx
                .filesUpload({ path: "/" + file.name, contents: file, mode: 'overwrite', mute: true })
                .then(function (response) {
                    document.getElementById('status').innerHTML = "✅ Saved";
                    setTimeout(function () {
                        document.getElementById('status').innerHTML = "Editor";
                    }, 2000);
                })
                .catch(function (error) {
                    document.getElementById('save').className = "error";
                    document.getElementById('status').innerHTML = "❌ Error";
                    setTimeout(function () {
                        document.getElementById('save').className = "default";
                        document.getElementById('status').innerHTML = "Editor";
                    }, 3000);
                    console.error(error);
                });
        }
    }


    return false;
}

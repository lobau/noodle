var CLIENT_ID = 'nqh4k19borzokuy';

function loadFile(filePath) {
    var dbx = new Dropbox.Dropbox({
        accessToken: getAccessTokenFromUrl()
    });

    dbx.filesDownload({ path: '/' + filePath }).then(function (response) {
        var blob = response.result.fileBlob;
        var reader = new FileReader();
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
        accessToken: getAccessTokenFromUrl()
    });
    // TODO: better template than 40 + 2
    let file = new File(["40 + 2"], filename, { type: "text/plain" });

    dbx.filesUpload({ path: "/" + file.name, contents: file })
        .then(function (response) {
            // console.log(response);
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
            accessToken: getAccessTokenFromUrl()
        });
        let file = new File([textContent], selectedFile, { type: "text/plain" });
        document.getElementById('save').className = "saving";

        if (file.size < UPLOAD_FILE_SIZE_LIMIT) {
            dbx
                .filesUpload({ path: "/" + file.name, contents: file, mode: 'overwrite', mute: true })
                .then(function (response) {
                    document.getElementById('save').className = "saved";
                    setTimeout(function () {
                        document.getElementById('save').className = "default";
                    }, 3000);
                })
                .catch(function (error) {
                    document.getElementById('save').className = "error";
                    setTimeout(function () {
                        document.getElementById('save').className = "default";
                    }, 3000);
                    console.error(error);
                });
        }
    }


    return false;
}

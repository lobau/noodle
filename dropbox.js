function loadFile(filePath) {
    var dbx = new Dropbox.Dropbox({
        accessToken: getAccessTokenFromUrl()
    });

    dbx.filesDownload({ path: '/' + filePath }).then(function (response) {
        var blob = response.result.fileBlob;
        var reader = new FileReader();
        reader.addEventListener("loadend", function () {
            document.getElementById("math").value = reader.result;
            magic2math();
            // console.log(reader.result); // will print out file content
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
    let file = new File(["40 + 2"], filename, { type: "text/plain" });

    dbx.filesUpload({ path: "/" + file.name, contents: file })
        .then(function (response) {
            console.log(response);

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
    const textContent = document.getElementById("math").value;
    const selectedFile = new URLSearchParams(window.location.search).get('selectedFile');

    if (selectedFile && textContent) {
        var dbx = new Dropbox.Dropbox({
            accessToken: getAccessTokenFromUrl()
        });

        console.log(textContent);

        let file = new File([textContent], selectedFile, { type: "text/plain" });

        document.getElementById('save').className = "saving";

        if (file.size < UPLOAD_FILE_SIZE_LIMIT) {
            // File is smaller than 150 Mb - use filesUpload API
            dbx
                .filesUpload({ path: "/" + file.name, contents: file, mode: 'overwrite', mute: true })
                .then(function (response) {
                    // document.getElementById('save').textContent = "Saved!";
                    document.getElementById('save').className = "saved";
                    setTimeout(function () {
                        document.getElementById('save').className = "default";
                        // document.getElementById('save').textContent = "Save";
                    }, 3000);
                    // console.log(response);
                })
                .catch(function (error) {
                    document.getElementById('save').className = "error";
                    // document.getElementById('save').textContent = "Error!";
                    setTimeout(function () {
                        document.getElementById('save').className = "default";
                        // document.getElementById('save').textContent = "Save";
                    }, 3000);
                    console.error(error);
                });
        }
        // else {
        //     // File is bigger than 150 Mb - use filesUploadSession* API
        //     const maxBlob = 8 * 1000 * 1000; // 8Mb - Dropbox JavaScript API suggested max file / chunk size

        //     var workItems = [];

        //     var offset = 0;

        //     while (offset < file.size) {
        //         var chunkSize = Math.min(maxBlob, file.size - offset);
        //         workItems.push(file.slice(offset, offset + chunkSize));
        //         offset += chunkSize;
        //     }

        //     const task = workItems.reduce((acc, blob, idx, items) => {
        //         if (idx == 0) {
        //             // Starting multipart upload of file
        //             return acc.then(function () {
        //                 return dbx
        //                     .filesUploadSessionStart({ close: false, contents: blob })
        //                     .then((response) => response.session_id);
        //             });
        //         } else if (idx < items.length - 1) {
        //             // Append part to the upload session
        //             return acc.then(function (sessionId) {
        //                 var cursor = { session_id: sessionId, offset: idx * maxBlob };
        //                 return dbx
        //                     .filesUploadSessionAppendV2({
        //                         cursor: cursor,
        //                         close: false,
        //                         contents: blob
        //                     })
        //                     .then(() => sessionId);
        //             });
        //         } else {
        //             // Last chunk of data, close session
        //             return acc.then(function (sessionId) {
        //                 var cursor = { session_id: sessionId, offset: file.size - blob.size };
        //                 var commit = {
        //                     path: "/" + file.name,
        //                     mode: "add",
        //                     autorename: true,
        //                     mute: false
        //                 };
        //                 return dbx.filesUploadSessionFinish({
        //                     cursor: cursor,
        //                     commit: commit,
        //                     contents: blob
        //                 });
        //             });
        //         }
        //     }, Promise.resolve());

        //     task
        //         .then(function (result) {
        //             console.log("File uploaded");
        //         })
        //         .catch(function (error) {
        //             console.error(error);
        //         });
        // }
    }


    return false;
}
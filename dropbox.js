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
        // accessToken: getAccessTokenFromUrl(),
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
        // accessToken: getAccessTokenFromUrl(),
        accessToken: window.access_token
    });
    // TODO: better template than 40 + 2
    const fileTemplate = `# Sundown cheat cheet
Sundown is just plain Markdown, but with a twist. It can calculate things inline.
Imagine you want to calculate the price of a party, but it depends on a **lot** of factors, like the number of people showing up, the amount of food to order, etc. 
You might want to make a quick model. Let setup some variables:

## The pizza
{{
pizza_count = 5
price_per_pizza = 19
total_pizza_price = pizza_count * price_per_pizza
}}

## Price per guest
{{
guests_count = 10
pizza_per_guest = pizza_count / guests_count
price_per_guest = price_per_pizza * pizza_per_guest
}}

> To recap, we will have { guests_count } guests over, and we will order { pizza_count } pizza, for a total of \${ total_pizza_price } or \${ price_per_guest } per guest.

## Some random things it can do
{{
log(23) 
23 % of 1023 
200 sec + 120 % 
30 minutes + 34 day in sec 
cos(PI) 
speed = 27 kph 
speed in mps  
456 as hex
}}`
    let file = new File([fileTemplate], filename, { type: "text/plain" });

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
            // accessToken: getAccessTokenFromUrl(),
            accessToken: window.access_token
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

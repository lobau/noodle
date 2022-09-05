// function getAccessTokenFromUrl() {
//     const searchParams = new URLSearchParams(location.search);
//     return searchParams.get('access_token');
// }

function getAccessTokenFromUrl() {
    return utils.parseQueryString(window.location.hash).access_token;
}

function isAuthenticated() {
    return !!getAccessTokenFromUrl();
}

function stringToSeed(str) {
    var values = [];
    for (var i = 0, len = str.length; i < len; i++) {
        values.push(str.charCodeAt(i));
    }
    // concatenatte and coerce to integer 
    return values.join('') + 0;
}


function renderItems(items) {
    var filesContainer = document.getElementById('filelist');
    const selectedFile = new URLSearchParams(window.location.search).get('selectedFile');

    let possible_icons = ["📒", "📓", "📔", "📕", "📗", "📘", "📙"];

    items.forEach(function (item, index) {
        var button = document.createElement('button');
        var seed = stringToSeed(item.name) % possible_icons.length;
        // console.log(item.name, seed, seed % possible_icons.length);
        button.textContent = possible_icons[seed] + " " + item.name;
        if (selectedFile == item.name) {
            button.classList.add("selected");
        }
        button.addEventListener("click", function () {
            loadFile(item.name);

            // Update the URL parameters
            const searchParams = new URLSearchParams(location.search);
            searchParams.set('selectedFile', item.name);
            location.search = searchParams.toString();
        });
        filesContainer.appendChild(button);
    });

    var newFileButton = document.createElement('button');
    newFileButton.textContent = "➕ New sheet";
    newFileButton.addEventListener("click", function () {
        let epoch = new Date().valueOf();
        newFile(epoch);
    });
    filesContainer.appendChild(newFileButton);
}

function showPageSection(elementId) {
    document.getElementById(elementId).style.display = 'block';
}

if (isAuthenticated()) {
    showPageSection('authed-section');

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const selectedFile = urlParams.get('selectedFile');

    window.editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
        mode: "markdown",
        theme: "uxmap",
        scrollPastEnd: true,
        highlightActiveLine: true,
        lineNumbers: true,
        lineWrapping: true
    });
    window.editor.on('change', function (i, op) {
        localStorage.setItem("markdown", window.editor.getValue());
        render();
    });

    if (selectedFile) {
        loadFile(selectedFile);

    } else {
        // load the first item?
        // onboarding?
    }

    var dbx = new Dropbox.Dropbox({ accessToken: getAccessTokenFromUrl() });
    dbx.filesListFolder({ path: '' })
        .then(function (response) {
            renderItems(response.result.entries);
        })
        .catch(function (error) {
            console.error(error);
        });
} else {
    showPageSection('pre-auth-section');

    // Set the login anchors href using dbx.getAuthenticationUrl()
    var dbx = new Dropbox.Dropbox({ clientId: CLIENT_ID });
    var authUrl = dbx.auth.getAuthenticationUrl('https://lobau.io/ucalc/')
        .then((authUrl) => {
            document.getElementById('authlink').addEventListener('click', () => {
                window.location = authUrl;
            });
        })
}

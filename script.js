const setCookie = (name, value, hours = 4, path = '/') => {
    const expires = new Date(Date.now() + hours * 144e5).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=' + path + ';SameSite=Strict';
}

const getCookie = (name) => {
    return document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, '')
}

const deleteCookie = (name, path) => {
    setCookie(name, '', -1, path);
}

function isAuthenticated() {

    let access_token = utils.parseQueryString(window.location.hash).access_token;
    if (access_token) {
        // first, check if there is a hash in the url
        // if there is, that means the user just logged in and dropbox send us a new access token
        setCookie("access_token", access_token, 4, "/");
        window.access_token = access_token;
        window.history.pushState({ "access_token": access_token }, 'Sundown', '/');
        return true;
    } else if (getCookie("access_token")) {
        // If there is a valid token stored as a cookie, we're good
        access_token = getCookie("access_token");
        window.access_token = access_token;
        return true;
    } else if (window.access_token) {
        // If the window object already have a reference to access_token, we're good
        return true;
    } else {
        return false;
    }
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

    var newFileButton = document.createElement('button');
    newFileButton.innerHTML = "<span>✨</span><span>Create New Sheet</span>";
    newFileButton.addEventListener("click", function () {
        let epoch = new Date().valueOf();
        let filename = prompt('Filename (default is epoch)', epoch);
        if (filename) {
            newFile(filename + ".md");
        } else {
            newFile(epoch + ".md");
        }

    });
    filesContainer.appendChild(newFileButton);
    // filesContainer.appendChild(document.createElement('hr'));

    let possible_icons = ["📒", "📓", "📔", "📕", "📗", "📘", "📙"];
    window.buttons = [];

    items.forEach(function (item, index) {
        // is that a markdown file?
        if (item.name.split(".").reverse()[0] == "md") {
            var button = document.createElement('button');
            var seed = stringToSeed(item.name) % possible_icons.length;
            button.innerHTML = "<span>" + possible_icons[seed] + "</span><span>" + item.name + "</span>";
            button.dataset.filename = item.name;
            if (selectedFile == item.name) {
                button.classList.add("selected");
            }
            button.addEventListener("click", function () {
                loadFile(item.name);

                const searchParams = new URLSearchParams(location.search);
                searchParams.set('selectedFile', item.name);
                window.history.pushState({ "access_token": access_token }, 'Sundown', '/?' + searchParams.toString());

                button.classList.add("loading");
            });
            filesContainer.appendChild(button);
            window.buttons.push(button);
        }

    });
}

function showPageSection(elementId) {
    document.getElementById(elementId).style.display = 'block';
}

if (isAuthenticated()) {
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
        render();
    });

    if (selectedFile) {
        loadFile(selectedFile);
    }

    var dbx = new Dropbox.Dropbox({ accessToken: window.access_token });
    dbx.filesListFolder({ path: '' })
        .then(function (response) {
            renderItems(response.result.entries);
        })
        .catch(function (error) {
            console.error(error);
        });
} else {
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
    window.editor.setValue(`# Welcome to Sundown
Sundown is a markdown editor that supports inline calculations. Sundown is not a service, it doesn't have a server. It's just a local app. Here's [the source code](https://github.com/lobau/sundown).

## Inline calculations
Just assign variables and do calculations without breaking the flow of the text.
Let's say you have { pizza = 3 } pizza and { guests = 8 } guests, then each guest will have **{ pizza / guests } pizza**. 

## Calculation sheets
Sometimes, you need a table to show your calculations in more details:
{{
pizza = 8
guests = 17
unit_price = 12
per_guest = pizza / guests
price_per_guest = unit_price * per_guest
}}

> ‼️ Note that the variables are always global to the document.


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
}}


## Dropbox sync
You can sync your notes using your Dropbox if you want. It will create the folder **Dropbox / Apps / Sundown** and store each note as a _.md_ file.

> 🔒 The permissions are as limited as possible. Sundown can **only** access the **Dropbox / Apps / Sundown** folder (Dropbox, please improve your OAuth screen 🙏). You can even [register your own Dropbox app](https://developers.dropbox.com/) and change the app ID if you want nothing to do with me 😁

`);
    render();

    var filesContainer = document.getElementById('filelist');

    var welcomeDiv = document.createElement('div');
    welcomeDiv.style.cssText = `
        padding: 2rem;
    `;
    welcomeDiv.innerHTML = `<h1 style="margin-bottom: 1rem;"><span>🌆</span> Sundown</h1>
    <p>Markdown meet inline calculations.</p>
    `;
    filesContainer.appendChild(welcomeDiv);

    var dropboxButton = document.createElement('button');
    dropboxButton.id = "authlink";
    dropboxButton.innerHTML = "<span>🌏</span><span>Sign in with Dropbox</span>";
    filesContainer.appendChild(dropboxButton);

    var dbx = new Dropbox.Dropbox({ clientId: CLIENT_ID });
    let protocol;
    protocol = (window.location.hostname == "localhost") ? "http" : "https";
    currentHost = protocol + "://" + window.location.host;
    var authUrl = dbx.auth.getAuthenticationUrl(currentHost)
        .then((authUrl) => {
            document.getElementById('authlink').addEventListener('click', () => {
                window.location = authUrl;
            });
        })
}

document.addEventListener('keyup', function (event) {
    if (event.ctrlKey && event.key === 's') {
        preventDefault();
        saveFile();
    }

    if (window.saveTimer) {
        clearTimeout(window.saveTimer);
    }
    window.saveTimer = setTimeout(saveFile, 3000);
});
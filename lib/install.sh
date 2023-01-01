#!/bin/bash

echo "Downloading the libraries"

curl "https://unpkg.com/dropbox@10.32.0/dist/Dropbox-sdk.min.js" > ./dropbox.js
echo "⬇️ Installed dropbox.js"

curl "https://unpkg.com/marked@4.2.4/marked.min.js" > ./marked.js
echo "⬇️ Installed marked.js"

curl "https://unpkg.com/fcal@0.4.3/dist/fcal.js" > ./fcal.js
echo "⬇️ Installed fcal.js"

curl "https://unpkg.com/codemirror@5.63.1/lib/codemirror.js" > ./codemirror.js
echo "⬇️ Installed codemirror.js"

curl "https://unpkg.com/codemirror@5.63.1/mode/markdown/markdown.js" > ./markdown.js
echo "⬇️ Installed markdown.js"

curl "https://unpkg.com/codemirror@5.63.1/lib/codemirror.css" > ./codemirror.css
echo "⬇️ Installed codemirror.css"

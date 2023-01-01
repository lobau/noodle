# 🏕️ Sundown
Sundown is a markdown editor that supports inline calculations. 

## Inline calculations

In Sundown, if you type this:
```
Let's say you have { pizza = 3 } pizza and { guests = 8 } guests, then each guest will have **{ pizza / guests } pizza**.
```

it would render as:

Let's say you have 3 pizza and 8 guests, then each guest will have **0.375  pizza**.

## Calculation sheets
Sometimes, you need a table to show your calculations in more details.
```
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
```

In Sundown, it would render as:

| Exp                        | Value                 |
| -------------------------- | --------------------- |
| log(23)                    | 1.3617278360175928789 |
| 23 % of 1023               | 235.29                |
| 200 sec + 120 %            | 440 Seconds           |
| 30 minutes + 34 day in sec | 2,939,400 Seconds     |
| cos(PI)                    | -1                    |
| speed = 27 kph             | 27 km/h               |
| speed in mps               | 7.5 m/s               |
| 456 as hex                 | 456                   |

> ‼️ Note that the variables are always global to the document.

## Dropbox sync
You can sync your notes using your Dropbox if you want. It will create the folder **Dropbox / Apps / Sundown** and store each note as a _.md_ file.

> 🔒 The permissions are as limited as possible. Sundown can **only** access the **Dropbox / Apps / Sundown** folder (Dropbox, please improve your OAuth screen 🙏). You can even [register your own Dropbox app](https://developers.dropbox.com/) and change the app ID if you want nothing to do with me 😁

## Web 1.0
Sundown is just an html file, a couple css files, and a couple javascript files. It doesn't have a server app, it doesn't need one. You can download it and run it on your own computer, or host it anywhere you want.

## How to install
Just copy all the files in an http server and visit index.html. You will need to [register your own Dropbox app](https://developers.dropbox.com/) and change the CLIENT_ID variable in dropbox.js on line 1.

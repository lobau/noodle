const renderer = {
  link(href, title, text) {
    return `<a target="_blank" href="${href}" title="${title}">${text} ↗</a>`;
  }
};

marked.use({ renderer });

const render = () => {
  // Grab the current markdown
  let markdown = window.editor.getValue();
  let fcalEngine = new fcal.Fcal();

  // First replace the {{ }} pairs with inline table
  body_firstpass = markdown.replace(/{{(.*?)}}/gis, function (match, token) {
    // remove {{ and }} from the string
    let expression = match.slice(2,-2);
    let Lines = expression.split('\n');
    let Output = ["<table>"];
    for(var i = 0; i < Lines.length; i++) {
      if(Lines[i].trim() != '') {
        try {
          let result = fcalEngine.evaluate(Lines[i].toString()).toFormat();
          Output.push("<tr><td>" + Lines[i].trim() + "</td><td>" + result + "</td></tr>");
        }
        catch(err) {
          Output.push("Error parsing")
          console.error(err.message);
        }
      }
    }
    Output.push("</table>");
    return Output.join("\n");
  });

  // console.log(body_firstpass);

  // Then replace the { } with inline values
  body_secondpass = body_firstpass.replace(/{(.*?)}/gis, function (match, token) {
    // remove {{ and }} from the string
    let expression = match.slice(1,-1);
    // console.log(expression);
    let Lines = expression.split('\n');
    let Output = [];
    for(var i = 0; i < Lines.length; i++) {
      if(Lines[i].trim() != '') {
        try {
          Output.push(fcalEngine.evaluate(Lines[i].toString()).toFormat());
        }
        catch(err) {
          Output.push("Error parsing")
          console.error(err.message);
        }
      }
    }
    return Output.join("\n");
  });

  // console.log(body_secondpass);

  document.getElementById("render").innerHTML = marked.parse(body_secondpass);
  // document.getElementById("render").innerHTML = body;
};

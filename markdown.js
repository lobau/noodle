// const style = {
//   text: "#3F3A36",
//   border: "#DBDAD9",
//   accent: "#7B61BF",
//   typeface: `monospace`
// };

// const textbase = `font-family: ${style.typeface}; color:${style.text};`;

// const renderer = {
//   heading(text, level) {
//     let markup;
//     switch (level) {
//       case 1:
//         markup = `<h1 style="font-family: ${style.typeface}; font-size: 32px;">${text}</h1>`;
//         break;
//       case 2:
//         markup = `<h2 style="font-family: ${style.typeface}; font-size: 24px;">${text}</h2>`;
//         break;
//       case 3:
//         markup = `<h3 style="font-family: ${style.typeface}; font-size: 20px;">${text}</h3>`;
//         break;
//       case 4:
//         markup = `<h4 style="font-family: ${style.typeface}; font-size: 18px;">${text}</h4>`;
//         break;
//       case 5:
//         markup = `<h5 style="font-family: ${style.typeface}; font-size: 14px;">${text}</h5>`;
//         break;
//       default:
//         markup = `<h5 style="font-family: ${style.typeface}; font-size: 14px;">${text}</h5>`;
//     }
//     return markup;
//   },
//   paragraph(text) {
//     return `<p style="${textbase} font-size: 16px; line-height: 24px;">${text}</p>`;
//   },
//   table(header, body) {
//     return `
//           <table border="0" cellspacing="0" width="100%" style="width: 100%; padding: 0px; margin: 20px 0px; border-collapse: collapse;">
//               <thead style="${textbase} font-size: 14px; font-weight: bold; line-height: 24px; margin: 0px; padding: 0px;">${header}</thead>
//               <tbody style="${textbase} font-size: 16px; line-height: 24px; margin: 0px; padding: 0px;">${body}</tbody>
//           </table>
//       `;
//   },
//   tablerow(content) {
//     return `
//           <tr>${content}</tr>
//       `;
//   },
//   tablecell(content) {
//     return `
//           <td style="border: 1px solid ${style.border}; padding: 10px 10px;">${content}</td>
//       `;
//   },
//   blockquote(quote) {
//     return `<blockquote style="background: white; margin: 20px 0px 20px 0px; padding: 10px 15px 5px 15px; border: 1px solid ${style.border}; border-radius: 10px;">${quote}</blockquote>`;
//   },
//   image(href, title, text) {
//     return `<img style="margin: 20px 0px 10px 0px; border-radius: 10px;" width="100%" src="${href}" alt="${text}" title="${title}" />`;
//   },
//   link(href, title, text) {
//     return `<a target="_blank" style="color: ${style.accent}; font-weight: bold;" href="${href}" title="${title}">${text}</a>`;
//   },
//   list(body, ordered, start) {
//     return `<ul style="${textbase} font-size: 16px; line-height: 24px; margin: 20px 0px 20px 20px; padding: 0px;">${body}</ul>`;
//   },
//   listitem(text, task, checked) {
//     let markup;
//     if (task) {
//       if (checked) {
//         markup = `<li>Task checked ${text}</li>`;
//       } else {
//         markup = `<li>Task uncheckedchecked ${text}</li>`;
//       }
//     } else {
//       markup = `<li>${text}</li>`;
//     }
//     return markup;
//   }
// };

// marked.use({ renderer });

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
          Output.push("<tr><td>" + Lines[i].trim() + "</td><td>" + fcalEngine.evaluate(Lines[i].toString()).toFormat() + "</td></tr>");
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

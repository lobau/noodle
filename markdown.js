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

  body = markdown.replace(/{(.*?)}/gis, fcalEngine.evaluate("42  "));
  
  // console.log(newS);


  // https://stackoverflow.com/questions/413071/regex-to-get-string-between-curly-braces



  // let rawlines = markdown.slice(1);
  // let Lines = markdown.split("\n"); //cut each state
  // let Output = [];
  // const fcal = new Fcal();
  
  // var line;
  // for (let i = 0; i < Lines.length; i++) {
    // if(Lines[i].charAt(0) == "/") {
    //   line = fcalEngine.evaluate(Lines[i].slice(1)) + "  ";
    //   Output.push(line);
    // } else {
    //   Output.push(Lines[i]);
    // }
  // }

  // let body = Output.join("\n");

  document.getElementById("render").innerHTML = marked.parse(body);
  // document.getElementById("render").innerHTML = body;
};

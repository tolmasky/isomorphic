const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { extractCritical } = require("emotion-server");


module.exports = function ReactElementRender(element)
{
    const markup = renderToStaticMarkup(element);
    const { css } = extractCritical(markup);

    return markup.replace("</head>", `<style>${css}</style></head>`);
}

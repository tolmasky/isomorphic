const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const flush = require("styled-jsx/server").default;

module.exports = ReactElementRender;
module.exports.render = ReactElementRender;


function ReactElementRender(element)
{
    return renderToStaticMarkup(element) + renderToStaticMarkup(flush());
}

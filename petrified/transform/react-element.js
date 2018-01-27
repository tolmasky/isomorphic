const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

module.exports = ReactElementRender;
module.exports.render = ReactElementRender;


function ReactElementRender(element)
{
    return renderToStaticMarkup(element);
}

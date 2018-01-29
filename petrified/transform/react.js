const React = require("react");
const element = require("./react-element");

const { basename, dirname, extname } = require("path");

module.exports = ReactRender;
module.exports.render = ReactRender;


function ReactRender({ source, options })
{
    const Component = require(source);
    const output = element.render(React.createElement(Component, options.props || { }));

    return { contents: output };
}


module.exports.extensions = new Set(["js", "jsx"]);
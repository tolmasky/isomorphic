const React = require("react");
const render = require("./react-element");


module.exports = function ReactRender({ source, options })
{
    const Component = require(source);
    const output = render(React.createElement(Component, options.props || { }));

    return { contents: output };
}

module.exports.extensions = new Set(["js", "jsx"]);

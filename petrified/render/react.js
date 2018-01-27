const React = require("react");
const element = require("./react-element");


module.exports = ReactRender;
module.exports.render = ReactRender;


function ReactRender({ source })
{
    const Component = require(source);
    const output = element.render(React.createElement(Component));

    return { contents: output };
}

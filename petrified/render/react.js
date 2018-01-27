const React = require("react");
const element = require("./react-element");


module.exports = ReactRender;
module.exports.render = ReactRender;


function ReactRender({ source })
{
    const Component = require(source);

    return { markup: element.render(React.createElement(Component)) };
}

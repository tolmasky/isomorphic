const React = require("react");
const element = require("./react-element");

const { basename, dirname, extname } = require("path");

module.exports = ReactRender;
module.exports.render = ReactRender;


function ReactRender({ source, destination })
{
    const Component = require(source);
    const output = element.render(React.createElement(Component));

    const nojs = basename(source, extname(source));
    const modified = !!extname(nojs) ?
        `${dirname(destination)}/${nojs}` :
        `${dirname(destination)}/${nojs}/index.html`

    return { contents: output, metadata: { destination: modified } };
}


module.exports.extensions = new Set(["js", "jsx"]);
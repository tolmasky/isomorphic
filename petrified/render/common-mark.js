const parser = new (require("commonmark").Parser)();
const ReactRenderer = require("commonmark-react-renderer");

module.exports = CommonMarkRender;
module.exports.render = CommonMarkRender;


function CommonMarkRender({ markdown, components })
{
    return new ReactRenderer({ renderers }).render(markdown);
}

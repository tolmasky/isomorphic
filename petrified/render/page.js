
const { extname } = require("path");
const markdown = require("./markdown");
const react = require("./react");

const extensions =
{
    markdown: new Set([".markdown", ".md"]),
    react: new Set([".js", ".jsx"])
}


function PageRender({ source, metadata })
{
    const extension = extname(source);

    if (extensions.markdown.has(extension))
        return markdown.render({ source, metadata });

    if (extensions.react.has({ source, metadata }))
        return react.render({ source, metadata });

    return null;
}

module.exports = PageRender;
module.exports.render = PageRender;


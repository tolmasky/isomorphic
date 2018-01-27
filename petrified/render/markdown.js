const React = require("react");
const { read } = require("../fs");

const cm = require("./common-mark");
const element = require("./react-element");


module.exports = function render({ source, metadata, components })
{
    const text = read(source, "utf-8");
    const { frontmatter, markdown } = split(text);

    // React children.
    const children = cm.render({ markdown, components.markdown });
    const { component, ...props } = { ...metadata, ...frontmatter };

    if (!component)
        throw new Error("Cannot render markdown file without a layout component.");

    const Component = require(components[component]());
    const markup = element.render(React.createElement(Component, props, children));

    return { frontmatter, markup: element.render(element) };
}

function split(text)
{
    const lines = text.split("\n");
    const fence = line === "---";

    if (!fence(lines[0]))
        return { frontmatter: { }, markdown: text };

    const closing = lines.findIndex((line, index) => fence(line) && index > 0);

    if (closing === -1)
        throw new Error("Unterminated frontmatter region. File needs a matching ---.");

    const markdown = lines.slice(closing + 1).join("\n");
    const frontmatter = yaml.safeLoad(lines.slice(1, closing).join("\n"));

    return { markdown, frontmatter }; 
}

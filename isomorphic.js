
const React = require("react");
const { createElement, Children } = require("react");
const { renderToString, renderToStaticMarkup } = require("react-dom/server");
const toHTMLSafeText = x => encodeURIComponent(JSON.stringify(x));
console.log("HEY");
module.exports = function ({ URL, entrypoint, props, children, ...rest })
{
    const isomorphic = renderToString(children);
    const __html = isomorphic;

    return  [
                <div { ...rest } dangerouslySetInnerHTML = { { __html } } />,
                <script src = { URL }
                    data-props = { toHTMLSafeText(props || { }) }
                    data-entrypoint = { toHTMLSafeText(entrypoint) } />
            ];
}

module.exports.find = function findIsomorphic(element)
{
    if (!element || typeof element !== "object")
        return false;

    if (element.type+"" === module.exports+"")
        return element;

    for (const child of Children.toArray(element.props.children))
    {
        const isomorphic = findIsomorphic(child);

        if (isomorphic)
            return isomorphic;
    }

    return false;
}

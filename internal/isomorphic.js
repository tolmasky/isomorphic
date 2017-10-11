
const React = require("react");
const { createElement, Children } = require("react");
const { renderToString, renderToStaticMarkup } = require("react-dom/server");
const toHTMLSafeText = x => encodeURIComponent(JSON.stringify(x));
const onServer = typeof window === "undefined";

module.exports = function ({ entrypoint, children, props, URL, ...rest })
{
    // This gets us our data-reactroot property.
    const __html = renderToString(children);

    return  [
                <div { ...rest } dangerouslySetInnerHTML = { { __html } } />,
                <script src = { URL }
                    data-props = { toHTMLSafeText(props || { }) }
                    data-entrypoint = { toHTMLSafeText(entrypoint) } />
            ];
}

console.log("HEY");

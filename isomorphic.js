
const React = require("react");
const { renderToString, renderToStaticMarkup } = require("react-dom/server");
const toHTMLSafeText = x => encodeURIComponent(JSON.stringify(x));

module.exports = function ({ URL, props, children, ...rest })
{console.log(arguments);
    const isomorphic = renderToString(children);
    const bootstrap = renderToStaticMarkup(
        <script src = { URL }
                data-props = { toHTMLSafeText(props) }
                data-entrypoint = { toHTMLSafeText(URL) } />);
    const __html = isomorphic + bootstrap;

    return  <div { ...rest } dangerouslySetInnerHTML = { { __html } } />;
}

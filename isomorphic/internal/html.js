
const Module = require("module");

const React = require("react");
const { renderToString, renderToStaticMarkup } = require("react-dom/server");
const toHTMLSafeText = x => encodeURIComponent(JSON.stringify(x));
const inject = require("./inject-until-isomorphic")(serialize);


module.exports = function _html({ entrypoint2, entrypoint, __filename, URL, ...rest })
{
    const module = Object.assign(new Module(__filename), { filename: __filename });
    const Component = module.require(entrypoint2);
    const __injected_props = { entrypoint, URL, props: rest }; 

    return inject(React.createElement(Component, rest), __injected_props);
}

function serialize(element)
{
    if (!element ||
        typeof element !== "object" ||
        element.type !== "isomorphic")
        return element;

    // This gets us our data-reactroot property.
    const { __injected_props, children, ...rest } = element.props;

    const { URL, props, entrypoint } = __injected_props;
    const __html = renderToString(children);

    return  [
                <div { ...rest } dangerouslySetInnerHTML = { { __html } } />,
                <script src = { URL }
                    data-props = { toHTMLSafeText(props || { }) }
                    data-entrypoint = { toHTMLSafeText(entrypoint) } />
            ];
}

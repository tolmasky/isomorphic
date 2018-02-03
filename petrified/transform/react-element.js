const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { extractCritical } = require("emotion-server");
const inject = require("isomorphic-inject");


module.exports = function ReactElementRender(element, assets)
{
    const markup = renderToStaticMarkup(inject(element, definitions, { assets }));
    const { css } = extractCritical(markup);

    return markup.replace("</head>", `<style>${css}</style></head>`);
}

const definitions =
{
    "link": asset("href"),
    "script": asset("src"),
    "img": asset("src")
}

function asset(key, element, shadowProps)
{
    if (arguments.length < 2)
        return (element, shadowProps) =>
            asset(key, element, shadowProps);

    const { metadata: { assets = { } } } = shadowProps;
    const { type, props } = element;
    const { [key]: href } = props;

    if (!assets[href])
        return element;
    
    const { checksum } = assets[href];
    const integrity = checksum;
    const bustedURL = href + `?integrity=${integrity}`;
    const crossOrigin = "anonymous";

    return createElement(type,
        { ...props, integrity, [key]: bustedURL, crossOrigin });
}

const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { extractCritical } = require("emotion-server");
const inject = require("isomorphic-inject");

const url = require("url");
const querystring = require("querystring");
global.total = 0;
global.count = 0;

module.exports = function ReactElementRender(element, assets)
{const start = new Date();
    const markup = renderToStaticMarkup(inject(element, definitions, { assets }));
    global.total += new Date() - start;
    global.count ++;
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

    const parts = url.parse(href);

    if (parts.hostname === "")
        return element;

    const { checksum } = assets[parts.pathname];
    const bustedSearch = querystring.stringify(
        { ...querystring.parse(parts.query || ""),
            "integrity": checksum });
    const bustedURL = url.format({ ...parts, search: bustedSearch });

    return createElement(type,
        { ...props, [key]: bustedURL });
}

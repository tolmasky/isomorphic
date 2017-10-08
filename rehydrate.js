
const isomorphic = require("./isomorphic");
const { hydrate } = require("react-dom");
const fromHTMLSafeText = string => JSON.parse(decodeURIComponent(string));
const { dataset, previousSibling } = getScriptTag();
const props = fromHTMLSafeText(dataset.props) || { };
const html = require(fromHTMLSafeText(dataset.entrypoint))(props);

hydrate(isomorphic.find(html).props.children, previousSibling);

function getScriptTag()
{
    return document.currentScript || (function (scripts)
    {
        return scripts[scripts.length - 1];
    })(document.getElementsByTagName("script"));
}
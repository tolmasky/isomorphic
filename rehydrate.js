
const React = require("react");
const { hydrate } = require("react-dom");
const fromHTMLSafeText = string => JSON.parse(decodeURIComponent(string));
const { dataset, previousSibling } = getScriptTag();

const props = fromHTMLSafeText(dataset.props) || { };
const Entrypoint = require(fromHTMLSafeText(dataset.entrypoint));
const spectate = require("./internal/spectate");

hydrate(spectate(<Entrypoint { ...props } />), previousSibling);

function getScriptTag()
{
    return document.currentScript || (function (scripts)
    {
        return scripts[scripts.length - 1];
    })(document.getElementsByTagName("script"));
}

const { createElement } = require("react");
const { hydrate } = require("react-dom");

const fromHTMLSafeText = string => JSON.parse(decodeURIComponent(string));
const { dataset, previousSibling } = getScriptTag();

const props = fromHTMLSafeText(dataset.props) || { };
const Entrypoint = require(fromHTMLSafeText(dataset.entrypoint));

const inject = require("./inject-until-isomorphic")(ignore);
const entrypoint = createElement(Entrypoint, props);


hydrate(inject(entrypoint), previousSibling);

function getScriptTag()
{
    return document.currentScript || (function (scripts)
    {
        return scripts[scripts.length - 1];
    })(document.getElementsByTagName("script"));
}

function ignore(element)
{
    if (!element || typeof element !== "object")
        return false;

    if (element.type === "title")
    {
        document.title = element.props.children;

        return false;
    }

    return element.props.children;
}


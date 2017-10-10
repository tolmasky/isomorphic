
const React = require("react");
const { createElement } = require("react");

const hasOwnProperty = Object.prototype.hasOwnProperty;
const isomorphic = require("./isomorphic");
const onServer = typeof window === "undefined";


module.exports = function _html({ children, entrypoint, ...rest })
{
    const FIXME = require("../test-component");
    const props = { entrypoint: "/test-component.js", ...rest };
    
    return reify(props, <FIXME { ...props }>{ children }</FIXME>);
}

function reify(forwarded, children)
{
    return reify(children);

    function reify(element)
    {
        if (typeof element === "undefined" ||
            typeof element === "string" ||
            typeof element === "number")
            return element;

        if (Array.isArray(element))
            return element.map(reify);

        const { type, props } = element;

        // If we've found the isomorphic tag, consider it a boundary:
        // don't reify further!
        if (type === "isomorphic")
            return createElement(isomorphic, { ...props, ...forwarded });

        const hasChildren = hasOwnProperty.call(props, "children");
        const children = hasChildren && reify(props.children);
        const reifiedProps = { ...props, ...(hasChildren && { children }) };

        if (typeof type === "string")
            return createElement(type, reifiedProps);

        if (Object.getPrototypeOf(type) === Function.prototype)
            return reify(type(reifiedProps));

        return reify((new type(reifiedProps)).render());
    }
}

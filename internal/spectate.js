
const { createElement } = require("react");


module.exports = spectate;

function spectate(element)
{console.log("IN FOR", element);
    if (typeof element === "undefined" ||
        typeof element === "string" ||
        typeof element === "number")
        return false;

    if (Array.isArray(element))
        return element.map(spectate).filter(x => x);

    const { type, props } = element;

    // If we've found the isomorphic tag, consider it a boundary:
    // don't purge further!
    if (type === "isomorphic")
        return props.children;

    if (typeof type === "string")
    {
        if (type === "title")
            document.title = props.children;

        if (!hasOwnProperty.call(props, "children"))
            return false;

        return spectate(props.children);
    }

    return createElement(getSpectator(type), props);
}

function getSpectator(Component)
{
    if (Component.__spectator)
        return Component.__spectator;

    const prototypeOf = Object.getPrototypeOf(Component);
    const isClassComponent = prototypeOf !== Function.prototype;
    const render = isClassComponent ?
        Component.prototype.render : Component;

    Component.__spectator = class Spectator extends Component
    {
        render()
        {
            return spectate(render.apply(this));
        }
    }

    return Component.__spectator;
}


const { createElement } = require("react");

var injectionCounter = 0;


module.exports = function inject(handler)
{
    const uid = injectionCounter++;

    return inject;

    function inject(element, __injected_props)
    {
        if (!element || typeof element !== "object")
            return handler(element);

        if (Array.isArray(element))
            return element.map(child => inject(child, __injected_props));
    
        const { type, props } = element;
        const modifiedProps = __injected_props ?
            { ...props, __injected_props } : props;

        if (typeof type !== "string")
            return createElement(Injected(type), modifiedProps);

        if (type === "title")
            return handler(element);

        if (type === "isomorphic") 
            return handler(createElement(type, modifiedProps));
    
        const hasChildren = hasOwnProperty.call(props, "children");
        const children = hasChildren && { children: inject(props.children, __injected_props) };

        return handler(createElement(type, { ...props, ...children }));
    }

    function Injected(Component)
    {
        if (Component.__injectionCache &&
            Component.__injectionCache[injectionCounter])
            return Component.__injectionCache[injectionCounter];

        const prototypeOf = Object.getPrototypeOf(Component);
        const isClassComponent = prototypeOf !== Function.prototype;
        const render = isClassComponent ?
            Component.prototype.render : Component;

        if (!Component.__injectionCache)
            Component.__injectionCache = { };

        Component.__injectionCache[uid] = class Injected extends Component
        {
            render()
            {
                const rendered = render.apply(this);

                return inject(rendered, this.props.__injected_props);
            }
        };

        return Component.__injectionCache[uid];
    }
}


const { isValidElement, createElement } = require("react");

const isArray = Array.isArray;
const ArrayMap = Array.prototype.map;
const hasOwnProperty = Object.prototype.hasOwnProperty;

const CacheSymbol = Symbol("Injected Component");
const ShadowProps = "__shadow_props";


module.exports = function inject(element, definitions, metadata)
{
    return injectShadowProps(element, { definitions, metadata }, true);   
}

function injectShadowProps(element, shadowProps, injectComponents)
{
    const { definitions } = shadowProps;

    const falseDefinition = definitions[":false"];
    const undefinedDefinition = definitions[":undefined"];
    const stringDefinition = definitions[":string"];

    if (element === false)
        return !falseDefinition ? element :
            falseDefinition(element, shadowProps, injectComponents);

    if (element === undefined)
        return !undefinedDefinition ? element :
            undefinedDefinition(element, shadowProps, injectComponents);

    if (typeof element === "string")
        return !stringDefinition ? element :
            stringDefinition(element, shadowProps, injectComponents);

    if (isArray(element))
        return ArrayMap.call(element,
            element => injectShadowProps(element, shadowProps, injectComponents));

    if (!isValidElement(element))
        return element;

    const { type } = element;

    if (typeof type !== "string")
        return injectComponents ?
            createElement(Injected(type, true),
                { ...element.props, [ShadowProps]: shadowProps }) :
            element;

    const { props } = element;
    const hasChildren = hasOwnProperty.call(props, "children");

    if (!hasChildren)
        return hasOwnProperty.call(definitions, type) ?
            (0, definitions[type])(element, shadowProps) : element;

    const children = injectShadowProps(props.children, shadowProps, false);
    const recursed = createElement(type, { ...props, children });

    return hasOwnProperty.call(definitions, type) ?
        (0, definitions[type])(recursed, shadowProps) : recursed;
}

function Injected(Component, cache)
{
    if (cache)
        return  Component[CacheSymbol] ||
                (Component[CacheSymbol] = Injected(Component));

    if (Object.getPrototypeOf(Component) === Function.prototype)
        return (...args) =>
            injectShadowProps(Component(...args), args[0][ShadowProps], true);

    const render = Component.prototype.render;
    
    return class Injected extends Component
    {
        render()
        {
            const shadowProps = this.props[ShadowProps];
            const rendered = render.apply(this);

            return injectShadowProps(rendered, shadowProps, true);
        }
    };
}


const ARROW_REG_EXP = /^([$A-Z_][0-9A-Z_$]*)\s+=>/i;
const hasOwnProperty = Object.prototype.hasOwnProperty;

const { getArguments: attrs } = require("generic-jsx");
const match = (string, rhs) =>
    typeof rhs === "string" ? string === rhs : rhs.test(string);


module.exports.define = function define(callback)
{
    const source = callback.toString();
    const matches = source.match(ARROW_REG_EXP);
    const name = [matches && matches[1] || "untitled"];

    const definitions = callback(update);
    const routes = Object.keys(definitions)
        .map(key => route(key.split(/\s*->\s*/), definitions[key]));

    return Object.defineProperty(update, "name", { value: name });

    function update(state, event, push)
    {
        const { status, children } = attrs(state);

        if (event.name !== "update-child")
            return handle(routes, state, event, push, true);

        const { ref, child } = event;
        const index = children.findIndex(child => attrs(child).ref === ref);

        const updatedStatus = attrs(child).status;
        const currentStatus = attrs(children[index]).status;            
        const updatedChildren = children.slice();

        updatedChildren.splice(index, 1, child);

        const updated = <state children = { updatedChildren } />;
        const bubbled = { name: `#${ref}:${updatedStatus}` };

        return handle(routes, updated, bubbled, push, false);
    }
}

function handle(routes, state, event, push, required)
{
    const { status } = attrs(state);
    const handler = routes.find(route =>
        match(status, route[0]) &&
        match(event.name, route[1]));

    if (!handler && !required)
        return state;

    if (!handler)
        throw new Error(`<${state.name}/> has no handler for event ` +
                        `"${event.name}" while in "${status}"`);

    const [_, __, update] = handler;

    if (typeof update === "string")
        return <state status = { update } />;

    return update(state, event, push);
}

function route([status, event], handler)
{
    const parse = string => (matches =>
        matches ? new RegExp(matches[1]) : string)
        (string.match(/^\/(.*)\/$/));
        
    return [parse(status), parse(event || ""), handler];
}

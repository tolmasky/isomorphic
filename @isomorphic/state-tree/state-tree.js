
const ARROW_REG_EXP = /^([$A-Z_][0-9A-Z_$]*)\s+=>/i;
const hasOwnProperty = Object.prototype.hasOwnProperty;

const { getArguments: attrs } = require("generic-jsx");


module.exports.define = function define(callback)
{
    const source = callback.toString();
    const matches = source.match(ARROW_REG_EXP);
    const name = [matches && matches[1] || "untitled"];

    const definitions = callback(update);
    const handlers = Object.keys(definitions)
        .map(key => [key.split(/\s*->\s*/), definitions[key]])
        .reduce(route, Object.create(null));

    return Object.defineProperty(update, "name", { value: name });

    function update(state, event, push)
    {
        const { status, children } = attrs(state);

        if (event.name !== "update-child")
            return handle(handlers[status], state, event, push);

        const { ref, child } = event;
        const index = children.findIndex(child => attrs(child).ref === ref);

        const updatedStatus = attrs(child).status;
        const currentStatus = attrs(children[index]).status;            
        const updatedChildren = children.slice();

        updatedChildren.splice(index, 1, child);

        const updated = <state children = { updatedChildren } />;
        const bubbled = { name: `#${ref}:${updatedStatus}` };

        return handle(handlers[status], updated, bubbled, push);
    }
}

function handle(handlers, state, event, push)
{
    const { name } = event;
    const route = handlers.find(([compare]) =>
        typeof compare === "string" ?
            compare === name : compare.test(name));

    if (!route)
        throw new Error(`${state.name} has no handler for event ` +
                        `${name} while in ${attrs(state).status}`);

    const [_, handler] = route;

    if (typeof handler === "string")
        return <state { ...attrs(state) } status = { handler } />;

    return handler(state, event, push);
}

function route(states, [[status, event], handler])
{
    const state = states[status] || [];

    if (event)
    {
        const matches = event.match(/^\/(.*)\/$/);
        const route = matches ? new RegExp(matches[1]) : event;

        state.push([route, handler]);
    }

    return Object.assign(states, { [status]: state });
}

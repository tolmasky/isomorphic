const program = require("./program");
const hasOwnProperty = Object.prototype.hasOwnProperty;
const isArray = Array.isArray;
const tick = { name: "immediate-tick", ignorable: true };


module.exports = function machine(definitions, start, pull)
{
    const push = program(start, function exhaust(previous, event)
    {
        const { name } = previous;

        if (!hasOwnProperty.call(definitions, name))
            throw new Error(`State ${name} does not exist.`);

        const handler = definitions[name];
        const state = handle(handler, previous, event, fire, true);

        return state === previous ? state : exhaust(state, tick);
    }, pull);
    const fire = (name, data, ignorable = false) =>
        setImmediate(() => push({ name, data, ignorable, timestamp: Date.now() }));

    return fire;
}

function handle(handler, state, event, push, route)
{
    const type = typeof handler;

    if (type === "function")
        return toState(state, handler(state, event, push));

    if (type === "string")
        return toState(state, handler);

    if (!route || type !== "object")
        throw new TypeError(`${state.name} handler can't be ${type}.`);

    const key = event.name;

    if (!hasOwnProperty.call(handler, key))
        if (event.ignorable)
            return state;
        else
            throw new Error(`State "${name}" can't handle event "${key}"`);

    return handle(handler[key], state, event, push, false);
}

function toState({ data }, result)
{
    const type = typeof result;

    if (type === "string")
        return { name: result, data };

    if (isArray(result))
        return { name:result[0], data:result[1] };

    return result;
}

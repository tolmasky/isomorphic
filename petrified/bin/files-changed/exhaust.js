
const program = require("./program");
const tick = { name: "immediate-tick" };

const { hasOwnProperty } = Object.prototype;


module.exports = function exhaust(states, name, pull)
{
    const start = toState(null, name, { timestamp: Date.now() });
    const push = program(start, function exhaust(previous, event)
    {
        const next = handle(states, previous, event, fire);

        return next !== previous ? exhaust(next, tick) : previous;
    }, pull);
    const fire = (name, data) => setImmediate(() => 
        push({ name, data, timestamp: Date.now() }));

    return fire;
}

function toState(previous, input, { timestamp })
{
    const type = typeof input;

    if (type === "string")
        return { name: input, timestamp };

    if (type === "undefined")
        return previous;

    if (Array.isArray(input))
        return { name: input[0], data: input[1], timestamp };

    return input;
}

function handle(states, previous, event, push)
{
    const name = previous.name;

    if (!hasOwnProperty.call(states, name))
        throw new Error(`No state found with name ${name}`);

    const definition = states[name];
    const type = typeof definition;

    if (type === "function")
        return toState(previous, definition(previous, event, push), event);

    if (type !== "object")
        throw new Error(`Invalid state definition for ${name}`);

    const route = definition[event.name];
    const rtype = typeof route;
    
    if (rtype === "function")
        return toState(previous, route(previous, event, push), event);

    if (rtype === "string")
        return toState(previous, route, event);

    if (rtype === "undefined")
        return previous;

    throw new Error(`Invalid state result for ${name}`);
}

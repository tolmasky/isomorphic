const program = require("./program");
const hasOwnProperty = Object.prototype.hasOwnProperty;
    

module.exports = function machine(definitions, start, pull)
{
    const state = { name: start, data: undefined };
    const push = program(state, function update(previous, event, push)
    {
        const { name, ignorable } = event;
        const state = handle(previous, event);

        if (state.name !== previous.name)
            return handle(state, ":enter", event, true);

        return state;
    }, pull);
    const fire = (name, data, ignorable = false) =>
        setImmediate(() => push({ name, data, ignorable, timestamp: Date.now() }));

    return fire;

    function handle(state, ...rest)
    {
        const [key, event, ignorable] = rest.length > 2 ?
            rest : [rest[0].name, rest[0], rest[0].ignorable];
        const name = state.name;

        if (!hasOwnProperty.call(definitions, name))
            throw new Error(`State ${name} does not exist.`);

        const handlers = definitions[name];

        if (!hasOwnProperty.call(handlers, key))
            if (ignorable)
                return state;
            else
                throw new Error(`State "${name}" can't handle event "${key}"`);

        const handler = handlers[key];
        const result = handler(state, event, fire);
        const type = typeof result;

        if (type === "string")
            return { name: result, data: state.data };

//        if (type !== "function")
//            throw new Error(`Bad handler for state "${name}" and event "${key}"`);

        return { name:result[0], data:result[1] };
    }
}



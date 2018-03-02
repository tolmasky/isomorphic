
const hasOwnProperty = Object.prototype.hasOwnProperty;
const ReplaceChildEvent = "replace-child";
const update = require("./update");

module.exports = state;

function state(name)
{
    return "state:" + name;
}

state.on = function on(name)
{
    return name;
}

state.state = state;

state.property = function (name)
{
    return "property:" + name;
}

state.property.child = function (name)
{
    return "property.child:" + name;
}

state.machine = function machine([name], declarations)
{
    if (arguments.length < 2)
        return declarations => machine([name], declarations);

    const properties = Object.create(null);
    const children = Object.create(null);
    const states = Object.create(null);
    const init = declarations["init"];

    properties["state"] = "string";

    for (const key of Object.keys(declarations))
        if (/^property:.*$/.test(key))
            properties[key.substr("property:".length)] = declarations[key];
        else if (/^property\.child:.*$/.test(key))
            children[key.substr("property.child:".length)] = declarations[key];
        else if (/^state:.*$/.test(key))
            states[key] = declarations[key];

    constructor.properties = properties;
    constructor.children = children;
    constructor.states = states;
    constructor.init = init;
    constructor.update = state.machine.update;

    return Object.defineProperty(constructor, "name", { value: name });

    function constructor(data)
    {
        if (!(this instanceof constructor))
            return new constructor(data);

        for (const key of Object.keys(data))
            this[key] = data[key];

        if (!hasOwnProperty.call(data, "state"))
            this.state = "initial";

        return update.init(this);
    }
}

state.machine.update = function update (record, event)
{
    const { state } = record;
    const Type = Object.getPrototypeOf(record);
    const { name, states } = Type.constructor;
    const events = states["state:" + state];

    if (event.name !== ReplaceChildEvent)
    {
        if (!events || !hasOwnProperty.call(events, event.name))
            if (event.name.toString().startsWith("#"))
                return record;
            else
                throw new Error(`State ${name}.${state} can't handle event ${event.name.toString()}.`);

        return events[event.name](record, event);
    }

    const { key, child } = event.data;

    const previousChildEvent = record[key].event;
    const proposedChildEvent = child.event;

    const updatedRecord = Object.assign(
        Object.create(Type),
        record,
        { [key]: child });

    if (previousChildEvent === proposedChildEvent)
        return updatedRecord;

    const stateChange = `#${key}.${proposedChildEvent.name}`;

    return update(updatedRecord, { ...event, name:stateChange });
}

module.exports = state;

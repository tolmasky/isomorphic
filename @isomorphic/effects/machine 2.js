const metadata = require("./metadata");
const update = require("./update");
const { base, attrs } = require("./generic-jsx");
const effect = require("./effect");

const EffectSymbol = Symbol("effect");

const events = {
    refed: (child, { name, ...rest }) =>
        ({ name: `#${attrs(child).ref}.${name}`, ...rest }),
    replace: (index, child, { timestamp }) => 
        ({ name: "replace-child", data: { child, index }, timestamp }),
    effect: (name, data, effect, timestamp) => 
        ({ name:EffectSymbol, data: { event: { name, data, timestamp: Date.now() }, effect } })
}

const updates = {
    "replace-child": replaceChild,
    "start": start,
    [EffectSymbol]: (state, { data }) =>
        bubble(state, data.event, data.effect)
}


module.exports = <machine effects = { Object.create(null) } />;

function machine(state, event)
{
    const update = updates[event.name] || unrecognizedEvent;
    const updated = update(state, event);

    if (updated === state)
        return state;

    const updatedEffects = updateEffects(
        attrs(state).effects,
        metadata(updated).effects,
        attrs(state).push);

    return <updated effects = { updatedEffects } />;
}

function start(state, event)
{
    const status = "running";
    const effects = Object.create(null);
    const children = attrs(state).children.map(update.autostart);

    return <state { ...{ status, effects, children } } />;
}

function unrecognizedEvent(state, event)
{
    throw Errors.UnrecognizedEvent(event.name);
}

function updateEffects(active, referenced, push)
{
    const removed = Object.keys(active)
        .filter(key => !referenced[key]);

    const added = Object.keys(referenced)
        .filter(key => !active[key]);

    if (removed.length === 0 && added.length === 0)
        return active;

    const updated = Object.create(null);

    for (const key of Object.keys(active))
    {
        if (referenced[key])
            effects[key] = active[key];

        else if (active[key].cancel)
            active[key].cancel();
    }

    for (const key of Object.keys(referenced))
    {
        if (active[key])
            continue;

        const { start } = referenced[key];

        updated[key] = start((name, data, callback) =>
            setImmediate(() =>
            {
                push(events.effect(name, data, key));
                
                if (callback)
                    callback();
            }));
    };

    return updated;
}

function bubble (state, event, euuid)
{
    const { indexes } = metadata(state).effects[euuid];

    if (!indexes)
        throw Errors.UnrecognizedEvent(event.name);

    return indexes.reduce(function (state, index)
    {
        const { children } = attrs(state);
        const child = children[index];

        if (base(child) === effect && metadata(child).uuid)
            return update(state, events.refed(child, event));

        const updatedChild = bubble(child, event, euuid);

        if (child === updatedChild)
            return state;

        return update(state, events.replace(index, updatedChild, event));
    }, state);
}

function replaceChild(state, event)
{
    const { children } = attrs(state);
    const { child, index } = event.data;
    const nextChildren = children.slice();

    nextChildren.splice(index, 1, child);

    return <state children = { nextChildren } />;
}

const Errors = {
    UnrecognizedEvent: name => new Error(`State machine does not recognized event ${name}.`),
    NoRefEvent: (state, name) => new Error(`Effect ${state.name} must have a ref property.`)
}


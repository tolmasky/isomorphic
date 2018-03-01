const metadata = require("./metadata");
const update = require("./update");
const { base, attrs } = require("./generic-jsx");
const Effect = require("./effect");
const { state, on, property } = require("./state");

const MakeEmpty = () => Object.create(null);

const EffectSymbol = Symbol("effect");

const events = {
    refed: (key, child, { name, ...rest }) =>
        ({ name: `#${key}.${name}`, ...rest }),
    replace: (key, child, timestamp) => 
        ({ name: "replace-child", data: { child, key }, timestamp }),
    effect: (name, data, effect, timestamp) => 
        ({ name:EffectSymbol, data: { event: { name, data, timestamp }, effect, timestamp } })
}

const manager = state.machine `EffectsManager`
({
    [property `next-unique-effect-uuid`]: "number",
    [property `effects`]: "object",
    [property `push`]: "function",

    [property.child `root`]: "object",

    ["init"]: update
        .prop("next-unique-effect-uuid", 0)
        .prop("effects", MakeEmpty()),

    [state `initial`]:
    {
        [on `start`]: (manager, { timestamp }) =>
            updateEffects(manager, timestamp),

        [on (EffectSymbol)]: (manager, { data, timestamp }) =>
            updateEffects(bubble(manager, data.event, data.effect), timestamp)
    }
});

module.exports = manager;

function bubble(node, event, uuid)
{
    const entry = metadata(node).effects[uuid];

    if (!entry)
        throw new Error(`No effect registered for ${event.name}`);

    return entry.keys.reduce(function (node, key)
    {
        const child = node[key];

        if (child instanceof Effect)
            return update(node, events.refed(key, child, event));

        const updatedChild = bubble(child, event, uuid);

        if (child === updatedChild)
            return node;

        return update(node, events.replace(key, updatedChild, event.timestamp));
    }, node);
}

function register(node, timestamp, uuid)
{
    if (node instanceof Effect)
        return [update(node, { name:"register", timestamp, data:{ uuid } }), uuid + 1];

    const entry = metadata(node).effects["unregistered"];

    if (!entry)
        throw new Error(`No effect registered for ${event.name}`);

    return entry.keys.reduce(function ([node, uuid], key)
    {
        const child = node[key];
        const [updatedChild, updatedUUID] = register(child, timestamp, uuid);

        if (child === updatedChild)
            return [node, uuid];

        return [update(node, events.replace(key, updatedChild, timestamp)), updatedUUID];
    }, [node, uuid]);
}

function updateEffects(manager, timestamp)
{
    if (metadata(manager).effects["unregistered"])
    {
        const [registered, nextUUID] =
            register(manager, timestamp, manager["next-unique-effect-uuid"]);
        const updated = update.prop("next-unique-effect-uuid", nextUUID)(registered);

        return updateEffects(updated, timestamp);
    }

    const { effects: active, push } = manager;
    const { effects: referenced } = metadata(manager);

    const removed = Object.keys(active)
        .filter(key => !referenced[key]);

    const added = Object.keys(referenced)
        .filter(key => !active[key]);

    if (removed.length === 0 && added.length === 0)
        return manager;

    const updated = Object.create(null);

    for (const key of Object.keys(active))
    {
        if (referenced[key])
            updated[key] = active[key];

        else if (active[key].cancel) { console.log("CANCELING!");
            active[key].cancel();}
    }

    for (const key of Object.keys(referenced))
    {
        if (active[key])
            continue;

        const { start, args } = referenced[key];

        updated[key] = start((name, data, callback) =>
            setImmediate(() =>
            {
                push(events.effect(name, data, key));

                if (callback)
                    callback();
            }), ...(args || []));
    };

    return update.prop("effects", updated)(manager);
}

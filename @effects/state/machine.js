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
    replace: (key, child, { timestamp }) => 
        ({ name: "replace-child", data: { child, key }, timestamp }),
    effect: (name, data, effect, timestamp) => 
        ({ name:EffectSymbol, data: { event: { name, data, timestamp: Date.now() }, effect } })
}

const manager = state.machine `EffectsManager`
({
    [property `effects`]: "object",
    [property `push`]: "function",

    [property.child `root`]: "object",

    ["init"]: update
        .prop("effects", MakeEmpty()),

    [state `initial`]:
    {
        [on `start`]:
            updateEffects,

        [on (EffectSymbol)]: (manager, { data }) =>
            updateEffects(bubble(manager, data.event, data.effect))
    }
});

module.exports = manager;

function bubble(machine, event, euuid)
{
    const entry = metadata(machine).effects[euuid];

    if (!entry)
        throw new Error(`No effect registered for ${event.name}`);

    return entry.keys.reduce(function (node, key)
    {
        const child = node[key];

        if (Object.getPrototypeOf(child).constructor === Effect && metadata(child).uuid)
            return update(node, events.refed(key, child, event));

        const updatedChild = bubble(child, event, euuid);

        if (child === updatedChild)
            return node;

        return update(node, events.replace(key, updatedChild, event));
    }, machine);
}

function updateEffects(manager)
{
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

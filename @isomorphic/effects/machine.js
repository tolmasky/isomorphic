const metadata = require("./metadata");
const update = require("./update");
const { base, attrs } = require("./generic-jsx");
const Effect = require("./effect");
const { state, on } = require("./state");

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

const manager = state.machine `effects-manager`
({
    ["init"]: manager =>
        ({ ...manager, effects: MakeEmpty() }),

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
console.log("ENTRY", entry, machine[state.type].name, machine[state.type]===Effect && metadata(machine).uuid, metadata(machine));
    if (!entry)
        throw Errors.UnrecognizedEvent(event.name);

    return entry.keys.reduce(function (node, key)
    {console.log("THE STATE IS", node, key);
        const { children } = node;
        const child = children[key];
console.log(child, child[state.type] === Effect);
        if (child[state.type] === Effect && metadata(child).uuid)
            return update(node, events.refed(key, child, event));

        const updatedChild = bubble(child, event, euuid);
console.log("OH", updatedChild);
        if (child === updatedChild)
            return node;

        return update(node, events.replace(key, updatedChild, event));
    }, machine);
}

function updateEffects(manager)
{console.log(manager);
    const { effects: active, push } = manager;
    const { effects: referenced } = metadata(manager);
console.log(push);
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

    return { ...manager, effects: updated };
}

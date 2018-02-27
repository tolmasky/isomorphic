const metadata = require("./metadata");
const Empty = () => Object.create(null);






const update = Object.setPrototypeOf(function update(state, event)
{
    const Type = Object.getPrototypeOf(state).constructor;
    const updated = apply(Type.update, state, event);

console.log("sending ",event);

    metadata(updated);

    return updated;
}, Mutate.prototype);

module.exports = update;

module.exports.init = function (state)
{
    const Type = Object.getPrototypeOf(state).constructor;
    const initialized = Type.init ? apply(Type.init, state) : state;

    metadata(initialized);

    return initialized;
}

function apply(update, state, event)
{
    const updated = update(state, event);

    if (updated instanceof Mutate) { console.log("here!");
        return updated(state, event);
}
else
{
    console.log(updated);
}
    return updated;
}

function Mutate(type)
{
    return Object.defineProperty(function mutate(name, value)
    {
        const mutationChain =
            new MutationChain(type, name, value, this.mutationChain);
        const apply =
            (state, event) => finish(mutationChain, state, event);

        apply.mutationChain = mutationChain;
        Object.setPrototypeOf(apply, Mutate.prototype);

        return apply
    }, "name", { value: type });
}

Object.setPrototypeOf(Mutate.prototype, Function);

Mutate.prototype.prop = Mutate("prop");
Mutate.prototype.update = Mutate("update");

function MutationChain(type, name, value, previous)
{
    this.previous = previous;
    this.type = type;
    this.name = name;
    this.value = value;
}

function finish(mutationChain, state, event)
{
    const traverse = { mutationChain, mutations:[] };
console.log("here...");
    while (traverse.mutationChain !== void 0)
    {
        traverse.mutations.push(traverse.mutationChain);
        traverse.mutationChain = traverse.mutationChain.previous;
    }

    const Type = Object.getPrototypeOf(state).constructor;

    const mutations = traverse.mutations.reverse();
    const values = Empty();

    for (const { type, name, value } of mutations)

        if (type === "prop")
            values[name] = value;

        else
        {
            const previous = hasOwnProperty.call(values, name) ?
                values[name] : state[name];

            values[name] = update(previous, { ...event, name: value });
        }

    return Object.assign(Object.create(Type.prototype), state, values);
}

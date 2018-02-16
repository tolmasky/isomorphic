const { getArguments: attrs, base } = require("generic-jsx");
const mapAccum = require("./mapAccum");
const program = require("./program");

const events = {
    start: () => ({ name: "start" }),
    child: (ref, child) => ({ name: "update-child", ref, child })
}

const EmitterPromise = require("./emitter-promise");


module.exports = function (state, pull)
{
    const previous = { };

    return EmitterPromise(function(emitter, resolve, reject)
    {
        const update = (state, { rpath, event }) => 
            bubble(state, event, push, rpath);
        const autostart = attrs(state).status === "autostart";
        const initial = !autostart ? state : <state status = "initial" />;

        const push = program(initial, update, function (state)
        {
            if (pull)
                pull(state);

            const { status, result } = attrs(state);

            // We don't need to hasOwnProperty here, because if "result"
            // isn't in attributes, we still want to resolve to undefined.
            if (status === "finished")
                return resolve(result)

            if (status === "error")
                return reject(result);

            if (status !== previous.status)
            {
                previous.status = status;

                setImmediate(() => emitter.emit(status, result));
            }
        });

        if (autostart)
            push({ rpath: null, event: events.start() });
    });
}

function bubble(root, event, push, rpath)
{
    const path = [];
    var traverse = rpath;
    
    while (traverse)
        traverse = (path.unshift(rpath.ref), traverse.prev);

    const findChild = (state, ref) => attrs(state).children
        .find(child => attrs(child).ref === ref);
    const states = path.reduce((states, ref, index) =>
        (states.push(findChild(states[index], ref)), states), [root], path);

    return states.reduceRight(function ([_, event, rpath], state)
    {
        if (!event)
            return [state];

        const updated = update(state, event, push, rpath);
        const bubbled = state !== updated &&
            events.child(rpath && rpath.ref, updated);

        return [updated, bubbled, rpath && rpath.prev];
    }, [0, event, rpath])[0];
}

function update(state, event, push, rpath)
{
    const scoped = event => push({ event, rpath });
    const updated = base(state)(state, event, scoped);

    if (updated === state)
        return state;

    const [changed, children] = cmap(function (child)
    {
        const { status, ref } = attrs(child);

        if (status !== "autostart")
            return child;

        const event = events.start();
        const initial = <child status = "initial" />;

        return update(initial, event, push, { prev:rpath, ref });
    }, attrs(updated).children);

    return changed ? <updated { ...{ children } } /> : updated;
}

function cmap(f, list)
{
    var result = null;
    var index = 0;
    var count = list.length;

    for (; index < count; ++index)
    {
        const value = list[index];
        const mapped = f(list[index]);

        if (!result && value !== mapped)
            result = list.slice(0, index);

        if (result)
            result.push(mapped);
    }

    return [!!result, result || list];
}


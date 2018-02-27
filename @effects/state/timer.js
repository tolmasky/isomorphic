
const { state, init, on, property } = require("@effects/state");
const update = require("@effects/state/update");
const Effect = require("@effects/state/effect");


module.exports = state.machine `Timer`
({
    [property.child `timer-effect`]: Effect,

    ["init"]: ({ delay, timestamp }) => update
        .prop("timer-effect", Effect({ start, args:[delay, timestamp] })),

    [state `initial`]:
    {
        [on `#timeout.fired`]:
            update.prop("state", "fired"),

        [on `cancel`]: update
            .prop("state", "canceled")
            .prop("timer-effect", null)
    },
});

function start(push, { delay })
{
    const id = setTimeout(() => push("fired"), delay);

    return { cancel: () => clearTimeout(id) };
}

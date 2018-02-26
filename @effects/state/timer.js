
const { state, init, on } = require("@isomorphic/effects/state");
const Effect = require("@isomorphic/effects/effect");


module.exports = state.machine `Timer`
({
    ["init"]: timer =>
    {
        const { delay, timestamp } = timer;
        const args = [{ delay, timestamp }];
        const timeout = Effect({ start, args });

        return { ...timer, children: { timeout } };
    },

/*
    ["init"]: ({ delay, timestamp, ...timer }) =>(console.log("INPUT", timer),
    ({
        ...timer,
        children: { "timeout": Effect({ start, args: { delay: timer.delay, timestamp: timer.timestamp } }) }
    })),
*/

    [state `initial`]:
    {
        [on `#timeout.fired`]: timer =>
            ({ ...timer, state: "fired" }),

        [on `cancel`]: ({ children, ...timer }) =>
            ({ ...timer, state: "canceled" })
    },
});

function start(push, { delay })
{
    const id = setTimeout(() => push("fired"), delay);

    return { cancel: () => clearTimeout(id) };
}

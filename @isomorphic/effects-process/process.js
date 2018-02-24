const { state, init, on } = require("@isomorphic/effects/state");
const Effect = require("@isomorphic/effects/effect");

const fork = require("./fork");
const events = {
    kill: event => ({ ...event, name: "kill" })
};

module.exports = state.machine `Process`
({
    ["init"]: process =>
    ({
        ...process,
        state: "initial",
        children: { "fork": Effect({ start: () => fork(process.execute) }) }
    }),

    [state `initial`]:
    {
        [on `started`]: (process, { data: { pid } }) =>
            ({ ...process, pid }),

        [on `kill`]: process =>
            ({ ...process, kill: true }),

        [on `#execute-effect.exited`]: process =>
            ({ ...process, state: "finished" })
    },

    [state `running`]:
    {
        [on `kill`]: ({ pid, children, ...rest }) =>
            ({ ...rest, children:
                { ...children, "kill": Effect({ start: () => kill(pid) }) } }),

        [on `#fork.exited`]: process =>
            ({ ...process, state: "finished" })
    },

    [state `killing`]:
    {
        [on `kill`]: process => process,

        [on `#fork.exited`]: () =>
            ({ ...process, state: "killing" })
    },

    [state `finished`]: { }
});

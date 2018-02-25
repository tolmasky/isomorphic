const { state, init, on } = require("@isomorphic/effects/state");
const Effect = require("@isomorphic/effects/effect");

const fork = require("./fork");
const events = {
    kill: event => ({ ...event, name: "kill" })
};

const Process = state.machine `Process`
({
    ["init"]: process =>
    ({
        ...process,
        state: "initial",
        children: { "fork": Effect({ args:[process.execute], start: fork, timestamp: process.timestamp }) }
    }),

    [state `initial`]:
    {
        [on `#fork.started`]: (process, { data: { pid } }) =>
            ({ ...process, state: "running", pid }),

        [on `kill`]: process =>
            ({ ...process, kill: true }),

        [on `#fork.exit`]: process =>
            ({ ...process, state: "finished" })
    },

    [state `running`]:
    {
        [on `kill`]: ({ pid, children, ...rest }) =>(console.log("yeah..."),
            ({ ...rest, children:
                { ...children, "kill":
                    Effect({ args: [pid], start: fork.kill }) } })),

        [on `#fork.exit`]: process =>
            ({ ...process, state: "finished" })
    },

    [state `killing`]:
    {
        [on `kill`]: process => process,

        [on `#fork.exited`]: process =>
            ({ ...process, state: "killing" })
    },

    [state `finished`]: { }
});

module.exports = Process;

module.exports.Spawn = function (path, args, timestamp)
{
    return Process({ timestamp, execute: () => require("child_process").spawn(path, args, { stdio:[0,1,2] }) });
}

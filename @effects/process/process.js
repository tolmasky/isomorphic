const { state, init, on } = require("@effects/state");
const Effect = require("@effects/state/effect");

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
        children: { "fork": Effect({ args:[process.path, process.args], start: fork, timestamp: process.timestamp }) }
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
            ({ ...rest, 
                state: "killing",
                children:
                { ...children, "kill":
                    Effect({ args: [pid], start: fork.kill }) } })),

        [on `#fork.exit`]: process =>
            ({ ...process, state: "finished" })
    },

    [state `killing`]:
    {
        [on `kill`]: process => process,

        [on `#fork.exit`]: process =>
            ({ ...process, state: "finished" })
    },

    [state `finished`]: { }
});

module.exports = Process;

module.exports.Spawn = function (path, args, timestamp)
{
    return Process({ timestamp, path, args });
}

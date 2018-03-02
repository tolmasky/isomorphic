const { property, state, init, on } = require("@effects/state");
const Effect = require("@effects/state/effect");
const update = require("@effects/state/update");
const ignore = (state, event) => state;


const fork = require("./fork");
const events = {
    kill: event => ({ ...event, name: "kill" })
};

const Process = state.machine `Process`
({
    [property `pid`]: "number",
    [property `kill-on-start`]: "boolean",

    [property.child `fork-effect`]: Effect,
    [property.child `kill-effect`]: Effect,

    init: ({ path, args }) => update
        .prop("state", "initial")
        .prop("fork-effect", Effect({ args:[path, args], start: fork })),

    [state `initial`]:
    {
        [on `#fork-effect.started`]: (_, event) => update
            .prop("state", "running")
            .prop("pid", event.data.pid),

        [on `kill`]: update
            .prop("kill-on-start", true),

        [on `#fork.exit`]: update
            .prop("state", "finished")
    },

    [state `running`]:
    {
        [on `kill`]: ({ pid }) => update
            .prop("state", "killing")
            .prop("kill-effect", Effect({ args:[pid], start: fork.kill })),

        [on `#fork-effect.exit`]: update
            .prop("state", "finished")
    },

    [state `killing`]:
    {
        [on `kill`]: ignore,

        [on `#fork-effect.exit`]: update
            .prop("state", "finished")
    },

    [state `finished`]: { }
});

module.exports = Process;

module.exports.Spawn = function (path, args)
{
    return Process({ path, args });
}

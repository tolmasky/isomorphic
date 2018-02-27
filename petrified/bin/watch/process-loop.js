const { state, property } = require("@effects/state");
const update = require("@effects/state/update");


module.exports = state.machine `ProcessLoop`
({
    [property.child `process`]: "object",

    ["init"]: update
        .prop("state", "waiting"),

    [state `waiting`]:
    {
        [state.on `start`]: ({ template }, event) => update
            .prop("state", "running")
            .prop("process", template(event.timestamp))
    },

    [state `running`]:
    {
        [state.on `#process.finished`]: update
            .prop("state", "waiting"),

        [state.on `start`]: update
            .prop("state", "killing-then-start")
            .update("process", "kill")
    },

    [state `killing-then-start`]:
    {
        [state.on `#process.finished`]: update
            .prop("state", "waiting")
            .update("process", "start"),

        [state.on `start`]: loop => loop
    }
});

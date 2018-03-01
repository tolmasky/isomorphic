const { state, on, property } = require("./state");
const update = require("./update");


module.exports = state.machine `Effect`
({
    [property `uuid`]: "string",

    ["init"]: update.prop("state", "initial"),

    [state `initial`]:
    {
        [on `register`]: (_, event) => update
            .prop("uuid", "unique-" + event.data.uuid)
    }
});

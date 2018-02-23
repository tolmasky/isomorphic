const { base, attrs } = require("./generic-jsx");
const metadata = require("./metadata");


module.exports = update;

function update(state, event)
{
    const updated = base(state)(state, event);

    metadata(updated);

    return autostart(updated, event.timestamp);
}

module.exports.update = module.exports;

module.exports.autostart = autostart;

function autostart(state, timestamp)
{
    const { status } = attrs(state);

    if (status === void 0)
        return update(<state status = "initial" />, { name:"start", timestamp });

    if (status === "initial")
        return update(state, { name:"start", timestamp });

    return state;
}

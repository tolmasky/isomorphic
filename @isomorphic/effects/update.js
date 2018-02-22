const { base, attrs } = require("./generic-jsx");
const metadata = require("./metadata");


module.exports = update;

function update(state, event)
{console.log("UPDATING " + state.name + " " + attrs(state).status, event);
    const updated = base(state)(state, event);
console.log("UPDATED " + state.name + " " + attrs(state).status);
console.log("WILL METADATA");
    metadata(updated);console.log("-----");
console.log("UPDATING " + updated.name + " " + attrs(updated).status);
    return autostart(updated, event.timestamp);
}

module.exports.update = module.exports;

module.exports.autostart = autostart;

function autostart(state, timestamp)
{console.log("AUTOSTARTING " + state.name + " " + attrs(state).status);
    const { status } = attrs(state);

    if (status === void 0)
        return update(<state status = "initial" />, { name:"start", timestamp });

    if (status === "initial")
        return update(state, { name:"start", timestamp });

    return state;
}

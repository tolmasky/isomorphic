const metadata = require("./metadata");
const state = require("./state");


module.exports = update;

function update(record, event)
{    
    const updated = record[state.type].update(record, event);
console.log("be", record);
console.log("now", updated);
    metadata(updated);

    return updated;//autostart(updated, event.timestamp);
}

module.exports.update = module.exports;

module.exports.autostart = autostart;

function autostart(machine, timestamp)
{
    const { [state.NameAttribute]: name } = attrs(machine);

    if (name === "initial")
        return update(machine, { name:"start", timestamp });

    return machine;
}

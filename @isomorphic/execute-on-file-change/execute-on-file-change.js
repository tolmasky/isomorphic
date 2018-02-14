const executeOnChange = require("./execute-on-change");
const monitor = require("./monitor");

const { EventEmitter } = require("events");


module.exports = function ({ source, match, execute })
{
    const { emitter, change, finish } = executeOnChange({ execute });
    const monitoring = monitor(change, source, match);

    return { emitter, change, finish: () => (monitoring(), finish()) };
}

function execute(state, event, push)
{
    const { executing, cancel } = fork(state.data.execute);
    const data = { ...state.data, changes:[], cancel };

    executing.then(result => push("execution-complete", result));

    return { name: "executing", data };
}

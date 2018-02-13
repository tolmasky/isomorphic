const machine = require("./state-machine");
const fork = require("./fork");

const { EventEmitter } = require("events");
const emitState = handler => (state, event) =>
    (state.data.emit(state.name), handler(state, event));


module.exports = function ({ execute, debounce = 100 })
{
    const emitter = new EventEmitter();
    const emit = (...args) => emitter.emit(...args);

    const data = { execute, debounce, emit };
    const push = machine(states, { name: "waiting", data });

    const stepping = step(push, 1000 / 60);
    const change = data => push("change", data);

    return { emitter, change, finish: stepping };
}

const states =
{
    "waiting": {
        "change": noteChangesThen("debounce")
    },

    "debounce": {
        "change": noteChangesThen("debounce"),
        "step": (state, { timestamp }) =>
            timestamp - state.data.timestamp > state.data.debounce ?
            { ...state, name:"execute" } : state
    },

    "execute": execute,
    "executing": {
        "change": noteChangesThen("execution-cancel"),
        "execution-complete": "execution-complete"
    },
    "execution-complete": emitState(() => "waiting"),

    "execution-cancel": emitState(state =>
        (state.data.cancel(), "execution-canceling")),
    "execution-canceling": {
        "change": noteChangesThen("execution-canceling"),
        "execution-complete": "debounce"
    },
};

function execute(state, event, push)
{
    const { executing, cancel } = fork(state.data.execute);
    const data = { ...state.data, changes:[], cancel };

    executing.then(result => push("execution-complete", result));

    return { name: "executing", data };
}

function noteChangesThen(next)
{
    return function updateChanges({ data }, event)
    {
        data.emit("change", event.data);

        const timestamp = event.timestamp;
        const changes = (data && data.changes || [])
            .concat([event.data]);

        return [next, { ...data, changes, timestamp }];
    };
}

function step(push, interval)
{
    const firer = () => push("step", null, true);
    const id = setInterval(firer, interval);

    return () => clearInterval(id);
}


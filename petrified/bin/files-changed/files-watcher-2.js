const machine = require("./state-machine");

const { watchPath } = require("@atom/watcher");
const { matcher } = require("micromatch");

const fork = require("./fork");

const { EventEmitter } = require("events");
const emitState = handler => (state, event) =>
    (state.data.emit(state.name), handler(state, event));
const message = (_, then) => () => then;


module.exports = function ({ source, match, execute, events })
{
    const emitter = new EventEmitter();
    const emit = (...args) => emitter.emit(...args);
    const push = machine(states, { name: "watching", data: { execute, emit } });

    const monitoring = monitor(push, source, match);
    const stepping = step(push, 1000 / 60);
    const finish = () => (monitoring(), stepping());

    return emitter;
}

const states =
{
    "watching": {
        "files-changed": noteChangesThen("files-changing")
    },

    "files-changing": {
        "files-changed": noteChangesThen("files-changing"),
        "step": (state, { timestamp }) =>
            timestamp - state.data.timestamp > 100 ?
            { ...state, name:"execute" } : state
    },

    "execute": execute,
    "executing": {
        "files-changed": noteChangesThen("execution-cancel"),
        "execution-complete": message("Execution completed.", "watching")
    },
    "executing-complete": state => (console.log("DONE"), "watching"),

    "execution-cancel": emitState(state =>
        (state.data.cancel(), "execution-canceling")),
    "execution-canceling": {
        "files-changed": noteChangesThen("execution-canceling"),
        "execution-complete": "files-changing"
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
        data.emit("files-changed", event.data);

        const timestamp = event.timestamp;
        const changes = (data && data.changes || [])
            .concat(event.data);

        return [next, { ...data, changes, timestamp }];
    };
}

function monitor(push, source, match)
{
    const matcher = toMatcher(match);
    const watcher = watchPath(source, { }, function (events)
    {
        const filtered = events.filter(matcher);

        if (filtered.length > 0)
            push("files-changed", filtered);
    });

    return () => watcher.dispose();
}

function toMatcher(match)
{
    if (typeof match === "string")
        return (match => event => match(event.path))(matcher(match));

    if (typeof match === "function")
        return event => match(event.path);

    if (typeof match === "undefined" || match === true)
        return () => true;

    throw new TypeError("No type for match");
}

function step(push, interval)
{
    const firer = () => push("step", null, true);
    const id = setInterval(firer, interval);

    return () => clearInterval(id);
}


const machine = require("./state-machine");

const { execSync } = require("child_process");
const { watchPath } = require("@atom/watcher");
const { matcher } = require("micromatch");

const fork = require("./fork");
const message = (message, then) => () => (console.log(message), then);

module.exports = function ({ source, match })
{
    const push = machine(states, "watching");

    const monitoring = monitor(push, source, match);
    const stepping = step(push, 1000 / 60);
    const finish = () => (monitoring(), stepping());
}

setTimeout(() => module.exports({ source: "/Users/tolmasky/Desktop/", match: "**/*" }), 0);

const states =
{
    "watching": {
        "files-changed": noteChangesThen("files-changing")
    },

    "files-changing": {
        "files-changed": noteChangesThen("files-changing"),
        "step": ({ name, data }, { timestamp }) =>
            [timestamp - data.timestamp > 100 ? "execute" : name, data]
    },

    "execute": {
        ":enter": execute,
        "files-changed": noteChangesThen("execution-cancel"),
        "execution-complete": message("Execution completed.", "watching")
    },

    "execution-cancel": {
        ":enter": state => (state.data.cancel(), [state.name, state.data]),
        "files-changed": noteChangesThen("execution-execution"),
        "execution-complete": message("Execution canceled.", "files-changing")
    },
    
    "execution-complete": {
        ":enter": state => (console.log("DONE"), state)
    }
};

function execute({ name, data }, event, push)
{
    const source = "/Users/tolmasky/Desktop/";
    const changes = data.changes;
    const expanded = changes.length > 15 ? 10 : 15;

    const head = changes.slice(0, expanded);
    const rest = Math.max(changes.length - expanded, 0);

    const message = changes.map(change => 
        `${change.path.substr(source.length)} was ${change.action}.`).join("\n") +
        (rest > 0 ? "\nand ${head.length - limit} more..." : "");

    console.log(message);

    const { executing, cancel } = fork(() => require("child_process").fork("./tester"));

    executing.then(result => push("execution-complete", result));

    return [name, { ...data, changes:[], cancel }];
}

function noteChangesThen(next)
{
    return function updateChanges({ data }, event)
    {
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


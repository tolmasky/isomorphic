const machine = require("./state-machine");

const { execSync } = require("child_process");
const { watchPath } = require("@atom/watcher");
const { matcher } = require("micromatch");

const fork = require("./fork");
const message = (message, then) => () => (console.log(message), then);


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


(function do_()
{
    const p = () => {};
    const push = machine(states, "watching", p);

//    const push = program(states, "watching", pull);

    const monitoring = monitor(push, "/Users/tolmasky/Desktop", "**/*");
    const stepping = step(push, 1000 / 60);
    const finish = () => (monitoring(), stepping());

    touch("CAUSE INITIAL FIRE", 1000);
    touch("CAUSE KEEP LOOKIng", 1050);
    touch("CAUSE CANCEL", 1500);
/*
    var last;
    function pull(state)
    {
        if (last !== state.name)
    {        console.log(state.name);
        last = state.name;
    }
    }*/
})()

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

function touch(message, time)
{
    
    setTimeout(function()
    { 
        console.log(message)
        execSync("touch touch ~/Desktop/Form.pdf");
    }, time);
}

function monitor(push, source, match)
{
    const matcher = toMatcher(match);
    const watcher = watchPath(source, { }, function (events)
    {console.log(events);
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


/*

const files = next => ({ changes }, { data, timestamp }) =>
    [next, { changes: changes.concat(data), timestamp }];
const elapsed = ({ data: lhs }, { data: rhs }) =>
    rhs.timestamp - lhs.timestamp;


const states =
{
    "watching": {
        "files-changed": files("files-changing"),
        "step": "ignore",
    },

    "files-changing": {
        "files-changed": files("files-changing"),
        "step": (state, event) =>
            elapsed(state, event) > 100 ?
            ["execute", state.data] : state
    },

    "execute": {
        "files-changed": files("cancel-execution"),
        "execution-complete": "execution-complete",
        "step": "ignore"
    },
    
    "execution-complete": {
        "files-changed": files("execution-complete"),
        "do": whatever
    },

    "cancel-execution": {
        "files-changed": files("cancel-execution"),
        "execution-complete": "files-changing",
        "step": "ignore"
    },


    "execution-complete": {
    }
    
    "post-execution": {
        "files-changed": files("post-execution"),
        "step": "ignore"
    },
    
    "cancel-execution": {
        "files-changed": files("files-changing"),
        "step": "ignore"
    },
    
    
    
    
    "execute": function(state) { console.log(state); return "watching" }
/*
    "execute": execute("./tester"),
    "executing": {
        "files-changed": cancel,
        "execution-complete": "execution-complete"
    },

    "canceling-execution": { "canceling-complete": "watching" },
    "execution-complete": () => (
        console.log("BUILD COMPLETE"), "watching")
};

function data(f, next)
{
    return (state, event) => [next || state.name, f(state.data, event)];
}

Function.prototype.then = function (name)
{
    return (previous, event) => [name, this(previous, event)[1]];
}

*/

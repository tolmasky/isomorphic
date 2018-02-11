const { fork, execSync, spawn } = require("child_process");
const pstree = require("ps-tree");

const program = require("./exhaust");

const { watchPath } = require("@atom/watcher");
const { matcher } = require("micromatch");


const states =
{
    "watching": { "files-changed": "files-changing" },

    "files-changing": {
        "files-changed": "files-changing",
        "step": (previous, event) =>
            event.timestamp - previous.timestamp > 100 ? "execute" : previous
    },

    "execute": execute("./tester"),
    "executing": {
        "files-changed": cancel,
        "execution-complete": "execution-complete"
    },

    "canceling-execution": { "canceling-complete": "watching" },
    "execution-complete": () => (
        console.log("BUILD COMPLETE"), "watching")
};


(function do_()
{
    const push = program(states, "watching", pull);

    const monitoring = monitor(push, "/Users/tolmasky/Desktop", "**/*");
    const stepping = step(push, 1000 / 60);
    const finish = () => (monitoring(), stepping());
    
    touch("CAUSE INITIAL FIRE", 1000);
    touch("CAUSE KEEP LOOKIng", 1050);
    touch("CAUSE CANCEL", 1500);

    var last;
    function pull(state)
    {
        if (last !== state.name)
    {        console.log(state.name);
        last = state.name;
    }
    }
})()

function build(state, event)
{
    const cancel = (() => new Promise((resolve, reject) => 
        setTimeout(() => (console.log("all done"), resolve), 2000)))();

    const building = function (state, event)
    {
        if (event.name === "files-changed")
        {
            return states["files-changing"];
        }

        return building;
    }

    return building;
}

function touch(message, time)
{
    
    setTimeout(function()
    { 
        console.log(message)
        execSync("touch touch ~/Desktop/Form.pdf");
    }, time);
}

function cancel(state, event, push)
{
    console.log("CANCELING EXECUTING");

    const { pid } = state.data;
setTimeout(function () {
    pstree(pid, function (error, children)
    {
        if (error) { console.log("HERE2");
            return push("ERROR"); }

        spawn("kill", ["-s", "SIGINT", pid, ...children.map(child => child.PID)])
            .on("close", (e) => { console.log("HERE",e); push("canceling-complete") });
    });
    }, 3000);
    return "canceling-execution";
}

function execute(file)
{
    return function (state, event, push)
    {
        const subprocess = fork(file, { cwd: __dirname })
            .on("close", () => push("execution-complete"));

        return ["executing", subprocess];
    }
}

/*

return new Promise(function (resolve, reject)
        {
            psTree(subprocess.pid, function (error, children)
            {
                if (error)
                    return resolve();

                spawn("kill", ["-s", "SIGINT", subprocess.pid, ...children.map(process => process.PID)])
                    .on("close", resolve);
            });
        });
        */


function step(push, interval)
{
    const firer = () => push("step");
    const id = setInterval(firer, interval);

    return () => clearInterval(id);
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


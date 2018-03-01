const { spawn } = require("child_process");
const { promisify } = require("util");
const pstree = promisify(require("ps-tree"));


module.exports = function fork(push, path, args)
{
    const emitter = spawn(path, args, {stdio:[0,1,2]});
    const { pid } = emitter;
    const state = { exited: false, started: false };

    emitter.on("exit", function (code)
    {console.log("HERE ",code, state.started);
        state.exited = { code };

        if (state.started)
            push("exit", state.exited);
    });

    push("started", { pid }, function (err)
    {
        state.started = true;

        if (state.exited)
            push("exit", state.exited);
    });            

    return { cancel: () => kill(0, pid) };
}

module.exports.kill = kill;

function kill(push, pid)
{console.log("KILLING " + pid);
    return pstree(pid)
        .then(children => children.map(({ PID }) => PID))
        .then(children => ["-s", "SIGINT", pid, ...children])
        .then(args => spawn("kill", args, { stdio:[0,1,2] }))
        .then(() => console.log("TOTALLY KILLED!"))
        .catch(console.log);
}
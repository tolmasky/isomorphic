const { spawn } = require("child_process");
const { promisify } = require("util");
const pstree = promisify(require("ps-tree"));


module.exports = function fork(push, execute)
{
    const emitter = execute();
    const { pid } = emitter;
    const state = { exited: false, started: false };

    emitter.on("exit", function (code)
    {console.log("HERE", state.started);
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

    return { cancel: kill(pid) };
}

module.exports.kill = kill;

function kill(push, pid)
{
    return pstree(pid)
        .then(children => children.map(({ PID }) => PID))
        .then(children => ["-s", "SIGINT", pid, ...children])
        .then(args => spawn("kill", children))
}

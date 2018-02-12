const { spawn } = require("child_process");
const { promisify } = require("util");

const pstree = promisify(require("ps-tree"));
const exited = process => new Promise(resolve =>
    process.on("exit", code => resolve({ code })));


module.exports = function fork(run)
{
    const process = run();
    const cancel = () => pstree(process.pid)
        .then(children => children.map(child => child.PID))
        .then(children =>
            exited(spawn("kill", ["-s", "SIGNIT", process.pid, ...children])));
    const executing = exited(process);

    return Object.assign(executing, { executing, cancel });
}

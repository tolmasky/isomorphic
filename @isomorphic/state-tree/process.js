const { spawn } = require("child_process");
const { promisify } = require("util");
const pstree = promisify(require("ps-tree"));


const { define } = require("./state-tree");
const { getArguments: attrs } = require("generic-jsx");
const listen = require("./listen");


module.exports = define(process =>
({
    "initial -> start" (state)
    {
        const emitter = attrs(state).execute();
        const pid = emitter.pid;

        return  <state pid = { pid } status = "running" >
                    <listen ref = "process"
                            event = "exit"
                            status = "autostart"
                            emitter = { emitter } />
                </state>;
    },

    "running -> kill" (state)
    {
        pstree(attrs(state).pid)
            .then(children => children.map(({ PID }) => PID))
            .then(children => ["-s", "SIGINT", pid, ...children])
            .then(args => spawn("kill", children));

        return <state status = "exiting" />;
    },

    "running -> #process:finished": "finished",

    "exiting -> #process:finished": "finished",

    "finished": { }
}));

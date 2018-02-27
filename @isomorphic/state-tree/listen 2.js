const { spawn } = require("child_process");
const { promisify } = require("util");
const pstree = promisify(require("ps-tree"));


const { define } = require("./state-tree");
const { getArguments: attrs } = require("generic-jsx");
const on = (emitter, name, handler) =>
    (emitter.on(name, handler), handler);

// removal
// mutation


module.exports = define(listen =>
({
    "initial -> start" (state, event, push)
    {
        const { emitter, events } = attrs(state);
        const handlers =  events.map(name =>
            [name, (...args) => push({ name:`emitted:${name}`, timestamp: Date.now(), args })]);

        handlers.forEach(([name, callback]) => emitter.on(name, callback));

        return  <state  status = "listening"
                        heard = { [] }
                        handlers = { handlers } />;
    },

    "/^listening|(heard-\\d+)$/ -> /^emitted:.*$/" (state, event)
    {
        const { heard } = attrs(state);

        return <state   status = { `heard-${heard.length + 1}` }
                        heard = { heard.concat(event) } />;
    },

    "/^listening|(heard-\\d+)$/ -> drain" (state, event)
    {
        return <state status = "listening" heard = { [] } />;
    },

    "/^listening-\\d+$/ -> finish" (state, event)
    {
        const { emitter, handlers } = attrs(state);

        handlers.forEach(([name, callback]) =>
            emitter.removeListener(name, callback));

        return <state status = "finished" />;
    },

    "finished": { }
}));

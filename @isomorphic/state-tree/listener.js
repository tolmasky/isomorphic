const { spawn } = require("child_process");
const { promisify } = require("util");
const pstree = promisify(require("ps-tree"));


const { define } = require("./state-tree");
const { getArguments: attrs } = require("generic-jsx");
const on = (emitter, name, handler) =>
    (emitter.on(name, handler), handler);


module.exports = define(listener =>
({
    "initial -> start" (state, event, push)
    {
        const { emitter, events } = attrs(state);
        const handlers = events.map(name =>
            on(emitter, name, (...args) => push({ name:`emitted:${name}`, args })));

        return  <state status = "listening" handlers = { handlers } />;
    },

    "listening -> /emitted:.*/" ()
    {
    },

    "listening -> finish" (state)
    {
        const { emitter, handlers } = attrs(state);

        return <state status = "finished" />;
    }
}));

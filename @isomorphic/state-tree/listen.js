const { spawn } = require("child_process");
const { promisify } = require("util");
const pstree = promisify(require("ps-tree"));


const { define } = require("./state-tree");
const { getArguments: attrs } = require("generic-jsx");
const on = (emitter, name, handler) =>
    (emitter.on(name, handler), handler);


module.exports = define(listen =>
({
    "initial -> start" (state, event, push)
    {
        const { emitter, event: name } = attrs(state);
        const handler =  (...args) => push({ name:`emitted:${name}`, args });

        emitter.once(name, handler);

        return  <state status = "listening" handler = { handler } />;
    },

    "listening -> /^emitted:.*/" (state, event)
    {
        return <state status = "finished" fired = { true } />;
    },

    "listening -> finished" (state)
    {
        const { emitter, handler, name } = attrs(state);

        emitter.removeListener(name, handler);

        return <state status = "finished" fired = { false } />;
    },
    
    "finished": { }
}));

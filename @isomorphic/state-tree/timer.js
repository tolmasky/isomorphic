const { define } = require("./state-tree");
const { getArguments: attrs } = require("generic-jsx");


module.exports = define(timer =>
({
    "initial -> start" (state, event, update, push)
    {
        const { delay } = attrs(state);
        const timer = setTimeout(() =>
            push({ name:"fired", timestamp:Date.now() }), delay);

        return  <state status = "running" timer = { timer } />;
    },

    "running -> fired": "finished",

    "running -> finish" (state, event)
    {
        clearTimeout(attrs(state).timer);

        return <state status = "finished" />;
    }
}));

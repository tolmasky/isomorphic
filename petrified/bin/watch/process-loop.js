const state = require("@isomorphic/effects/state");
const update = require("@isomorphic/effects/update");


const ProcessLoop = state.machine `ProcessLoop`
({
    ["init"]: loop =>
        ({ ...loop, state: "waiting" }),
    
    [state `waiting`]:
    {
        [state.on `start`]: (loop, event) =>
        ({ ...loop, 
            state: "running",
        children:
        {
            process: loop.template(event.timestamp),
        } })
    },

    [state `running`]:
    {
        [state.on `#process.finished`]: loop =>
            ({ ...loop, state: "waiting" }),

        [state.on `start`]: (loop, event) =>
        ({ ...loop, state: "killing-then-start", children:
            {
                process: update(loop.children["process"], { ...event, name:"kill" }),
            }
        }),
    },

    [state `killing-then-start`]:
    {
        [state.on `#process.finished`]: (loop, event) =>
            update({ ...loop, state: "waiting" }, { ...event, name:"start" }),

        [state.on `start`]: loop => loop
    }
})

module.exports = ProcessLoop;


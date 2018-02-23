console.log("one");
const { state, on } = require("@isomorphic/effects/state");
console.log("hi");
const fork = require("./fork");
const events = {
    kill: event => ({ ...event, name: "kill" })
};
console.log("HERE");
const process = state.machine `process`
({
    [state `initial`]:
    {
        [on `start`]: ({ execute }) =>
            <process.starting>
                <effect ref = "execute-effect"
                        start = { fork(execute) } />
            </process.starting>
    },

    [state `starting`]:
    {
        [on `started`]: ({ event, kill, children }) =>
            <process.running
                pid = { event.data.pid }
                event = { kill && events.kill(event) }
                children = { children } />,

        [on `kill`]: ({ event, children }) =>
            <process.starting
                kill = { true }
                children = { children } />,

        [on `#execute-effect.exited`]: () =>
            <process.finished/>
    },

    [state `running`]:
    {
        [on `kill`]: ({ event, children, ...state }) =>
            <process.killing { ...state }>
                { children[0] }
                <effect ref = "effect-kill"
                        start = { fork.kill(state.pid) } />
            </process.killing>,

        [on `#execute-effect.exited`]: ({ event, ...state }) =>
            <process.finished { ...state }/>
    },

    [state `killing`]:
    {
        [on `kill`]: ({ event, ...state }) =>
            <process.killing { ...state } />,

        [on `#execute-effect.exited`]: () =>
            <process.finished { ...state }/>
    },

    [state `finished`]: { }
});
console.log(process);
module.exports = process;

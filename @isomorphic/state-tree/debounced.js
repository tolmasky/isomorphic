const { define } = require("./state-tree");
const { getArguments: attrs } = require("generic-jsx");

const timer = require("./timer");

// removal
// mutation


module.exports = define(debounced =>
({
    "initial -> start" (state)
    {
        const { children:[listen] } = attrs(state);

        return  <state status = "listening">
                    <listen ref = "listener" 
                            status = "autostart" />
                </state>;
    },

    "listening -> /^#listener:heard-\\d+$/" (state, event)
    {console.log("yes!" + event.timestamp);
        return debounce(<state   initiated = { event.timestamp } 
                        status = "debouncing" />, event);
    },

    "listening -> finish": finish,

    "debouncing -> /^#listener:heard-\\d+$/": (state, event) =>
        <state initiated = { event.timestamp } />,

    "debouncing -> #timer:finished": debounce,

    "debouncing -> finish": finish

}));

function finish(state, event, update)
{console.log("FINISHED");
process.exit(0);
    const children = attrs(state).children
        .map(state => update(state, { event:"finish" }));

    return  <state status = "finished" children = { children } />;
}

function debounce(state, event)
{
    const { initiated, debounce, children } = attrs(state);
    const remaining = debounce - (event.timestamp - initiated);

    if (remaining <= 0)
        return  <state status = "listening">
                    { children[0] }
                </state>;

    return  <state status = "debouncing" >
                { children[0] }
                <timer  ref = "timer"
                        status = "autostart"
                        delay = { remaining } />
            </state>;
}

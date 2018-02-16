

module.exports = state.define(restart =>
{
    "initial -> restart": (state, { timestamp }) =>
        <state { ...{ label: "debounce-start", timestamp } } />,

    "debounce-start": state =>
        <state label = "debounce-wait">
            <timeout ref = "timer" fire = { attrs(state).timestamp + 100 } />
        </state>;

    "debounce-wait -> restart": "debounce-start",
    "debounce-wait -> #timer.timeout": state =>
    {
        const { execute } = attrs(state);

        return  <state label = "executing">
                    <process { ...{ label:"initial", execute } } />
                </state>
    },

    "executing -> #process:exited": state =>
        <state label = "initial" children = { [] } />,

    "executing -> restart": (state, { timestamp }) =>
    {
        const { children:[process] } = attrs(state);

        return  <state { ...{ label: "kill-then-debounce", timestamp } } >
                    { process({ event: { name: "kill" } }) }
                </state>;
    }

    "kill-then-debounce -> restart": (state, { timestamp }) =>
        <state timestamp = { timestamp } />,

    "kill-then-debounce -> #process.exited": "debounce-start",
};

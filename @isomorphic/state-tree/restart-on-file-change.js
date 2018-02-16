

module.exports = state.define(restart =>
{
    "initial -> start": state =>
    {
        const { source, match } = attrs(state);
        const monitor = watch({ source, match });

        return  <state label = "monitoring">
                    <restart label = "initial" />
                    <io ref = "monitor" emitter = { monitor } events = { ["change"] } />
                </state>;
    },

    "monitoring -> restart": restart,
    "monitoring -> #monitoring.change": restart
};

function restart(state)
{
    const { children:[restart, monitor] } = attrs(state);

    return  <state>
                { restart({ event: { name: "restart" } }) }
                <monitor/>
            </state>;
}

const { createMonitor } = require("watch");
const actions = ["created", "changed", "removed"];


module.exports = function ({ change, source, match })
{
    const fire = (action, path) =>
        match({ path }) && change([{ path, action }]);
    const register = monitor => action =>
        monitor.on(action, name => fire(action, name));
    const options =
    {
        ignoreDotFiles: true,
        ignoreNotPermitted: true,
        ignoreUnreadableDir: true
    };
    let received = null;

    createMonitor(source, options, function (monitor)
    {
        actions.map(register(monitor));
        received = monitor;
    });

    return () => received && received.stop();
}

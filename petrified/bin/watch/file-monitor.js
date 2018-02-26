const { createMonitor } = require("watch");
const actions = ["created", "changed", "removed"];
const Effect = require("@isomorphic/effects/effect");
const { matcher } = require("micromatch");


module.exports = function FileMonitor({ source, match })
{
    return Effect({ start, args: [source, match] });
}

function start(push, source, match)
{
    const matcher = toMatcher(match);
    const fire = (action, path) =>
        matcher({ path }) && push("change", { path, action });
    const register = monitor => action =>
        monitor.on(action, name => fire(action, name));

    const options =
    {
        ignoreDotFiles: true,
        ignoreNotPermitted: true,
        ignoreUnreadableDir: true
    };

    createMonitor(source, options, function (monitor)
    {
        actions.map(register(monitor));
    });

    return { };
}

function toMatcher(match)
{
    if (typeof match === "string")
        return (match => event => match(event.path))(matcher(match));

    if (typeof match === "function")
        return event => match(event.path);

    if (typeof match === "undefined" || match === true)
        return () => true;

    throw new TypeError("No type for match");
}

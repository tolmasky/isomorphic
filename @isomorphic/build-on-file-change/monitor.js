const { watchPath } = require("@atom/watcher");
const { matcher } = require("micromatch")


module.exports = function monitor(change, source, match)
{
    const matcher = toMatcher(match);
    const watcher = watchPath(source, { }, function (events)
    {
        const filtered = events.filter(matcher);

        if (filtered.length > 0)
            change(filtered);
    });

    return () => watcher.dispose();
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

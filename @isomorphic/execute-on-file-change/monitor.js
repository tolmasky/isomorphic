const { matcher } = require("micromatch");
const monitor = require("./monitor/watch");


module.exports = function (change, source, match)
{
    return monitor({ change, source, match: toMatcher(match) });
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

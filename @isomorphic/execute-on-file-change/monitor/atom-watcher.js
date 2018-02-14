const { watchPath } = require("@atom/watcher");


module.exports = function ({ change, source, match })
{
    const watcher = watchPath(source, { }, function (events)
    {
        const filtered = events.filter(matcher);

        if (filtered.length > 0)
            change(filtered);
    });

    return () => watcher.dispose();
}

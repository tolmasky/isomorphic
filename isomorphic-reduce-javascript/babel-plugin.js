const reduce = require(".");


module.exports = function ({ types: t })
{
    return { visitor: { Program: { exit } }, name: "blah" };

    function exit(path)
    {
        if (path.node.visited)
            return;

        const replacement = reduce(path.node);

        replacement.visited = true;
        path.replaceWith(replacement);
    }
}

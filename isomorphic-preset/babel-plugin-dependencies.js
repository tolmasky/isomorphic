const { join, sep, dirname } = require("path");


module.exports = function ({ types: t })
{
    return { visitor: { CallExpression } };

    function CallExpression(path, state)
    {
        const { node } = path;

        if (!t.isIdentifier(node.callee, { name: "require" }))
            return;

        if (node.arguments.length > 1)
            return;

        const argument = node.arguments[0];

        if (!t.isLiteral(argument))
            return;

        const unresolved = node.arguments[0].value;

        if (unresolved.indexOf("isomorphic/internal/") === 0)
            return;

        const { dependencies } = state.file.metadata["isomorphic"];

        dependencies.add(unresolved);
    };
}



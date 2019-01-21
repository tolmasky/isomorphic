const { join, sep, dirname } = require("path");


module.exports = function ({ types: t })
{
    return { visitor: { JSXElement } };

    function JSXElement(path, state)
    {
        const { node } = path;
        const tag = node.openingElement.name.name;

        if (tag !== "isomorphic")
            return;

        state.file.metadata["isomorphic"].dependencies.add("isomorphic/internal/hydrate");
        state.file.metadata["isomorphic"].hydrate = true;
    }
}



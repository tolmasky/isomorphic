
module.exports = function (_, options)
{
    return { visitor: { Program } };

    function Program({ scope }, state)
    {
        const dependencies = new Set();
        const entrypoints = new Set();
        const assets = new Set();
        const globals = Object.keys(scope.globals)
            .reduce((globals, key) => (globals[key] = true, globals), { });
        const metadata = { ...state.opts, dependencies, entrypoints, assets, globals };

        state.file.metadata["isomorphic"] = metadata;
    };
}



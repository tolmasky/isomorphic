
module.exports = function (_, options)
{
    return { visitor: { Program } };

    function Program(_, state)
    {
        const dependencies = new Set();
        const entrypoints = new Set();
        const assets = new Set();
        const metadata = { ...state.opts, dependencies, entrypoints, assets };

        state.file.metadata["isomorphic"] = metadata;
    };
}



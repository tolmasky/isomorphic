
const Module = require("module");
const { dirname, join, normalize } = require("path");


module.exports = function requireResolve({ root, keys, children })
{
    return children.map(metadata =>
        !metadata ? metadata :
        keys.reduce((metadata, key) =>
            !metadata[key] ? [] :
            ({ ...metadata, [key]: Array.from(metadata[key],
                path => resolve(root, path, metadata.path)) }), metadata));
}

function resolve(root, path, from)
{
    if (path.charAt(0) === "~" && path.charAt(1) === "/")
        return normalize(join(root, path.replace(/^~\//g, "")));

    if (path.charAt(0) === "/")
        return path;

    const paths = Module._nodeModulePaths(dirname(from));
    const module = Object.assign(new Module(from),        
        { filename: from, paths });

    return Module._resolveFilename(path, module);
}
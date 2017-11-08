
const Module = require("module");
const { dirname, join, normalize } = require("path");


module.exports = function resolvePathsInKeys(root, keys, children)
{
    return children.map(child =>
        child && keys.reduce((child, key) =>
            !child[key] ? child :
            { ...child, [key]: Array.from(child[key],
                path => resolve(path, child.path)) }, child));

    function resolve(path, from)
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
}

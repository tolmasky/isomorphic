
const Module = require("module");
const { dirname, join, normalize } = require("path");


module.exports = function resolvedPathsInKey(root, visited = new Set(), key, children)
{
    const extracted = new Set();
    const updated = new Set(visited);

    return [extracted, updated, children.map(function (child)
    {
        if (!child)
            return child;

        const mapping = { };

        for (const path of child[key] || [])
        {
            const resolved = requireResolve(root, path, child.path);
            
            if (!visited.has(resolved))
            {
                extracted.add(resolved);
                updated.add(resolved);
            }

            mapping[path] = resolved;
        }
        
        return { ...child, [key]: mapping };
    })];
}

function requireResolve(root, path, from)
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

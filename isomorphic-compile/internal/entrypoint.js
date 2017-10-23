
const Module = require("module");
const { basename, dirname, extname, join } = require("path");
const { existsSync, readFileSync, writeFileSync } = require("fs");

const builtIn = require("./built-in");
const transform = require("../babel");


module.exports = function entrypoint({ path, cache, options })
{
    return  <dependencies { ...{ visited: new Set(), cache, options } } >
                <file { ...{ path, cache, options } } />
            </dependencies>
}

function dependencies({ children, visited, cache, options })
{
    const subdependencies = new Set();
    const resolved = children.map(function (child)
    {
        const { path, dependencies } = child;
        const mapping = { };

        for (const dependency of dependencies || [])
        {
            const resolved = resolve(dependency, path);

            if (!visited.has(resolved))
                subdependencies.add(resolved)

            mapping[dependency] = resolved;
        }

        const entrypoints = new Set();
        
        if (child.entrypoints)
            for (const entrypoint of child.entrypoints)
                entrypoints.add(resolve(entrypoint, path));

        return { ...child, path, dependencies: mapping, entrypoints };
    });

    const updated = new Set(visited);

    for (const dependency of subdependencies)
        updated.add(dependency);

    if (subdependencies.size <= 0)
        return resolved;

    return  [
                resolved,
                <dependencies { ...{ visited: updated, cache, options } }>
                    { Array.from(subdependencies, path =>
                        <file { ...{ path, cache, options } } /> )
                    }
                </dependencies>
            ];
}

function resolve(path, from)
{
    const paths = Module._nodeModulePaths(dirname(from));
    const module = Object.assign(new Module(from),        
        { filename: from, paths });

    return Module._resolveFilename(path, module);
}

function file({ cache, path, options })
{
    if (builtIn.is(path))
        return <builtIn name = { path } />;

    if (extname(path) === ".json")
        return { include: path };

    return <transform { ...{ cache, options, path } } />
}


const Module = require("module");
const { basename, dirname, extname, join } = require("path");
const { existsSync, readFileSync, writeFileSync } = require("fs");

const builtIn = require("./built-in");
const transform = require("../babel");
const bundle = require("./bundle");


module.exports = function entrypoints({ children, visited, cache, destination })
{
    const [_, subentrypoints, updated] =
        extract(visited, "entrypoint", children);

    if (subentrypoints.size <= 0)
        return "DONE";

    const output = path => join(destination, basename(path) + ".bundle.js");

    return  <entrypoints { ...{ visited: updated, cache, destination } }>
                { Array.from(subentrypoints, path =>
                    <entrypoint
                        { ...{ path, destination: output(path), cache } } />)
                }
            </entrypoints>
}

function entrypoint({ path, destination, cache, options })
{
    return  <bundle { ...{ path, destination } } >
                <dependencies { ...{ cache, options } } >
                    <file { ...{ path, cache, options } } />
                </dependencies>
            </bundle>
}

function dependencies({ children, visited, cache, options })
{
    const [resolved, subdependencies, updated] =
        extract(visited, "dependencies", children);

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
{console.log("TIME FOR " + path);
    if (builtIn.is(path))
        return <builtIn name = { path } />;

    if (extname(path) === ".json")
        return { include: path };

    return <transform { ...{ cache, options, path } } />
}

function extract(visited = new Set(), key, children)
{
    const extracted = new Set();
    const updated = new Set(visited);

    return [children.map(function (child)
    {
        if (!child)
            return child;

        const mapping = { };

        for (const entrypoint of child.entrypoints || [])
        {
            const resolved = resolve(entrypoint, child.path);
            
            if (!visited.has(resolved))
            {
                extracted.add(resolved);
                updated.add(resolved);
            }
        }
        
        return { ...child, [key]: mapping };
    }), extracted, updated];
}


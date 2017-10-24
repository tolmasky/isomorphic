
const Module = require("module");
const { basename, dirname, extname, join, relative, resolve } = require("path");
const { existsSync, readFileSync, writeFileSync } = require("fs");

const builtIn = require("./built-in");
const transform = require("../babel");
const bundle = require("./bundle");
const Route = require("route-parser");


const DEFAULT_options = {
                presets: [
                    ["isomorphic-preset", { node:"4.x.x", "react": true }]
                ]
            }

module.exports = function entrypoints({ children, visited, cache, destination, ...rest })
{
    const [_, subentrypoints, updated] =
        extract(visited, "entrypoint", children);

    if (subentrypoints.size <= 0)
        return "DONE";

    const route = compileRoutes(rest.routes, rest.root, destination);

    return  <entrypoints { ...{ visited: updated, cache, destination, routes: route } }>
                { Array.from(subentrypoints, path => route(path, { path, cache })) }
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

function requireResolve(path, from)
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
            const resolved = requireResolve(entrypoint, child.path);
            
            if (!visited.has(resolved))
            {
                extracted.add(resolved);
                updated.add(resolved);
            }
        }
        
        return { ...child, [key]: mapping };
    }), extracted, updated];
}

function compileRoutes(routes, source, destination)
{
    if (typeof routes === "function")
        return routes;

    const compiled = Object
        .keys(routes)
        .map(input => [Route(input), Route(routes[input].output)]);

    return function (path, props)
    {
        const relativePath = "/" + relative(source, path);

        for (const [inputRoute, outputRoute] of compiled)
        {
            const captures = inputRoute.match(relativePath);

            if (captures === false)
                continue;

            const output = resolve(join(destination, outputRoute.reverse(captures)));

            return <entrypoint { ...{ ...props, destination: output, options: DEFAULT_options } } />;
        }

        throw new Error(`Could not find matching entrypoint for ${path}`);
    }
}


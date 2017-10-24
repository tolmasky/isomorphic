
const { join, relative, resolve } = require("path");
const Route = require("route-parser");
const resolvedPathsInKey = require("./entrypoints/resolved-paths-in-key");


const DEFAULT_options = {
                presets: [
                    ["isomorphic-preset", { node:"4.x.x", "react": true }]
                ]
            }

module.exports = function entrypoints({ children, visited, cache, destination, ...rest })
{
    const [_, subentrypoints, updated] =
        resolvedPathsInKey(visited, "entrypoint", children);

    if (subentrypoints.size <= 0)
        return "DONE";

    const route = toRouter(rest.routes, rest.root, destination);

    return  <entrypoints { ...{ visited: updated, cache, destination, routes: route } }>
                { Array.from(subentrypoints, path => route(path, { path, cache })) }
            </entrypoints>
}

function toRouter(routes, source, destination)
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
            const entrypoint = require("./entrypoints/bundle-js");

            return <entrypoint { ...{ ...props, entrypoint: path, destination: output, options: DEFAULT_options } } />;
        }

        throw new Error(`Could not find matching entrypoint for ${path}`);
    }
}


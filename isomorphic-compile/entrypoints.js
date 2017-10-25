
const { join, relative, resolve } = require("path");
const Route = require("route-parser");
const resolvedPathsInKey = require("./resolved-paths-in-key");


module.exports = function entrypoints({ children, visited, cache, destination, ...rest })
{
    const [_, subentrypoints, updated] =
        resolvedPathsInKey(visited, "entrypoints", children);

    if (subentrypoints.size <= 0)
        return "DONE";

    const route = toRouter(rest.routes, rest.root, destination);

    return  <entrypoints { ...{ visited: updated, cache, destination, routes: route } }>
                { Array.from(subentrypoints, path => route(path, cache)) }
            </entrypoints>
}

function toRouter(routes, source, destination)
{
    if (typeof routes === "function")
        return routes;

    const compiled = Object.keys(routes)
        .map(input =>
        ({
            definition: routes[input],
            input: Route(input),
            output: Route(routes[input].output)
        }));

    return function (path, cache)
    {
        const relativePath = "/" + relative(source, path);

        for (const route of compiled)
        {
            const captures = route.input.match(relativePath);

            if (captures === false)
                continue;

            const output = resolve(join(destination, route.output.reverse(captures)));
            const [location, props] = Array.isArray(route.definition.transform) ?
                route.definition.transform : [route.definition.transform, { }];
            const entrypoint = require(location);
            const computed = { cache, entrypoint: path, destination: output };

            return <entrypoint { ...props } { ...computed } />;
        }

        throw new Error(`Could not find matching entrypoint for ${path}`);
    }
}


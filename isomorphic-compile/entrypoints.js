
const { basename, join, relative, resolve } = require("path");
const Route = require("route-parser");
const resolvedPathsInKey = require("./resolved-paths-in-key");
const { execSync } = require("child_process");


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
            const { transform, options = { } } = route.definition;
            const entrypoint = require(transform);
            const computed = { cache, options, entrypoint: path, destination: output };

            return  <report destination = { output } started = { Date.now() } >
                        <entrypoint { ...computed } />
                    </report>
        }

        throw new Error(`Could not find matching entrypoint for ${path}`);
    }
}

function report({ destination, started, children })
{
    const duration = (Date.now() - started) / 1000;
    const bytes = execSync(`stat -f%z ${JSON.stringify(destination)}`)
        .toString("utf-8")
        .split("\n")[0];
    const KiB = bytes > 1024 ? bytes / 1024 : 0;
    const MiB = KiB > 1024 ? KiB / 1024 : 0;
    const size =    MiB > 0 ? `${MiB.toFixed(2)} MiB` :
                    KiB > 0 ? `${KiB.toFixed(2)} KiB` :
                    `${bytes} B`;

    console.log(`Generated ${basename(destination)} in ${duration} sec - ${size}`);

    return children;
}


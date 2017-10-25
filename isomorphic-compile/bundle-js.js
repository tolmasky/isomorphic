
const { extname } = require("path");

const builtIn = require("./bundle-js/built-in");
const concatenate = require("./bundle-js/concatenate");
const resolvedPathsInKey = require("./resolved-paths-in-key");

const transform = require("isomorphic-compile/babel-transform");

const DEFAULT_OPTIONS = {
    presets: [
        ["isomorphic-preset", { node:"4.x.x", "react": true }]
    ]
}

module.exports = function bundle({ entrypoint, cache, options = DEFAULT_OPTIONS, destination })
{
    return  <concatenate { ...{ entrypoint, destination } } >
                <dependencies { ...{ cache, options } } >
                    <dependency { ...{ path: entrypoint, cache, options } } />
                </dependencies>
            </concatenate>;
}

function dependencies({ children, visited, cache, options })
{
    const [resolved, subdependencies, updated] =
        resolvedPathsInKey(visited, "dependencies", children);

    if (subdependencies.size <= 0)
        return resolved;

    return  [
                resolved,
                <dependencies { ...{ visited: updated, cache, options } }>
                    { Array.from(subdependencies, path =>
                        <dependency { ...{ path, cache, options } } /> )
                    }
                </dependencies>
            ];
}

function dependency({ cache, path, options })
{
    if (builtIn.is(path))
        return <builtIn name = { path } />;

    if (extname(path) === ".json")
        return { include: path };

    return <transform { ...{ cache, options, path } } />;
}

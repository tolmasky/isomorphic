
const { basename, extname, join } = require("path");
const { existsSync, readFileSync, writeFileSync } = require("fs");

const resolvedPathsInKey = require("isomorphic-compile/resolved-paths-in-key");
const transform = require("isomorphic-compile/babel-transform");

const builtIn = require("./built-in");
const concatenate = require("./concatenate");
const { getArguments } = require("generic-jsx");


module.exports = function bundle({ entrypoint, cache, options, destination })
{
    return  <concatenate { ...{ entrypoint, destination, cache, options } } >            
                <dependencies { ...{ cache, options } } >
                    <bootstrap { ... { cache, options } } />
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

function bootstrap({ cache, options })
{
    const path = require.resolve("./bootstrap");

    return <dependency { ...{ cache, options, path, removeTrailingSemicolon: true } } />;
}

function dependency({ cache, path, options, removeTrailingSemicolon })
{
    // Instead of forcing the json file into a module format, inline the object
    // directly.
    if (extname(path) === ".json")
        return { include: path, path };

    return <transform
            path = { builtIn.is(path) ? builtIn(path) : path }
            cache = { cache }
            options = { options }
            removeTrailingSemicolon = { removeTrailingSemicolon } />;

}

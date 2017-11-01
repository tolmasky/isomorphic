
const { basename, extname, join } = require("path");
const { existsSync, readFileSync, writeFileSync } = require("fs");

const resolvedPathsInKey = require("isomorphic-compile/resolved-paths-in-key");
const transform = require("isomorphic-compile/babel-transform");

const builtIn = require("./built-in");
const concatenate = require("./concatenate");
const { getArguments } = require("generic-jsx");


module.exports = function bundle({ root, entrypoint, cache, options, destination })
{
    return  <concatenate { ...{ root, entrypoint, destination, cache, options } } >
                <dependencies { ...{ root, cache, options } } >
                    <bootstrap { ... { cache, options } } />
                    <dependency { ...{ root, path: entrypoint, cache, options } } />
                </dependencies>
            </concatenate>;
}

function dependencies({ root, children, visited, cache, options })
{
    const [subdependencies, updated, resolved] =
        resolvedPathsInKey(root, visited, "dependencies", children);

    if (subdependencies.size <= 0)
        return resolved;

    return  [
                resolved,
                <dependencies { ...{ root, visited: updated, cache, options } }>
                    { Array.from(subdependencies, path =>
                        <dependency { ...{ root, path, cache, options } } /> )
                    }
                </dependencies>
            ];
}

function bootstrap({ cache, options })
{
    const path = require.resolve("./bootstrap");
    const removeTrailingSemicolon = true;

    return <dependency { ...{ cache, options, path, removeTrailingSemicolon } } />;
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

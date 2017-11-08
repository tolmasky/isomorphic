
const Module = require("module");
const { basename, extname, join } = require("path");
const { existsSync, readFileSync, writeFileSync } = require("fs");

const dedupe = require("isomorphic-compile/dedupe");
const resolvePathsInKeys = require("isomorphic-compile/resolve-paths-in-keys");
const transform = require("isomorphic-compile/babel-transform");

const builtIn = require("./built-in");
const concatenate = require("./concatenate");
const { getArguments } = require("generic-jsx");
const UnresolvedPathsKeys = ["assets", "entrypoints", "dependencies"];


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
    const resolved = resolvePathsInKeys(root, UnresolvedPathsKeys, children);
    const { extracted: subdependencies, visited: updated } =
        dedupe("dependencies", resolved, visited);

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

    return <dependency { ...{ cache, options, path } } />;
}

function dependency({ cache, path, options })
{
    // Instead of forcing the json file into a module format, inline the object
    // directly.
    if (extname(path) === ".json")
        return { include: path, path };

    // FIXME: We should still transform this.
    if (builtIn.is(path))
        return { include: builtIn(path), path };

    return  <transform
                path = { path }
                cache = { cache }
                options = { options } />;

}

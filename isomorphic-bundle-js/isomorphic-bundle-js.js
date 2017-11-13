
const Module = require("module");
const { basename, extname, join } = require("path");
const { existsSync, readFileSync, writeFileSync } = require("fs");

const dedupe = require("isomorphic-compile/dedupe");
const resolve = require("isomorphic-compile/require-resolve");
const transform = require("isomorphic-javascript");

const builtIn = require("./built-in");
const concatenate = require("./concatenate");
const { getArguments } = require("generic-jsx");
const UnresolvedPathsKeys = ["dependencies", "assets", "entrypoints"];


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
    const resolved = resolve({ root, children, keys: UnresolvedPathsKeys });
    const [subdependencies, updated ] =
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

    return <dependency { ...{ cache, options, path, wrap: false } } />;
}

function dependency({ cache, path, options, wrap = true })
{
    // `concatenate` will wrap this correctly, so nothing to be done here.
    if (extname(path) === ".json")
        return { include: path, path };

    if (builtIn.is(path))
        return <builtIn { ...{ path, cache, options } } />

    return  <transform { ...{ path, cache, options, wrap } } />;
}



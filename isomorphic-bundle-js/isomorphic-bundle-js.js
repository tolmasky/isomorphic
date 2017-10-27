
const { basename, extname, join } = require("path");
const { existsSync, readFileSync, writeFileSync } = require("fs");

const resolvedPathsInKey = require("isomorphic-compile/resolved-paths-in-key");
const transform = require("isomorphic-compile/babel-transform");
const getMerkleChecksum = require("isomorphic-compile/get-merkle-checksum");

const builtIn = require("./built-in");
const concatenate = require("./concatenate");
const { getArguments } = require("generic-jsx");


module.exports = function bundle({ entrypoint, cache, options, destination })
{
    return  <concatenate { ...{ entrypoint, destination, cache, options } } >
                <bootstrap { ... { cache, options } } />
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

function bootstrap({ cache, options })
{    
    const path = require.resolve("./bootstrap");

    return <transform { ...{ cache, options, path, wrap: false } } />;
}

function dependency({ cache, path, options, wrap = true })
{
    if (builtIn.is(path))
        return <builtIn name = { path } />;

    if (extname(path) === ".json")
        return <json { ...{ cache, path } } />;

    return <transform { ...{ cache, options, path, wrap: true } } />;
}

function json({ cache, path })
{
    const contents = readFileSync(path, "utf-8");
    const checksum = getMerkleChecksum({ contents, path })
        .replace(/\//g, "_");
    const contentsCachePath =
        join(cache, `${basename(path)}-contents-${checksum}.json`);

    if (!existsSync(contentsCachePath))
        writeFileSync(contentsCachePath,
            "function (exports, require, module, __filename, __dirname) {" +
            contents + "\n}", "utf-8");

    return { include: contentsCachePath, path };
}

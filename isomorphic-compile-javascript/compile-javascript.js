const { existsSync, readFileSync, writeFileSync } = require("fs");
const { basename, extname, join } = require("path");
const { transform: babelTransform } = require("@babel/core");

const { data, string, deserialize, serialize } = require("@algebraic/type");
const Metadata = require("../isomorphic-build/plugin/metadata");
const { Response } = require("../isomorphic-build/plugin");
const getSha512 = require("./get-sha-512");
const getResolvedOptions = require("./get-resolved-options");

const resolve = require("./require-resolve");

const readResponse = path =>
    deserialize(Response, JSON.parse(readFileSync(path, "utf-8")));
const writeResponse = (path, response) =>
    writeFileSync(path, JSON.stringify(serialize(Response, response)), "utf-8");

const builtIns =
{
    ...require("node-libs-browser"),
    module: require.resolve("./built-in/module")
};
const { hasOwnProperty } = Object;


module.exports = function compile({ input, cache, options })
{
    if (extname(input) === ".json")
        return Response({ output: input, metadata: Metadata({}) });

    if (hasOwnProperty.call(builtIns, input))
        return Response({ output: builtIns[input] || "SKIP", metadata: Metadata({}) });

    const resolvedOptions = getResolvedOptions(options);
    const contents = readFileSync(input, "utf-8");
    const contentsChecksum = getSha512(contents);
    const inputChecksum = getSha512.JSON({ input, contentsChecksum });
    const inputCachePath =
        join(cache, "inputs", basename(input, extname(input)) + ".json");

    if (existsSync(inputCachePath))
        return readResponse(inputCachePath);

    const contentsCachePath =
        join(cache, "contents", contentsChecksum + ".json");

    const { output, metadata } = (function ()
    {
        if (existsSync(contentsCachePath))
            return readResponse(contentsCachePath);

        const { code, metadata } = babelTransform(contents, resolvedOptions);
        const transformedChecksum = getSha512(code);
        const output = join(cache, "outputs", transformedChecksum + ".js");
        const response = Response({ output, metadata });

        writeFileSync(output, code, "utf-8");
        writeResponse(contentsCachePath, response);

        return response;
    })();

    const dependencies = metadata.dependencies.map(resolve("", input)).filter(x => !!x);
    const resolvedMetadata = Metadata({ ...metadata, dependencies });
    const resolvedResponse = Response({ output, metadata: resolvedMetadata });

    writeResponse(inputCachePath, resolvedResponse);

    return resolvedResponse;
}

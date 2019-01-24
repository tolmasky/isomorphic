const { existsSync, readFileSync, writeFileSync } = require("fs");
const { basename, extname, join } = require("path");
const { transform: babelTransform } = require("@babel/core");

const { data, string, deserialize, serialize } = require("@algebraic/type");
const Metadata = require("@isomorphic/build/plugin/metadata");
const { Response } = require("@isomorphic/build/plugin");
const getSha512 = require("./get-sha-512");
const getResolvedOptions = require("./get-resolved-options");
const moduleWrap = require("./module-wrap");

const resolve = require("./require-resolve");

const readResponse = path =>
    deserialize(Response, JSON.parse(readFileSync(path, "utf-8")));
const writeResponse = (path, response) =>
    writeFileSync(path, JSON.stringify(serialize(Response, response)), "utf-8");

const polyfill = require("./polyfill");

module.exports = function compile({ input, cache, options, ignoredDependencies })
{
    if (extname(input) === ".json")
    {
        const contents = readFileSync(input, "utf-8");
        const checksum = getSha512(contents);
        const metadata = Metadata({});

        return Response({ output: input, checksum, metadata });
    }

    const replacement = polyfill(input);

    if (replacement)
        return compile({ cache, options, ...replacement });

    const resolvedOptions = getResolvedOptions(options);
    const contents = readFileSync(input, "utf-8");
    const contentsChecksum = getSha512(contents);
    const inputChecksum = getSha512.JSON({ input, contentsChecksum });
    const inputCachePath =
        join(cache, "inputs", basename(input, extname(input)) + "-" + inputChecksum + ".json");

    if (existsSync(inputCachePath))
        return readResponse(inputCachePath);

    const contentsCachePath =
        join(cache, "contents", contentsChecksum + ".json");

    const unresolvedResponse = (function ()
    {
        if (existsSync(contentsCachePath))
            return readResponse(contentsCachePath);

        const { code, metadata } = babelTransform(contents, resolvedOptions);
        const wrapped = moduleWrap(metadata.globals, code);
        const transformedChecksum = getSha512(wrapped);
        const output = join(cache, "outputs", transformedChecksum + ".js");
        const response = Response({ output, metadata, checksum: transformedChecksum });

        writeFileSync(output, wrapped, "utf-8");
        writeResponse(contentsCachePath, response);

        return response;
    })();

    const { metadata } = unresolvedResponse;
    const dependencies = metadata.dependencies
        .filter(dependency =>
            !ignoredDependencies || ignoredDependencies.test(dependency))
        .map(resolve("", input));
    const resolvedMetadata = Metadata({ ...metadata, dependencies });
    const resolvedResponse =
        Response({ ...unresolvedResponse, metadata: resolvedMetadata });

    writeResponse(inputCachePath, resolvedResponse);

    return resolvedResponse;
}

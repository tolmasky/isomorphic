const { existsSync, readFileSync, writeFileSync } = require("fs");
const { join } = require("path");
const { transform: babelTransform } = require("@babel/core");

const { data, string, deserialize, serialize } = require("@algebraic/type");
const Metadata = require("./metadata");

const Result = data `Result` (
    output          => string,
    metadata        => Metadata );

const getSha512 = require("./get-sha-512");
const getResolvedOptions = require("./get-resolved-options");


module.exports = function compile({ input, cache, options })
{
    const resolvedOptions = getResolvedOptions(options);
    const contents = readFileSync(input, "utf-8");
    const checksum = getSha512(contents);
    const resultCachePath = join(cache, "results", checksum + ".json");

    if (existsSync(resultCachePath))
        return deserialize(Result,
            JSON.parse(readFileSync(resultCachePath, "utf-8")));

    const { code, metadata } = babelTransform(contents, resolvedOptions);
    const transformedChecksum = getSha512(code);

    const output = join(cache, "outputs", transformedChecksum + ".js");
    const result = Result({ metadata, output });

    writeFileSync(output, code, "utf-8");
    writeFileSync(resultCachePath,
        JSON.stringify(serialize(Result, result)), "utf-8");

    return result;
}

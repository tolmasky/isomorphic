const { existsSync, readFileSync, writeFileSync } = require("fs");
const { basename, extname, join } = require("path");
const { transform: babelTransform } = require("@babel/core");

const getSha512 = require("./get-sha-512");
const getResolvedOptions = require("./get-resolved-options");
const moduleWrap = require("./module-wrap");

const polyfill = require("./polyfill");
const resolve = require("./require-resolve");

const { data, string, deserialize, serialize } = require("@algebraic/type");
const { OrderedSet } = require("@algebraic/collections");
const Compilation = require("@isomorphic/plugin/compilation");
const UnresolvedCompilation = data `UnresolvedCompilation` (
    filename        => string,
    dependencies    => OrderedSet(string) );


const read = (type, path) =>
    deserialize(type, JSON.parse(readFileSync(path, "utf-8")));
const write = (type, path, data) =>
    writeFileSync(path, JSON.stringify(serialize(type, data)), "utf-8");


module.exports = function compile({ filename, ...rest }, configuration)
{
    if (extname(filename) === ".json")
        return Compilation({ filename });

    const replacement = polyfill(filename);

    if (replacement)
        return compile({ ...rest, ...replacement }, configuration);

    const { cache, ignoredDependencies } = rest;
    const contents = readFileSync(filename, "utf-8");
    const contentsChecksum = getSha512(contents);
    const contentsCachePath = `${cache}/contents/${contentsChecksum}.json`;

    const unresolvedCompilation = (function ()
    {
        if (existsSync(contentsCachePath))
            return read(UnresolvedCompilation, contentsCachePath);

        const resolvedOptions = getResolvedOptions(configuration.options.babel);
        const { code, metadata } = babelTransform(contents, resolvedOptions);
        const { globals, dependencies } = metadata;
        const wrapped = moduleWrap(globals, code);
        const transformedChecksum = getSha512(wrapped);
        const output = join(cache, "outputs", transformedChecksum + ".js");
        const unresolvedCompilation =
            UnresolvedCompilation({ filename: output, dependencies });

        writeFileSync(output, wrapped, "utf-8");
        write(UnresolvedCompilation, contentsCachePath, unresolvedCompilation);

        return unresolvedCompilation;
    })();

    const dependencies = unresolvedCompilation
        .dependencies
        .toList()
        .filter(dependency =>
            !ignoredDependencies ||
            ignoredDependencies.test(dependency))
        .map(resolve("/", filename));

    if (dependencies.size !== unresolvedCompilation.dependencies.size)
        console.log("OH NO! " + dependencies.size + " " + unresolvedCompilation.dependencies.size);

    return Compilation({ ...unresolvedCompilation, dependencies });
}


    

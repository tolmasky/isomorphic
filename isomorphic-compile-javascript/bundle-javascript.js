const compile = require("./compile");
const { execSync } = require("child_process");
const mkdirp = path => execSync(`mkdir -p ${JSON.stringify(path)}`) && path;


module.exports = function ({ configuration, cache })
{
    const { options } = configuration;

    mkdirp(`${cache}/contents`);
    mkdirp(`${cache}/outputs`);

    return { compile, bundle };
}

function bundle()
{
    console.log("bundle");
}


/*
const { existsSync, readFileSync, writeFileSync } = require("fs");
const { basename, extname, join } = require("path");
const { transform: babelTransform } = require("@babel/core");

const getSha512 = require("./get-sha-512");
const getResolvedOptions = require("./get-resolved-options");
const moduleWrap = require("./module-wrap");

const polyfill = require("./polyfill");
const resolve = require("./require-resolve");
const Compilation = require("@isomorphic/build/plugin/compilation");

const { data, string, deserialize, serialize } = require("@algebraic/type");
const { OrderedSet } = require("@algebraic/collections");
const UnresolvedCompilation = data `UnresolvedCompilation` (
    output          => string,
    dependencies    => OrderedSet(string) );

const read = (type, path) =>
    deserialize(type, JSON.parse(readFileSync(path, "utf-8")));
const write = (type, path, data) =>
    writeFileSync(path, JSON.stringify(serialize(type, data)), "utf-8");


module.exports = function compile({ input, cache, options, ignoredDependencies })
{
    if (extname(input) === ".json")
        return Compilation({ output: input });

    const replacement = polyfill(input);

    if (replacement)
        return compile({ cache, options, ...replacement });

    const contents = readFileSync(input, "utf-8");
    const contentsChecksum = getSha512(contents);
    const contentsCachePath =
        join(cache, "contents", contentsChecksum + ".json");

    const unresolvedCompilation = (function ()
    {
        if (existsSync(contentsCachePath))
            return read(UnresolvedCompilation, contentsCachePath);

        const resolvedOptions = getResolvedOptions(options);
        const { code, metadata } = babelTransform(contents, resolvedOptions);
        const { globals, dependencies } = metadata;
        const wrapped = moduleWrap(globals, code);
        const transformedChecksum = getSha512(wrapped);
        const output = join(cache, "outputs", transformedChecksum + ".js");
        const unresolvedCompilation =
            UnresolvedCompilation({ output, dependencies });

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
        .map(resolve("/", input));

    if (dependencies.size !== unresolvedCompilation.dependencies.size)
        console.log("OH NO! " + dependencies.size + " " + unresolvedCompilation.dependencies.size);

    return Compilation({ ...unresolvedCompilation, dependencies });
}*/

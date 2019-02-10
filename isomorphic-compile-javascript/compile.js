const { existsSync, readFileSync, writeFileSync } = require("fs");
const { extname, join } = require("path");

const getSha512 = require("./get-sha-512");
const transform = require("./transform");

const polyfill = require("./polyfill");
const resolve = require("./require-resolve");

const { data, string, number, deserialize, serialize } =
    require("@algebraic/type");
const { OrderedSet, Set } = require("@algebraic/collections");
const Compilation = require("./compilation");
const UnresolvedCompilation = data `UnresolvedCompilation` (
    filename        => string,
    sourceMapPath   => string,
    dependencies    => OrderedSet(string),
    size            => number,
    lineCount       => number,
    metadata        => Compilation.Metadata);


const read = (type, path) =>
    deserialize(type, JSON.parse(readFileSync(path, "utf-8")));
const write = (type, path, data) =>
    writeFileSync(path, JSON.stringify(serialize(type, data)), "utf-8");


module.exports = function compile({ filename, ...rest }, configuration)
{
    if (extname(filename) === ".json")
    {
        const contents = readFileSync(filename, "utf-8");
        const size = contents.length;
        const lineCount = contents.match(/\n/g).length + 1;
        const metadata = Compilation.Metadata({});

        return Compilation({ filename, size, lineCount, metadata });
    }

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

        const { options } = configuration;
        const transformed = transform(filename, contents, options.babel);
        const { globals, dependencies } = transformed.metadata;

        const transformedChecksum = getSha512(transformed.contents);
        const output = `${cache}/outputs/${transformedChecksum}.js`;
        const sourceMapPath = `${cache}/source-maps/${transformedChecksum}.json`;
        const implicitBuiltInDependencies = Set(string)(
        [
            globals.has("process") && "process",
            globals.has("Buffer") && "buffer"
        ].filter(present => !!present));
        const metadata = Compilation.Metadata({ implicitBuiltInDependencies });
        const unresolvedCompilation = UnresolvedCompilation(
        {
            filename: output,
            sourceMapPath,
            size: transformed.contents.length,
            lineCount: transformed.contents.match(/\n/g).length + 1,
            dependencies,
            metadata
        });

        writeFileSync(output, transformed.contents, "utf-8");
        writeFileSync(sourceMapPath,
            JSON.stringify(transformed.sourceMap), "utf-8");

        write(UnresolvedCompilation, contentsCachePath, unresolvedCompilation);

        return unresolvedCompilation;
    })();
    const dependencies = unresolvedCompilation
        .dependencies
        .concat(unresolvedCompilation.metadata.implicitBuiltInDependencies)
        .toList()
        .filter(dependency =>
            !ignoredDependencies ||
            ignoredDependencies.test(dependency))
        .map(resolve("/", filename));

    return Compilation({ ...unresolvedCompilation, dependencies });
}

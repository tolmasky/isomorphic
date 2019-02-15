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
    output          => Compilation.Output,
    dependencies    => OrderedSet(string),
    metadata        => Compilation.Metadata);


const read = (type, path) =>
    deserialize(type, JSON.parse(readFileSync(path, "utf-8")));
const write = (type, path, data) =>
    writeFileSync(path, JSON.stringify(serialize(type, data)), "utf-8");


module.exports = function compile(request, configuration)
{
    const { cache, filename } = request;

    if (extname(filename) === ".json")
    {
        const contents = readFileSync(filename, "utf-8");
        const size = contents.length;
        const lineCount = contents.match(/\n/g).length + 1;
        const metadata = Compilation.Metadata({});
        const output = Compilation.Output({ size, lineCount, filename });

        return Compilation({ filename, output, metadata });
    }

    const overrides = polyfill(filename);
    const { ignoredDependencies } = overrides || { };
    const source = overrides ? overrides.filename : filename;

    const contents = readFileSync(source, "utf-8");
    const contentsChecksum = getSha512(contents);
    const contentsCachePath = `${cache}/contents/${contentsChecksum}.json`;

    const unresolvedCompilation = (function ()
    {
        if (existsSync(contentsCachePath))
            return read(UnresolvedCompilation, contentsCachePath);

        const { options } = configuration;
        const transformed = transform(filename, contents, options.babel);

        const { globals, dependencies } = transformed.metadata;
        const implicitBuiltInDependencies = Set(string)(
        [
            globals.has("process") && "process",
            globals.has("Buffer") && "buffer"
        ].filter(present => !!present));
        const metadata = Compilation.Metadata({ implicitBuiltInDependencies });

        const transformedChecksum = getSha512(transformed.contents);
        const output = Compilation.Output(
        {
            filename: `${cache}/outputs/${transformedChecksum}.js`,
            sourceMap: `${cache}/source-maps/${transformedChecksum}.json`,
            size: transformed.contents.length,
            lineCount: transformed.contents.match(/\n/g).length + 1
        });
        const unresolvedCompilation =
            UnresolvedCompilation({ output, dependencies, metadata });

        writeFileSync(output.filename, transformed.contents, "utf-8");
        writeFileSync(output.sourceMap,
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
        .map(resolve("/", source));

    return Compilation({ ...unresolvedCompilation, filename, dependencies });
}

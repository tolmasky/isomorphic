const { basename, dirname, extname } = require("path");
const { openSync: open, writeSync: write, closeSync: close } = require("fs");

const mkdirp = require("./mkdirp");
const { existsSync, unlinkSync, readFileSync, writeFileSync } = require("fs");
const JSONPreamble = "function(exports, require, module) { module.exports = ";
const JSONPostamble = "\n}";
const bootstrapPath = require.resolve("./bundle/bootstrap");

const { data, string, number } = require("@algebraic/type");
const { List, Map, OrderedMap, Set } = require("@algebraic/collections");
const Bundle = require("@isomorphic/build/plugin/bundle");
const fromImplicitDependency =
{
    process: ["process", request => `process = require(${request})`],
    buffer: ["Buffer", request => `Buffer = require(${request}).Buffer`]
};

const File  = data `File` (
    filename        => string,
    dependencies    => List(number),
    outputIndex     => number );


module.exports = function bundle(bundleRequest)
{const start = Date.now();
    const { compilations } = bundleRequest;
    const implicitBuiltInDependencies = compilations.reduce(
        (dependencies, { metadata }) =>
            dependencies.concat(metadata.implicitBuiltInDependencies),
        Set(string)());
    const sortedCompilations = compilations
        .entrySeq()
        .toList()
        .sortBy(([filename]) => filename);
    const filenameIndexes = Map(string, number)(
        sortedCompilations.map(([filename], index) => [filename, index]));
    const timing = (Date.now() - start);
    const [files, outputIndexes] = sortedCompilations.reduce(
        function ([files, outputIndexes], [filename, compilation])
        {
            const dependencies = compilation
                .dependencies
                .map(dependency => filenameIndexes.get(dependency));
            const output = compilation.filename;
            const outputIndex = outputIndexes.get(output, outputIndexes.size);
            const outFiles = files.push(
                File({ filename, dependencies, outputIndex }));
            const outOutputIndexes =
                outputIndex === outputIndexes.size ?
                    outputIndexes.set(output, outputIndex) :
                    outputIndexes;

            return [outFiles, outOutputIndexes];
        }, [List(File)(), OrderedMap(string, number)()]);
    const outputs = List(string)(outputIndexes.keySeq());
    const { entrypoint, destination } = bundleRequest.product;

    if (existsSync(destination))
        unlinkSync(destination);

    mkdirp(dirname(destination));

    const output = { buffers:[], length:0 };

    append("(function (global) {")

    if (implicitBuiltInDependencies.size > 0)
        append("var " +
            implicitBuiltInDependencies
                .map(name => fromImplicitDependency[name][0])
                .join(",") + ";");

    append(readFileSync(bootstrapPath));

    append("(");
    append(filenameIndexes.get(entrypoint) + ",");

    append(JSON.stringify(files
        .map(({ filename, outputIndex, dependencies }) =>
            [filename, outputIndex, dependencies])));

    append(", [");
    for (const output of outputs)
    {
        const isJSON = extname(output) === ".json";

        if (isJSON)
            append(JSONPreamble);

        append(readFileSync(output));

        if (isJSON)
            append(JSONPostamble);

        append(",");
    }
    append("]");

    if (implicitBuiltInDependencies.size > 0)
    {
        append(", function (require) {");

        append(implicitBuiltInDependencies
            .map(name =>
                fromImplicitDependency[name][1](filenameIndexes.get(name)))
            .join(";") + ";");

        append("}");
    }

    append(") })(window)");

    const concated = Buffer.concat(output.buffers, output.length);

    writeFileSync(destination, concated);
console.log(destination + " took: " + timing + " " + (Date.now() - start));
    return Bundle.Response({ filename: destination });

    function append(content)
    {
        if (typeof content === "string")
            return append(Buffer.from(content, "utf-8"));

        output.buffers.push(content);
        output.length += content.length;
    }
    
    function derooted(path)
    {
        return isAbsolute(path) ? "/" + relative(root, path) : path
    }
}

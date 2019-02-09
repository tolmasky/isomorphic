const { dirname, extname } = require("path");
const { existsSync, unlinkSync, mkdirSync, readFileSync, writeFileSync } = require("fs");
const JSONPreamble = "function(exports, require, module) { module.exports = ";
const JSONPostamble = "\n}";
const bootstrapPath = require.resolve("./bundle/bootstrap");

const { data, string, number } = require("@algebraic/type");
const { List, Map, OrderedMap } = require("@algebraic/collections");
const Bundle = require("@isomorphic/build/plugin/bundle");

const File  = data `File` (
    filename        => string,
    dependencies    => List(number),
    outputIndex     => number );


module.exports = function bundle(bundleRequest)
{
    const { compilations } = bundleRequest;
    const { referencesGlobalProcess, referencesGlobalBuffer } =
        compilations.reduce((references, { metadata }) =>
        ({
            referencesGlobalProcess:
                metadata.referencesGlobalProcess &&
                references.referencesGlobalProcess,
            referencesGlobalBuffer:
                metadata.referencesGlobalBuffer &&
                references.referencesGlobalBuffer                
        }), { referencesGlobalProcess:false, referencesGlobalBuffer: false });
    const sortedCompilations = compilations
        .entrySeq()
        .toList()
        .sortBy(([filename]) => filename);
    const filenameIndexes = Map(string, number)(
        sortedCompilations.map(({ filename }, index) => [filename, index]));

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

    mkdirSync(dirname(destination), { recursive: true });

    const output = { buffers:[], length:0 };

    // The first item is always the bootstrap file, it doesn't get wrapped.
    append("(function (global) {");
    append(readFileSync(bootstrapPath));
    append("(");
    append(entrypoint + ",");

    const filesAsArray = files
        .map(({ filename, outputIndex, dependencies }) =>
            [filename, outputIndex, dependencies]);
/*
    const references =
    [
        referencesGlobalProcess && "process",
        referencesGlobalBuffer && "Buffer"
    ].filter(present => !!present);

    if (references.length > 0)
    {
        append("(function (" + references + ") { return [");
        append("function(name, input) { if () { } },");
    }
*/
    append(JSON.stringify(filesAsArray));
/*
    if (references.length > 0)
    {
        append("}")
    }
*/
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

    append("]) })(window)");

    const concated = Buffer.concat(output.buffers, output.length);

    writeFileSync(destination, concated);

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

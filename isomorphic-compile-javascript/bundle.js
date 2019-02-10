const { basename, dirname, extname } = require("path");
const { openSync: open, writeSync: write, closeSync: close } = require("fs");

const mkdirp = require("./mkdirp");
const { existsSync, unlinkSync, readFileSync, writeFileSync } = require("fs");
const JSONPreamble = "function(exports, require, module) { module.exports = ";
const JSONPostamble = "\n}";
const bootstrapPath = require.resolve("./bundle/bootstrap");

const { data, string, number, Maybe } = require("@algebraic/type");
const { List, Map, OrderedMap, Set } = require("@algebraic/collections");
const Bundle = require("@isomorphic/build/plugin/bundle");
const fromImplicitDependency =
{
    process: ["process", request => `process = require(${request})`],
    buffer: ["Buffer", request => `Buffer = require(${request}).Buffer`]
};

const File  = data `File` (
    filename            => string,
    dependencies        => List(number),
    compilationIndex    => number );


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
    const [files, dedupedCompilations] = sortedCompilations.reduce(
        function ([files, dedupedCompilations], [filename, compilation])
        {
            const dependencies = compilation
                .dependencies
                .map(dependency => filenameIndexes.get(dependency));

            const output = compilation.filename;
            const [compilationIndex] = dedupedCompilations
                .get(output, [dedupedCompilations.size]);
            const outDedupedCompilations =
                compilationIndex === dedupedCompilations.size ?
                    dedupedCompilations
                        .set(output, [compilationIndex, compilation]) :
                    dedupedCompilations;

            const outFiles = files.push(
                File({ filename, dependencies, compilationIndex }));

            return [outFiles, outDedupedCompilations];
        }, [List(File)(), OrderedMap(string, number)()]);
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
        .map(({ filename, compilationIndex, dependencies }) =>
            [filename, compilationIndex, dependencies])));

    append(", [");
    for (const [, [, { filename }]] of dedupedCompilations)
    {
        const isJSON = extname(filename) === ".json";

        if (isJSON)
            append(JSONPreamble);

        append(readFileSync(filename));

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
    append(`//# sourceMappingURL=./${basename(destination)}.map`);

    const concated = Buffer.concat(output.buffers, output.length);

    writeFileSync(destination, concated);
    writeSourceMap(53, destination, `${destination}.map`, dedupedCompilations);

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

const writeSourceMap = (function ()
{
    const {
        openSync: open,
        writeSync: write,
        closeSync: close,
        existsSync: exists,
        unlinkSync: unlink } = require("fs");

    return function writeSourceMap(lineCount, target, destination, dedupedCompilations)
    {
        if (exists(destination))
            unlink(destination);

        const fd = open(destination, "wx");

        write(fd, `{"version":3,"file":${JSON.stringify(target)},"sections":[`);

        dedupedCompilations.reduce(function ([existing, lineCount], [, compilation])
        {
            if (compilation.sourceMapPath === Maybe(string).Nothing)
                return [existing, lineCount + compilation.lineCount - 1];

            if (existing)
                write(fd, ",");

            write(fd, `{"offset":{"line":${lineCount},"column":0},"map":`)
            write(fd, readFileSync(compilation.sourceMapPath));
            write(fd, `}`);

            return [true, lineCount + compilation.lineCount - 1];
        }, [false, lineCount]);

        write(fd, `]}`);
        close(fd);
    }
})();

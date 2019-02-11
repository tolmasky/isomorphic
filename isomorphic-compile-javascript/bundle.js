const { basename, dirname, extname } = require("path");
const { openSync: open,
        writeSync: write,
        closeSync: close,
        existsSync: exists,
        unlinkSync: unlink,
        readFileSync } = require("fs");

const mkdirp = require("./mkdirp");
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


module.exports = function bundle(bundleRequest)
{
    const calculationStart = Date.now();
    const sortedCompilations = bundleRequest
        .compilations
        .toArray()
        .sort((lhs, rhs) => lhs.filename.localeCompare(rhs.filename));

    sortedCompilations.indexes = sortedCompilations
        .reduce((indexes, { filename }, index) =>
            (indexes[filename] = index, indexes), { });

    const [implicitBuiltInDependencies, outputs] = sortedCompilations
        .reduce(function ([implicitBuiltInDependencies, outputs], compilation)
        {
            const { metadata, output } = compilation;
            const implicitBuiltInDependencies_ =
                implicitBuiltInDependencies
                .concat(metadata.implicitBuiltInDependencies);

            const existing = outputs.indexes[output.filename];
            const index = existing === void(0) ? outputs.length : existing;

            if (index !== existing)
            {
                outputs.indexes[output.filename] = index;
                outputs.push(output);
            }

            return [implicitBuiltInDependencies_, outputs];
        }, [Set(string)(), Object.assign([], {indexes:{ }})]);
    const implicitDependencyPairs = implicitBuiltInDependencies
        .map(dependency => [dependency, sortedCompilations.indexes[dependency]]);
    const { entrypoint, destination } = bundleRequest.product;
    const entrypointIndex = sortedCompilations.indexes[entrypoint];
    const calculationsDuration = Date.now() - calculationStart;

    const bundleStart = Date.now();
    writeBundle(destination,
        entrypointIndex,
        sortedCompilations,
        outputs,
        implicitDependencyPairs);
    const bundleDuration = Date.now() - bundleStart;

    const sourceMapStart = Date.now();
    writeSourceMap(54, destination, `${destination}.map`, outputs);
    const sourceMapDuration = Date.now() - sourceMapStart;

    console.log(destination +
        sortedCompilations.length + " " +
        " calc: " + calculationsDuration +
        " bundle: " + bundleDuration +
        " sourceMap: " + sourceMapDuration +
        " total: " + (Date.now() - calculationStart));

    return Bundle.Response({ filename: destination });
}

function writeBundle(destination, entrypointIndex, compilations, outputs, implicitDependencyPairs)
{
    if (exists(destination))
        unlink(destination);

    mkdirp(dirname(destination));

    const fd = open(destination, "wx");

    write(fd, "(function (global) {")

    if (implicitDependencyPairs.size > 0)
        write(fd, "var " +
            implicitDependencyPairs
                .map(([name]) => fromImplicitDependency[name][0])
                .join(",") + ";");

    write(fd, readFileSync(bootstrapPath));
    write(fd, `(${entrypointIndex}, [`);

    for (const compilation of compilations)
    {
        const filename = JSON.stringify(compilation.filename);
        const index = outputs.indexes[compilation.output.filename];

        write(fd, `[${filename}, ${index}, [`);

        for (const dependency of compilation.dependencies)
            write(fd, `${compilations.indexes[dependency]},`);

        write(fd, `]], `);
    }

    write(fd, "], [");

    for (const output of outputs)
    {
        const isJSON = extname(output.filename) === ".json";

        if (isJSON)
            write(fd, JSONPreamble);

        write(fd, readFileSync(output.filename));

        if (isJSON)
            write(fd, JSONPostamble);

        write(fd, ",");
    }

    write(fd, "]");

    if (implicitDependencyPairs.size > 0)
    {
        write(fd, ", function (require) {");

        write(fd, implicitDependencyPairs
            .map(([name, index]) => fromImplicitDependency[name][1](index))
            .join(";") + ";");

        write(fd, "}");
    }

    write(fd, ") })(window)");
    write(fd, `//# sourceMappingURL=./${basename(destination)}.map`);

    close(fd);
}

function writeSourceMap(lineCount, target, destination, outputs)
{
    if (exists(destination))
        unlink(destination);

    mkdirp(dirname(destination));

    const fd = open(destination, "wx");

    write(fd, `{"version":3,"file":${JSON.stringify(target)},"sections":[`);

    outputs.reduce(function ([existing, lineCount], output)
    {
        if (output.sourceMap === Maybe(string).Nothing)
            return [existing, lineCount + output.lineCount - 1];

        if (existing)
            write(fd, ",");

        write(fd, `{"offset":{"line":${lineCount},"column":0},"map":`)
        write(fd, readFileSync(output.sourceMap));
        write(fd, `}`);

        return [true, lineCount + output.lineCount - 1];
    }, [false, lineCount]);

    write(fd, `]}`);
    close(fd);
}

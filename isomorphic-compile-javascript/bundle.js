const { basename, dirname, extname } = require("path");
const { openSync: open,
        writeSync: write,
        closeSync: close,
        existsSync: exists,
        unlinkSync: unlink,
        readFileSync } = require("fs");
const crypto = require("crypto");

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
    const integrity = writeBundle(destination,
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
        " integrity: " + integrity +
        " total: " + (Date.now() - calculationStart));

    return Bundle.Response({ filename: destination });
}

function writeBundle(destination, entrypointIndex, compilations, outputs, implicitDependencyPairs)
{
    if (exists(destination))
        unlink(destination);

    mkdirp(dirname(destination));

    const fd = open(destination, "wx");
    const integrity = crypto.createHash("sha512");
    const writei = contents =>
        (write(fd, contents), integrity.update(contents));

    writei("(function (global) {")

    if (implicitDependencyPairs.size > 0)
        writei( "var " +
            implicitDependencyPairs
                .map(([name]) => fromImplicitDependency[name][0])
                .join(",") + ";");

    writei(readFileSync(bootstrapPath));
    writei(`(${entrypointIndex}, [`);

    for (const compilation of compilations)
    {
        const filename = JSON.stringify(compilation.filename);
        const index = outputs.indexes[compilation.output.filename];

        writei(`[${filename}, ${index}, [`);

        for (const dependency of compilation.dependencies)
            writei(`${compilations.indexes[dependency]},`);

        writei(`]], `);
    }

    writei("], [");

    for (const output of outputs)
    {
        const isJSON = extname(output.filename) === ".json";

        if (isJSON)
            writei(JSONPreamble);

        writei(readFileSync(output.filename));

        if (isJSON)
            writei(JSONPostamble);

        writei(",");
    }

    writei("]");

    if (implicitDependencyPairs.size > 0)
    {
        writei(", function (require) {");

        writei(implicitDependencyPairs
            .map(([name, index]) => fromImplicitDependency[name][1](index))
            .join(";") + ";");

        writei("}");
    }

    writei(") })(window)");
    writei(`//# sourceMappingURL=./${basename(destination)}.map`);

    close(fd);

    return integrity.digest("hex");
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

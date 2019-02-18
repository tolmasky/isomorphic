const { basename, extname } = require("path");
const { readFileSync } = require("fs");

const JSONPreamble = "function(exports, require, module) { module.exports = ";
const JSONPostamble = "}";
const bootstrapPath = require.resolve("./bundle/bootstrap");

const { data, string, number, Maybe } = require("@algebraic/type");
const { List, Map, OrderedMap, Set } = require("@algebraic/collections");
const Bundle = require("@isomorphic/build/plugin/bundle");
const { Offset } = require("@isomorphic/build/plugin/compilation").Output;
const Product = require("@isomorphic/build/product");
const fromImplicitDependency =
{
    process: ["process", request => `process = require(${request})`],
    buffer: ["Buffer", request => `Buffer = require(${request}).Buffer`]
};


module.exports = function bundle(bundleRequest, toDestination)
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
    const { entrypoint } = bundleRequest;
    const entrypointIndex = sortedCompilations.indexes[entrypoint];
    const calculationsDuration = Date.now() - calculationStart;

    const [sourceMapProduct, bundleProduct] = writeBundle(
        toDestination,
        entrypointIndex,
        sortedCompilations,
        outputs,
        implicitDependencyPairs);

    console.log(bundleProduct.destination +
        sortedCompilations.length + " " +
        " calc: " + calculationsDuration +
        " bundle: " + bundleProduct.duration +
        " sourceMap: " + sourceMapProduct.duration +
        " integrity: " + bundleProduct.integrity +
        " total: " + (Date.now() - calculationStart));

    return List(Product)([sourceMapProduct, bundleProduct]);
}

function writeBundle(toDestination, entrypointIndex, compilations, outputs, implicitDependencyPairs)
{
    return tmpWriteTo(toDestination, function (write)
    {
        const offset = [
            "(function (global) {",
            implicitDependencyPairs.size <= 0 ?
                "" :
                `var ${implicitDependencyPairs
                        .map(([name]) => fromImplicitDependency[name][0])
                        .join(",")};`,
            readFileSync(bootstrapPath, "utf-8"),
            `(${entrypointIndex}, [`
        ].reduce((offset, string) =>
            (write(string), Offset.sum(offset, Offset.fromString(string))),
            Offset({ line: 0, column: 0 }));

        const [sourceMapProduct] =
            writeSourceMap(integrity =>
                `${toDestination(integrity)}.map`, offset, outputs);
        const sourceMapDestination = sourceMapProduct.destination;

        for (const compilation of compilations)
        {
            const filename = JSON.stringify(compilation.filename);
            const index = outputs.indexes[compilation.output.filename];

            write(`[${filename}, ${index}, [`);

            for (const dependency of compilation.dependencies)
                write(`${compilations.indexes[dependency]},`);

            write(`]], `);
        }

        write("], [");

        for (const output of outputs)
        {
            const isJSON = extname(output.filename) === ".json";

            if (isJSON)
                write(JSONPreamble);

            write(readFileSync(output.filename));

            if (isJSON)
                write(JSONPostamble);

            write(",");
        }

        write("]");

        if (implicitDependencyPairs.size > 0)
        {
            write(", function (require) {");

            write(implicitDependencyPairs
                .map(([name, index]) => fromImplicitDependency[name][1](index))
                .join(";") + ";");

            write("}");
        }

        write(") })(window)");
        write(`//# sourceMappingURL=./${basename(sourceMapDestination)}`);

        return [sourceMapProduct];
    });
}

function writeSourceMap(toDestination, offset, outputs)
{
    return tmpWriteTo(toDestination, function (write)
    {
        // Leave file: out, because it creates a circular checksum situation.
        // "file":${JSON.stringify(target)},
        write(`{"version":3,"sections":[`);

        outputs.reduce(function ([existing, offset], output)
        {
            if (output.sourceMap === Maybe(string).Nothing)
                return [existing, Offset.sum(offset, output.offset)];

            if (existing)
                write(",");

            write(`{"offset":{"line":${offset.line},"column":${offset.column}},"map":`);
            write(readFileSync(output.sourceMap));
            write(`}`);

            return [true, Offset.sum(offset, output.offset)];
        }, [false, offset]);

        write(`]}`);
    });
}

const tmpWriteTo = (function ()
{
    const crypto = require("crypto");
    const fs = require("fs");
    const { dirname } = require("path");

    const uuid = require("uuid").v4;
    const mkdirp = require("./mkdirp");

    return function tmpWriteTo(toDestination, f)
    {
        const start = Date.now();
        const tmpDestination = `/tmp/${uuid()}`;
        const fd = fs.openSync(tmpDestination, "wx");
        const hash = crypto.createHash("sha512");

        const products =
            f(contents => (fs.writeSync(fd, contents), hash.update(contents))) ||
            [];

        fs.closeSync(fd);

        const integrity = `sha512-${hash.digest("base64")}`;
        const destination = toDestination(integrity);

        if (fs.existsSync(destination))
            fs.unlinkSync(destination);

        mkdirp(dirname(destination));
        fs.renameSync(tmpDestination, destination);

        const duration = Date.now() - start;

        return [...products, Product({ integrity, destination, duration })];
    }
})();

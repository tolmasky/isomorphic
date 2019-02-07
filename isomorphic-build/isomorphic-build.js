const Configuration = require("./configuration");
const { Plugin, Compilation } = require("@isomorphic/plugin");


module.exports = async function main(options)
{
    const configuration = Configuration.parse(options);

    return await IO.toPromise(Build.create({ configuration }));
}

const { data, union, number, string } = require("@algebraic/type");
const { List, Map, OrderedMap, OrderedSet, Set } = require("@algebraic/collections");

const { Cause, field, event, update, IO } = require("@cause/cause");
const Pool = require("@cause/pool");
const { basename } = require("path");
const treeReduce = require("./tree-reduce");

const { execSync } = require("child_process");
const mkdirp = path => execSync(`mkdir -p ${JSON.stringify(path)}`) && path;


const Build = Cause("Build",
{
    [field `products`]: -1,
    [field `configuration`]: -1,

    [field `transformPool`]: -1,
    [field `compilations`]: -1,
    [field `visited`]: -1,

    init({ configuration })
    {
        const { cache, concurrency, pluginConfigurations } = configuration;
        const plugin = Plugin.fork(
            { parentCache: cache, configuration: pluginConfigurations.first() });

        const products = configuration.products;
        const plugins = List(Plugin)(Array.from(Array(concurrency), () => plugin));
        const transformPool = Pool.create({ items: plugins });
        const compilations = OrderedMap(string, Compilation)();
        const visited = Set(string)(products.map(product => product.entrypoint));

        return { products, configuration, transformPool, compilations, visited };
    },

    [event.on (Cause.Start)]: build => update.in(build, "transformPool",
        Pool.Enqueue({ requests: List(string)(build.products.map(product => product.entrypoint)) })),

    [event.on (Pool.Retained) .from `transformPool`]:
        (build, { request, index }) => {
        if (!global.first) { global.first = Date.now(); console.log(Date.now()) }
//        console.log("COMPILING " + request);
        return update.in(
            build,
            ["transformPool", "items", index],
            Plugin.Compile({ filename: request, cache: build.configuration.cache })) },

    [event._on (Compilation)]: function (inBuild, compilation, [,, index])
    {
        const request = inBuild.transformPool.occupied.get(index);
        const compilations = inBuild.compilations.set(request, compilation);
        const requests = OrderedSet(string)
            (compilation.dependencies)
            .subtract(inBuild.visited);
        const visited = inBuild.visited.union(requests);

        const outBuild = inBuild
            .set("compilations", compilations)
            .set("visited", visited);

//        console.log("REMAINING " + outBuild.transformPool.occupied.size + " " + requests.size);
//        console.log("COMPLETED: " + responses.size + " " + visited.size);

        if (inBuild.transformPool.occupied.size === 1 &&
            inBuild.transformPool.backlog.size === 0 &&
            requests.size === 0)
        {console.log("end: " +  Date.now());
            for (const target of inBuild.products)
            {
                const start = Date.now();
                const root = inBuild.root;
                const bundle = toBundle(target.entrypoint, outBuild.compilations);
                const destination = target.destination;

                require("./bundle/concatenate")({ root, destination, bundle });
                const duration = Date.now() - start;
                console.log(basename(destination) + " took " + duration + " " + bundle.outputs.size + " " + bundle.files.size);
            }
console.log("very end: " + Date.now());
            return [outBuild, [Cause.Finished({ value: 1 })]];
        }

        return update.in.reduce(outBuild,
            "transformPool",
            [Pool.Release({ indexes:[index] }), Pool.Enqueue({ requests })]);
    }

});

const File  = data `File` (
    filename        => string,
    dependencies    => List(number),
    outputIndex     => number );

const Bundle = data `Bundle` (
    entrypoint      => number,
    files           => List(File),
    outputs         => List(string));

function toBundle(entrypoint, compilations)
{
    const children = filename =>
        compilations.get(filename).dependencies;
    const update = (filenames, filename) => filenames.push(filename);
    const filenames = treeReduce
        .cyclic(children, update, List(string)(), entrypoint)
        .sort();
    const filenameIndexes = Map(string, number)(
        filenames.map((filename, index) => [filename, index]));

    const [files, outputIndexes] = filenames.reduce(
        function ([files, outputIndexes], filename)
        {
            const compilation = compilations.get(filename);
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
    const bundle = Bundle(
    {
        entrypoint: filenameIndexes.get(entrypoint),
        files,
        outputs
    });

    return bundle;
}

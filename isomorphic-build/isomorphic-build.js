const { data, union, number, string, serialize } = require("@algebraic/type");
const { List, Map, OrderedMap, OrderedSet, Set } = require("@algebraic/collections");

const { Cause, field, event, update, IO } = require("@cause/cause");
const Pool = require("@cause/pool");

const Configuration = require("./configuration");
const Plugin = require("./plugin");
const Compilation = require("./plugin/compilation");
const Bundle = require("./plugin/bundle");
const Product = require("./product");
const Rule = require("./plugin/configuration");


module.exports = async function main(options)
{
    const configuration = Configuration.parse(require.main.filename, options);
console.log(configuration);
    return await IO.toPromise(Build.create({ configuration }));
}

/*const RulePath = union `RulePath` (
    data `Root` (),
    data `Child` (
        rule => Rule,
        parent => RulePath) );

const data `Task` (
    filename    => string,
    rulePath    => RulePath )*/

const Build = Cause("Build",
{
    [field `products`]: Map(string, List(Product))(),
    [field `entrypoints`]: -1,
    [field `configuration`]: -1,

    [field `transformPool`]: -1,
    [field `compilations`]: -1,
    [field `visited`]: -1,

    init({ configuration })
    {
        const { cache, concurrency } = configuration;
console.log(configuration.plugins);

        const plugin = Plugin.fork(
        {
            parentCache: cache,
            plugins: serialize(Set(Rule.Plugin), plugins)
        });

        // FIXME: Something more elegant to access to the Compilation?
        require(firstPluginConfiguration.filename);

        const entrypoints = configuration.entrypoints;
        const visited = Set(string)(entrypoints);

        const plugins = List(Plugin)(Array.from(Array(concurrency), () => plugin));
        const transformPool = Pool.create({ items: plugins });
        const compilations = OrderedMap(string, Compilation)();

        return { entrypoints, configuration, transformPool, compilations, visited };
    },

    [event.on (Cause.Start)]: build => update.in(build, "transformPool",
        Pool.Enqueue({ requests: List(string)(build.entrypoints
            .map(filename =>
                Plugin.Compile({ filename, cache: build.configuration.cache }))) })),

    [event.on (Pool.Retained) .from `transformPool`]:
        (build, { request, index }) => {
        return update.in(
            build,
            ["transformPool", "items", index],
            request) },

    [event._on (Bundle.Response)]: function (inBuild, response, [,, index])
    {
        const products = inBuild.products
            .set(response.entrypoint, response.products);
        const outBuild = inBuild.set("products", products);

        if (inBuild.transformPool.occupied.size === 1 &&
            inBuild.transformPool.backlog.size === 0)
            return [outBuild, [Cause.Finished({ value: products })]];

        return update.in(
            outBuild, "transformPool", Pool.Release({ indexes:[index] }));
    },

    [event._on (Compilation)]: function (inBuild, compilation, [,, index])
    {console.log("ReSPONSE");
    console.log(compilation);
        const request = compilation.filename;
        const compilations = inBuild.compilations.set(request, compilation);
        const dependencies = OrderedSet(string)
            (compilation.dependencies)
            .subtract(inBuild.visited);
        const requests = dependencies.map(filename =>
            Plugin.Compile({ filename, cache: inBuild.configuration.cache }));
        const visited = inBuild.visited.union(dependencies);
        const outBuild = inBuild
            .set("compilations", compilations)
            .set("visited", visited);

        if (inBuild.transformPool.occupied.size === 1 &&
            inBuild.transformPool.backlog.size === 0 &&
            requests.size === 0)
        {
            // FIXME: Get better at this!
            const { Compilation } = require(
                outBuild.configuration.pluginConfigurations.first().filename);

            // FIXME: We want to sort these by size, since large files take
            // longer to write out, so if we group files by size we have a
            // higher chance of taking the time hits in parallel. The number
            // of compilations is a bad heuristic for this. It would be nice
            // to know the total size of the files, but to do that we need
            // Compilations to return size.
            const { entrypoints, compilations } = outBuild;
            const requests = entrypoints
                .map(entrypoint => Bundle.Request(Compilation)
                    .fromCompilationsInEntrypoint(compilations, entrypoint))
                .sortBy(request => -request.compilations.size);

            return update.in.reduce(
                outBuild, "transformPool",
                [Pool.Release({ indexes:[index] }), Pool.Enqueue({ requests })]);
        }

        return update.in.reduce(outBuild,
            "transformPool",
            [Pool.Release({ indexes:[index] }), Pool.Enqueue({ requests })]);
    },
});

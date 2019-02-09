const { data, union, number, string } = require("@algebraic/type");
const { List, Map, OrderedMap, OrderedSet, Set } = require("@algebraic/collections");

const { Cause, field, event, update, IO } = require("@cause/cause");
const Pool = require("@cause/pool");

const Configuration = require("./configuration");
const Plugin = require("./plugin");
const Compilation = require("./plugin/compilation");
const Bundle = require("./plugin/bundle");

console.log(Bundle.Response);
module.exports = async function main(options)
{
    const configuration = Configuration.parse(options);

    return await IO.toPromise(Build.create({ configuration }));
}

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

        // FIXME: Something more elegant to access to the Compilation?
        require(pluginConfigurations.first().filename);

        const products = configuration.products;
        const plugins = List(Plugin)(Array.from(Array(concurrency), () => plugin));
        const transformPool = Pool.create({ items: plugins });
        const compilations = OrderedMap(string, Compilation)();
        const visited = Set(string)(products.map(product => product.entrypoint));

        return { products, configuration, transformPool, compilations, visited };
    },

    [event.on (Cause.Start)]: build => update.in(build, "transformPool",
        Pool.Enqueue({ requests: List(string)(build.products
            .map(({ entrypoint: filename }) =>
                Plugin.Compile({ filename, cache: build.configuration.cache }))) })),

    [event.on (Pool.Retained) .from `transformPool`]:
        (build, { request, index }) => {
        return update.in(
            build,
            ["transformPool", "items", index],
            request) },

    [event._on (Bundle.Response)]: function (inBuild, response, [,, index])
    {
        if (inBuild.transformPool.occupied.size === 1 &&
            inBuild.transformPool.backlog.size === 0)
            return [inBuild, [Cause.Finished({ value: 1 })]];

        console.log("finished " + response.filename);

        return update.in(
            inBuild, "transformPool", Pool.Release({ indexes:[index] }));
    },

    [event._on (Compilation)]: function (inBuild, compilation, [,, index])
    {
        const request = inBuild.transformPool.occupied.get(index).filename;
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

            const requests = outBuild.products
                .map(product => Bundle.Request(Compilation)
                    .fromCompilationsInProduct(outBuild.compilations, product));

            return update.in.reduce(
                outBuild, "transformPool",
                [Pool.Release({ indexes:[index] }), Pool.Enqueue({ requests })]);
        }

        return update.in.reduce(outBuild,
            "transformPool",
            [Pool.Release({ indexes:[index] }), Pool.Enqueue({ requests })]);
    },
});

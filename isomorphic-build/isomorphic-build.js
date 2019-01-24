const { data, union, string } = require("@algebraic/type");
const { List, Map, OrderedMap, Set } = require("@algebraic/collections");

const Target = require("./target");
const { Cause, field, event, update, IO } = require("@cause/cause");
const Pool = require("@cause/pool");
const Fork = require("@cause/fork");
const Plugin = require("./plugin");
const Response = Plugin.Response;
const { basename } = require("path");
const treeReduce = require("./tree-reduce");

const { execSync } = require("child_process");
const mkdirp = path => execSync(`mkdir -p ${JSON.stringify(path)}`) && path;


module.exports = async function main(options)
{
    return await IO.toPromise(Build.create(options));
}

const Bundle = data `Bundle` (
    entrypoint      => string,
    compilations    => [Map(string, Response), Map(string, Response)()]);

const Build = Cause("Build",
{
    [field `root`]: -1,
    [field `targets`]: -1,

    [field `transformPool`]: -1,
    [field `responses`]: -1,
    [field `visited`]: -1,
    [field `cache`]: -1,

    init({ targets: iterable, root, concurrency, cache })
    {
        mkdirp(`${cache}/contents`);
        mkdirp(`${cache}/outputs`);
        mkdirp(`${cache}/inputs`);

        console.log("AMOUNT: " + concurrency);

        const targets = List(Target)(iterable);
        const fork = Fork.create({ type: Plugin, fields: { cache, path: "../isomorphic-compile-javascript/" } });
        const items = List(Fork)(Array.from(Array(concurrency), () => fork));
        const transformPool = Pool.create({ items });
        const responses = OrderedMap(string, Plugin.Response)();
        const visited = Set(string)(iterable);

        return { transformPool, responses, visited, targets, cache, root };
    },

    [event.on (Cause.Start)]: build => update.in(build, "transformPool",
        Pool.Enqueue({ requests: List(string)(build.targets.map(target => target.entrypoint)) })),

    [event.on (Pool.Retained) .from `transformPool`]:
        (build, { request, index }) => {
//        console.log("COMPILING " + request);
        return update.in(
            build,
            ["transformPool", "items", index],
            Plugin.Request({ input: request })) },

    [event._on (Plugin.Response)]: function (inBuild, response, [,, index])
    {
        const request = inBuild.transformPool.occupied.get(index);
        const responses = inBuild.responses.set(request, response);
        const requests = response.metadata.dependencies.subtract(inBuild.visited);
        const visited = inBuild.visited.union(requests);

        const outBuild = inBuild
            .set("responses", responses)
            .set("visited", visited);

//        console.log("REMAINING " + outBuild.transformPool.occupied.size + " " + requests.size);
//        console.log("COMPLETED: " + responses.size + " " + visited.size);

        if (inBuild.transformPool.occupied.size === 1 &&
            inBuild.transformPool.backlog.size === 0 &&
            requests.size === 0)
        {
            for (const target of inBuild.targets)
            {
                const root = inBuild.root;
                const bundle = toBundle(target.entrypoint, outBuild.responses);
                const destination = target.destination;

                console.log(basename(destination) + ": " +
                    bundle.compilations.size + " " +
                    outBuild.responses.size);

                require("./bundle/concatenate")({ root, destination, bundle });
            }

            return [outBuild, [Cause.Finished({ value: 1 })]];
        }

        return update.in.reduce(outBuild,
            "transformPool",
            [Pool.Release({ indexes:[index] }), Pool.Enqueue({ requests })]);
    }

});

function toBundle(entrypoint, responses)
{
    return treeReduce.cyclic(
        filename => responses
            .get(filename)
            .metadata.dependencies,
        (bundle, filename) => Bundle(
        {
            ...bundle,
            compilations: bundle.compilations
                .set(filename, responses.get(filename))
        }),
        Bundle({ entrypoint }),
        entrypoint);
}

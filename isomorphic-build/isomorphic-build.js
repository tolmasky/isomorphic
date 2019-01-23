const { data, string } = require("@algebraic/type");
const { List, Map, OrderedMap, Set } = require("@algebraic/collections");

const { Cause, field, event, update, IO } = require("@cause/cause");
const Pool = require("@cause/pool");
const Fork = require("@cause/fork");
const Plugin = require("./plugin");
const Response = Plugin.Response;
const { basename } = require("path");


module.exports = async function main(entrypoints, options)
{
    const promise =
        IO.toPromise(Build.create({ ...options, entrypoints }));

    return await promise;
}

const Bundle = data `Bundle` (
    entrypoint      => string,
    descendents     => Set(string),
    compilations    => [Map(string, Response), Map(string, Response)()]);

const Build = Cause("Build",
{
    [field `bundles`]: -1,

    [field `transformPool`]: -1,
    [field `responses`]: -1,
    [field `visited`]: -1,

    init({ entrypoints: iterable, concurrency })
    {
        const bundles = Map(string, Bundle)
            (iterable.map(entrypoint =>
                [entrypoint, Bundle({ entrypoint, descendents:Set(string)([entrypoint]) })]));

console.log("AMOUNT: " + concurrency);
        const fork = Fork.create({ type: Plugin, fields: { path: "../isomorphic-compile-javascript/" } });
        const items = List(Fork)(Array.from(Array(concurrency), () => fork));
        const transformPool = Pool.create({ items });
        const responses = OrderedMap(string, Plugin.Response)();
        const visited = Set(string)(iterable);

        return { transformPool, responses, visited, bundles };
    },

    [event.on (Cause.Start)]: build => update.in(build, "transformPool",
        Pool.Enqueue({ requests: List(string)(build.bundles.keySeq()) })),

    [event.on (Pool.Retained) .from `transformPool`]:
        (build, { request, index }) => {

        console.log("COMPILING " + request);
        return update.in(
            build,
            ["transformPool", "items", index],
            Plugin.Request({ input: request })) },

    [event._on (Plugin.Response)]: function (inBuild, response, [,, index])
    {
        const request = inBuild.transformPool.occupied.get(index);
        const responses = inBuild.responses.set(request, response);

        const dependencies = response.metadata.dependencies;
        const compilations = Map(string, Response)(dependencies
            .filter(dependency => inBuild.responses.has(dependency))
            .map(dependency => [dependency, inBuild.responses.get(dependency)]))
            .set(request, response);

        const bundles = inBuild.bundles
            .map(bundle => !bundle.descendents.has(request) ?
                bundle : Bundle(
                {
                    ...bundle,
                    compilations: bundle.compilations.merge(compilations),
                    descendents: bundle.descendents.union(dependencies)
                }));

        const requests = response.metadata.dependencies.subtract(inBuild.visited);
        const visited = inBuild.visited.union(requests);

        const outBuild = inBuild
            .set("responses", responses)
            .set("visited", visited)
            .set("bundles", bundles);

//        console.log("REMAINING " + outBuild.transformPool.occupied.size + " " + requests.size);
//        console.log("COMPLETED: " + responses.size + " " + visited.size);

        if (inBuild.transformPool.occupied.size === 1 &&
            requests.size === 0)
        {            
            const root = "/Users/tolmasky/Development/tonic/app";
    
            for (const [entrypoint, bundle] of bundles)
            {
                console.log(basename(entrypoint) + ".bundle.js contains " + bundle.compilations.size + " files for " + bundle.descendents.size + " tot: " + outBuild.responses.size);
                //console.log("COMPILATIONS");
                //console.log(List(string)(bundle.compilations.keySeq()).sort().join("\n"));
                const destination = root + "/results/" + basename(entrypoint) + ".bundle.js";
                //console.log(root, destination);
                require("./bundle/concatenate")({ root, destination, bundle });
            }

            console.log("ALL DONE?");
            process.exit(1);
        }

        return update.in.reduce(outBuild,
            "transformPool",
            [Pool.Release({ indexes:[index] }), Pool.Enqueue({ requests })]);
    }

//    [event._on(Log)]: (main, log) => (console.log(log.message), [main, []]),
/*
    [event._on(Result.Suite)] (main, result)
    {
        const [,, index] = result.fromKeyPath;
        const [updated, events] = update.in(
            main.update("results", results => results.push(result)),
            "fileProcessPool",
            Pool.Release({ indexes: [index] }));
        const { results } = updated;
        const finished = results.size === main.paths.size;

        if (!finished)
            return [updated, events];

        const children = results.map(result => result.suite);
        const suite = toRootSuite({ title: main.title, children });
        const value = Result.Suite.fromChildren(suite, results);

        return [updated, [...events, Cause.Finished({ value })]];
    },

    [event.on (Pool.Retained) .from `fileProcessPool`](main, event)
    {
        const { request: path, index } = event;

        return update.in(
            main,
            ["fileProcessPool", "items", index],
            FileProcess.Execute({ path }));
    },

    [event.on (Cause.Start)]: main =>
        update.in(main,
            "fileProcessPool",
            Pool.Enqueue({ requests: main.paths })),


    [event.on (FileProcess.EndpointRequest)](main, { id, fromKeyPath })
    {
        const [,, fromFileProcess] = fromKeyPath;
        const requests = [List.of(fromFileProcess, id)];

        return update.in(main, "browserPool", Pool.Enqueue({ requests }));
    },

    [event.on (FileProcess.EndpointRelease)](main, { ids, fromKeyPath })
    {
        const [,, fromFileProcess] = fromKeyPath;
        const requests = ids.map(id => List.of(fromFileProcess, id));
        const occupied = main.browserPool.occupied;
        const indexes = requests
            .map(request => occupied.keyOf(request));

        return update.in.reduce(
            main,
            indexes.map(index => [["browserPool", "items", index], Browser.Reset()]));
    },

    [event.on (Browser.DidReset)]: (main, { fromKeyPath: [,,index] }) =>
        update.in(main, "browserPool", Pool.Release({ indexes: [index] })),

    [event.on (Pool.Retained) .from `browserPool`](main, event)
    {
        const { request, index } = event;
        const [fromFileProcess, id] = request;
        const { endpoint } = main.browserPool.items.get(index);

        return update.in(
            main,
            ["fileProcessPool", "items", fromFileProcess],
            FileProcess.EndpointResponse({ id, endpoint }));
    }*/
});

/*
function toRootSuite({ title, children })
{
    const block = Block({ id: -1, title, depth: -1 });

    return Suite({ block, children, mode: Suite.Mode.Concurrent });
}

module.exports.Log = Log;*/




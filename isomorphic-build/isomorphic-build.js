const { data, union, string } = require("@algebraic/type");
const { List, Map, OrderedMap, Set } = require("@algebraic/collections");

const { Cause, field, event, update, IO } = require("@cause/cause");
const Pool = require("@cause/pool");
const Fork = require("@cause/fork");
const Plugin = require("./plugin");
const Response = Plugin.Response;
const { basename } = require("path");
const treeReduce = require("./tree-reduce");

const { execSync } = require("child_process");
const mkdirp = path => execSync(`mkdir -p ${JSON.stringify(path)}`) && path;


module.exports = async function main(entrypoints, options)
{
    const promise =
        IO.toPromise(Build.create({ ...options, entrypoints }));

    return await promise;
}

const Bundle = data `Bundle` (
    entrypoint      => string,
    compilations    => [Map(string, Response), Map(string, Response)()]);

const Status = union `Status` (
    data `Uncompiled` (),
    data `Compiled` ( incompleteDependencies => Set(string) ),
    data `Complete` () )

const Build = Cause("Build",
{


    [field `transformPool`]: -1,
    [field `responses`]: -1,
    [field `visited`]: -1,
    [field `entrypoints`]: -1,
    [field `reallyVisited`]: -1,

    init({ entrypoints: iterable, concurrency })
    {
        mkdirp("/Users/tolmasky/Development/tonic/app/cache/contents");
        mkdirp("/Users/tolmasky/Development/tonic/app/cache/outputs");
        mkdirp("/Users/tolmasky/Development/tonic/app/cache/inputs");
        
        const bundles = Map(string, Bundle)
            (iterable.map(entrypoint =>
                [entrypoint, Bundle({ entrypoint, descendents:Set(string)([entrypoint]) })]));

console.log("AMOUNT: " + concurrency);
        const fork = Fork.create({ type: Plugin, fields: { path: "../isomorphic-compile-javascript/" } });
        const items = List(Fork)(Array.from(Array(concurrency), () => fork));
        const transformPool = Pool.create({ items });
        const responses = OrderedMap(string, Plugin.Response)();
        const visited = Set(string)(iterable);
        const entrypoints = Set(string)(iterable);
        const reallyVisited = Set(string)(iterable)

        return { transformPool, responses, visited, entrypoints, reallyVisited };
    },

    [event.on (Cause.Start)]: build => update.in(build, "transformPool",
        Pool.Enqueue({ requests: List(string)(build.entrypoints) })),

    [event.on (Pool.Retained) .from `transformPool`]:
        (build, { request, index }) => {
if (request === "/Users/tolmasky/Development/tonic/app/node_modules/aphrodite/lib/index.js")
    console.log("DOING IT");
        //console.log("COMPILING " + request);
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
        const reallyVisited = inBuild.visited.union(response.metadata.dependencies);

        if (request === "/Users/tolmasky/Development/tonic/app/node_modules/aphrodite/lib/generate.js")
            console.log("GOT IT!");
        if (request.indexOf("bootstrap-app") >= 0 ||
            request === "/Users/tolmasky/Development/tonic/app/node_modules/aphrodite/lib/index.js")
            console.log("FOR " + request + ":\n" + requests.join("\n") + "\nvs.\n" + response.metadata.dependencies.join("\n"));
//console.log("--\n" + requests.join("\n") + "--");
//if (requests.size === 0) { console.log("NOTHING FOR " + request); }
        const outBuild = inBuild
            .set("responses", responses)
            .set("visited", visited)
            .set("reallyVisited", reallyVisited);

//        console.log("REMAINING " + outBuild.transformPool.occupied.size + " " + requests.size);
//        console.log("COMPLETED: " + responses.size + " " + visited.size);

        if (inBuild.transformPool.occupied.size === 1 &&
            inBuild.transformPool.backlog.size === 0 &&
            requests.size === 0)
        {     
            const root = "/Users/tolmasky/Development/tonic/app";
              
            for (const entrypoint of inBuild.entrypoints)
            {
                const bundle = toBundle(entrypoint, outBuild.responses);
                const destination = root + "/results/" + basename(entrypoint) + ".bundle.js";

                console.log(basename(destination) + ": " + bundle.compilations.size + " " + outBuild.responses.size + " " + reallyVisited.size);

                require("fs").writeFileSync(root + "/results/" + visited.size + ".txt", visited.sort().join("\n"), "utf-8");

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

/*
    [field `dependents`]: Map(string, Set(string))(),
    [field `statuses`]: Map(string, Status)(),

        const filename = request;
        const dependents = dependencies.reduce(
            (dependents, dependency) =>
                dependents.update(dependency, Set(string)(),
                    dependents => dependents.add(filename)),
            inBuild.dependents);

        const incompleteDependencies = dependencies
            .filter(filename => inBuild.statuses.get(filename) !== Status.Complete);
        const completed = incompleteDependencies.size <= 0;
        const status = completed ?
            Status.Complete :
            Status.Compiled({ incompleteDependencies });
        const inStatuses = inBuild.statuses.set(filename, status);
        const statuses = completed ? 
            resolve(dependents)(inStatuses, filename) :
            inStatuses;
function resolve(dependents)
{
    return function resolve (inStatuses, dependency)
    {
        const [completed, outStatuses] = dependents
            .get(dependency, Set(string)())
            .reduce(function ([completed, inStatuses], filename)
            {
                const status = inStatuses.get(filename);
                
                if (status === Status.Complete)
                    return [completed, inStatuses];
                
                if (!status)
                console.log("COULDNT FIND " + filename);try {
                var incompleteDependencies =
                    status.incompleteDependencies.remove(dependency); } catch(e) { console.log(filename, dependency, status); throw e; }
                const complete = incompleteDependencies.size <= 0;
                const outStatuses = inStatuses.set(filename,
                    complete ?
                        Status.Complete :
                        Status.Compiled({ incompleteDependencies }));
                const outCompleted = complete ?
                    completed.add(filename) :
                    completed;
            if (complete) { console.log("MARKING " + filename + " as complete"); }
                return [outCompleted, outStatuses];
            }, [Set(string)(), inStatuses]);
    
        return completed.reduce(resolve, outStatuses);
    }
}
*/

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

/*

                if (status !== Status.Complete)
                    console.log("NOT DONE: " + filename);
                
                if (filename === "url" || filename === "/Users/tolmasky/Development/isomorphic/isomorphic-compile-javascript/node_modules/url/util.js" || filename === "querystring" || filename === "/Users/tolmasky/Development/isomorphic/isomorphic-compile-javascript/node_modules/util/node_modules/inherits/inherits.js" || filename === "util" || filename === "/Users/tolmasky/Desktop/test/a.js" || filename === "/Users/tolmasky/Desktop/test/b.js")
                    console.log(status.incompleteDependencies);
*/

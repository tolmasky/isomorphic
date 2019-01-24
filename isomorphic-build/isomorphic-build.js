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

const Status = union `Status` (
    data `Uncompiled` (),
    data `Compiled` ( incompleteDependencies => Set(string) ),
    data `Complete` () )

const Build = Cause("Build",
{
    [field `root`]: -1,
    [field `targets`]: -1,

    [field `transformPool`]: -1,
    [field `responses`]: -1,
    [field `visited`]: -1,
    [field `cache`]: -1,

    init({ targets: iterable, root, concurrency, cache, destination })
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

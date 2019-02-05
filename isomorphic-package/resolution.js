const { data, string, union } = require("@algebraic/type");
const { List, Map } = require("@algebraic/collections");
const { readFileSync } = require("fs");

const Dependency = data `Dependency` (
    name        => string,
    range       => string,
    resolution  => Resolution);

const Resolution = union `Resolution` (
    data `Found` (
        name                    => string,
        version                 => string,
        dependencies            => List(Dependency),
        devDependencies         => List(Dependency),
        optionalDependencies    => List(Dependency),
        peerDependencies        => List(Dependency) ),
    data `NotFound` (),
    data `Circular` () );

module.exports = Resolution;

Resolution.of = function (filename)
{
    return toResolution(filename, Map(string, Resolution)())[1];
}

function toResolution(filename, existing)
{
    if (existing.has(filename))
        return [existing, existing.get(filename)];

    const data = JSON.parse(readFileSync(filename, "utf-8"));
    const withCircular = existing.set(filename, Resolution.Circular);

    const [existing_, dependencies] =
        toDependencies(withCircular, filename, data.dependencies);
    const [existing__, optionalDependencies] =
        toDependencies(existing_, filename, data.optionalDependencies);
    const [existing___, devDependencies] =
        toDependencies(existing__, filename, data.devDependencies);
    const [existing____, peerDependencies] =
        toDependencies(existing___, filename, data.peerDependencies);
    const resolution = Resolution.Found(
    {
        name: data.name,
        version: data.version,
        dependencies,
        devDependencies,
        optionalDependencies,
        peerDependencies
    });
    const withSelf = existing____.set(filename, resolution);

    return [withSelf, resolution];
}

const normalize = (function ()
{
    const { isArray } = Array;
    const isString = object => typeof object === "string";
    const stringRegExp = /([^@\s><=])(?:[@\s><=])?(.*$)?/;

    return function normalize(dependencies)
    {
        if (!dependencies || typeof dependencies !== "object")
            return [];

        if (isArray(dependencies))
            return dependencies
                .filter(isString)
                .map(string => string.match(stringRegExp))
                .map(([, name, range]) => [name, range || ""]);

        return Object.keys(dependencies)
            .map(name => [name, dependencies[name]])
            .filter(([, range]) => isString(range));
    }
})()

const toDependencies = (function()
{
    const { realpathSync } = require("fs");
    const realPathCache = Object.create(null);
    const cachedRealPath = path =>
        realPathCache[path] || (realPathCache[path] = realpathSync(path));

    return function (existing, fakeFrom, ranges)
    {
        const [existing_, dependencies] =
            mapAccum(function (existing, [name, range])
            {
                const from = cachedRealPath(fakeFrom);
                const filename =
                    findFilePathInNodeModulesFrom(from, `${name}/package.json`);
                const [existing_, resolution] = !filename ?
                    [existing, Resolution.NotFound] :
                    toResolution(filename, existing);
                const dependency = Dependency({ name, range, resolution });

                return [existing_, dependency];
            }, existing, normalize(ranges));

        return [existing_, List(Dependency)(dependencies)];
    }
})();

function mapAccum(fn, acc, list)
{
  var idx = 0;
  var len = list.length;
  if (len<=0)
    return [acc, []];
  var result = [];
  var tuple = [acc];
  while (idx < len) {
    tuple = fn(tuple[0], list[idx]);
    result[idx] = tuple[1];
    idx += 1;
  }
  return [tuple[0], result];
}

// Module._findPath is slow because it is overloaded for a number of different
// uses, namely both relative and package-style paths. As such it can neither
// employ optimizations that would work solely when looking for relative paths
// or when looking for a package. Specifically:
//
// 1. It is forced to check every search path since request could be a
// package-style path or a relative path. As such, it can't rely on previous
// knowledge that search-path doesn't exist, because it needs to potentailly try
// ${search-path}/{../../something}.
//
// 2. It doesn't know ahead of time that you are looking for a specific file,
// so it has to try all ${index.js|[main] as well.
const findFilePathInNodeModulesFrom = (function ()
{
    const Module = require("module");
    const moduleCache = Object.create(null);

    return function findFilePathInNodeModulesFrom(basePath, request)
    {
        const module =
            moduleCache[basePath] ||
            { filename:basePath, paths: Module._nodeModulePaths(basePath) };
        const lookupPaths = Module._resolveLookupPaths(request, module, true);

        return findFilePathInNodeModules(request, lookupPaths);
    }
})();

const findFilePathInNodeModules = (function ()
{
    const tstat = require("./tstat");
    const { resolve } = require("path");

    return function findFilePathInNodeModules(request, paths)
    {
        for (const path of paths)
        {
            if (tstat(path) !== "directory")
                continue;

            //resolve(path, request);
            const filename = `${path}/${request}`;

            if (tstat(filename) !== "file")
                continue;

            // We don't realpathSync here since it's very slow, instead, only
            // realpathSync when we need it, IF we need it.
            return filename;
        }

        return false;
    }
})();


const { string, data, union } = require("@algebraic/type");
const { Map } = require("@algebraic/collections");
const { existsSync } = require("fs");
const { join, dirname, resolve } = require("path");
const empty = require.resolve("node-libs-browser/mock/empty");
const isBuiltIn = path => !/^(\.\/|\.\.\/|\/)/.test(path);

const PathMap = Map(String, string);
const PathMapNode = union `PathMapNode` (
    data `Root` (),
    data `Child` (
        map     => PathMap,
        parent  => PathMapNode ) );

const Module = require("module");
const getCachedModule = JSONCached(filename =>
    Object.assign(new Module(filename),
        { filename, paths: Module._nodeModulePaths(filename) }));
const builtinModules = Module.builtinModules.reduce(
    (builtinModules, name) =>
        (builtinModules[name] = true, builtinModules),
        Object.create(null));


module.exports = function resolve(root, basePath)
{
    return function (request)
    {
        const module = getCachedModule(basePath);
        const isBuiltIn = !!builtinModules[request];
        const resolved = isBuiltIn ?
            request :
            Module._findPath(
                request,
                Module._resolveLookupPaths(request, module, true),
                false);

        if (!resolved)
            return "path";

        const context = isBuiltIn ? basePath : resolved;
        const pathMapNode = getCachedPathMapNode(root, dirname(context));
        const mapped = getMappedFilename(pathMapNode, resolved);

        return mapped;
    }
}

function getMappedFilename(node, filename)
{
    return node === PathMapNode.Root ?
        filename :
        node.map.get(filename) ||
        getMappedFilename(node.parent, filename);
}

const getCachedPathMapNode = JSONCached(function (root, directory)
{
    const map = getPathMap(directory);
    const parent = root === directory ?
        PathMapNode.Root :
        getCachedPathMapNode(root, dirname(directory));

    return map.size === 0 ?
        parent :
        PathMapNode.Child({ parent, map });
});

function getPathMap(directory)
{
    const filename = `${directory}/package.json`;

    if (!existsSync(filename))
        return PathMap();

    const { browser } = require(filename);

    // FIXME: Not clear if this is the best strategy.
    // It may be the case that require("x") should only point to browser,
    // and not require(x/[main]).
    if (typeof browser === "string")
    {
        const module = getCachedModule(filename);
        const main = Module._resolveFilename(".", module);
        const resolved = browser === false ?
            empty :
            resolve(directory, browser);

        return PathMap({ [main]: resolved });
    }

    if (typeof browser !== "object" || browser === null)
        return PathMap();

     return PathMap(browser).mapEntries(map(directory));
}

function map(directory)
{
    return function ([from, to])
    {
        const fromResolved = isBuiltIn(from) ?
            from :
            resolve(directory, from);
        const toResolved = to === false ?
            empty :
            resolve(directory, to);

        return [fromResolved, toResolved];
    }
}

function JSONCached(f)
{
    const cache = Object.create(null);

    return function (...args)
    {
        const key = JSON.stringify(args);

        return cache[key] || (cache[key] = f(...args));
    }
}

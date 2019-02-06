const { string, data, union } = require("@algebraic/type");
const { Map } = require("@algebraic/collections");
const { existsSync } = require("fs");
const { dirname, resolve } = require("path");
const isBuiltIn = path => !/^(\.\/|\.\.\/|\/)/.test(path);

const PathMap = Map(String, string);
const PathMapNode = union `PathMapNode` (
    data `Root` (),
    data `Child` (
        map     => PathMap,
        parent  => PathMapNode ) );

const JSONCached = require("./json-cached");
const Module = require("module");
const getCachedModule = JSONCached(filename =>
    Object.assign(new Module(filename),
        ({ filename, paths: Module._nodeModulePaths(filename) })));


module.exports = function resolve(...args)
{
    const [options] = args;
    const from = typeof options === "string" ? options : options.from;
    const module = getCachedModule(from);

    return args.length > 1 ? resolve(args[1]) : resolve;

    function resolve(filename)
    {
        const paths = Module._resolveLookupPaths(filename, module, true);
//console.log(module);
//console.log(Module._resolveFilename(filename, module));
//console.log(paths);console.log(filename);
        const resolved = Module._findPath(filename, paths, false);

//        const resolved = Module._resolveFilename(filename, module);

        if (!resolved)
            return resolved;
    
        if (!options.browser)
            return resolved;

        const context = isBuiltIn(resolved) ? from : resolved;
        const pathMapNode = getCachedPathMapNode(options, dirname(context));
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

const getCachedPathMapNode = JSONCached(function (options, directory)
{
    const map = getPathMap(directory);
    const parent = "/" === directory || options.boundary === directory ?
        PathMapNode.Root :
        getCachedPathMapNode(options, dirname(directory));

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
        const module = getCachedModule(directory);
        const main = Module._resolveFilename(".", module);
        const resolved = browser === false ?
            options.empty :
            resolve(directory, browser);

        return PathMap({ [main]: resolved });
    }

    if (typeof browser !== "object" || browser === null)
        return PathMap();

     return PathMap(browser).mapEntries(map(options, directory));
}

function map(options, directory)
{
    return function ([from, to])
    {
        const fromResolved = isBuiltIn(from) ?
            from :
            resolve(directory, from);
        const toResolved = to === false ?
            options.empty :
            resolve(directory, to);

        return [fromResolved, toResolved];
    }
}

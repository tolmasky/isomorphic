const { string, data, union } = require("@algebraic/type");
const { Map } = require("@algebraic/collections");
const { existsSync } = require("fs");
var { join, dirname, resolve } = require("path");
const empty = require.resolve("node-libs-browser/mock/empty");

const PathMap = Map(String, string);
const PathMapNode = union `PathMapNode` (
    data `Root` (),
    data `Child` (
        map     => PathMap,
        parent  => PathMapNode ) );

const Module = require("module");
const getCachedModule = JSONCached(directory =>
    ((filename, paths) => Object.assign(new Module(filename),
        { filename, paths }))(`${directory}/:`,
        Module._nodeModulePaths(directory)));


module.exports = function resolve(root, from)
{
    const directory = dirname(from);
    const module = getCachedModule(directory);

    return function (filename)
    {try {
        const resolved = Module._resolveFilename(filename, module);
        const pathMapNode = getCachedPathMapNode(root, directory);
        //console.log(pathMapNode);
    if (resolved !== getMappedFilename(pathMapNode, resolved))
        console.log("FOR " + resolved + " " + getMappedFilename(pathMapNode, resolved));
        return getMappedFilename(pathMapNode, resolved); } catch(e) { return "path"; }
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

    if (typeof browser !== "object" || browser === null)
        return PathMap();

     return PathMap(browser).mapEntries(map(directory));
}

function map(directory)
{
    return function ([from, to])
    {
        const fromResolved =
            /^(\.\/|\.\.\/|\/)/.test(from) ?
                resolve(directory, from) :
                from;
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

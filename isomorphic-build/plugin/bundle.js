const { data, string, parameterized } = require("@algebraic/type");
const { List, Map, Set } = require("@algebraic/collections");
const Product = require("../product");

const Bundle = data `Bundle` (
    filename => string );

Bundle.Request = parameterized (T =>
    Object.assign(data `Bundle.Request<${T}>` (
        entrypoint      => string,
        compilations    => Map(string, T) ),
    {
        fromCompilationsInEntrypoint: (compilations, entrypoint) =>
            fromCompilationsInEntrypoint(T, compilations, entrypoint)
    }) );

Bundle.Response = data `Bundle.Response` (
    entrypoint  => string,
    products    => List(Product) );


const fromCompilationsInEntrypoint = (function ()
{
    const treeReduce = require("./tree-reduce");
    const update = (compilations, [filename, compilation]) =>
        compilations.set(filename, compilation);

    return function fromCompilationsInEntrypoint(Compilation, compilations, entrypoint)
    {
        const entryCache = { };
        const children = ([filename, compilation]) =>
            compilation
                .dependencies
                .map(filename =>
                    entryCache[filename] ||
                    (entryCache[filename] =
                        [filename, compilations.get(filename)]));

        const entrypointCompilation = compilations.get(entrypoint);

        return Bundle.Request(Compilation)(
        {
            entrypoint,
            compilations: treeReduce
                .cyclic(
                    children,
                    update,
                    Map(string, Compilation)(),
                    [entrypoint, entrypointCompilation])
        });
    };
})();

module.exports = Bundle;

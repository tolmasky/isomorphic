const { getType, data, string, parameterized } = require("@algebraic/type");
const { Map, Set } = require("@algebraic/collections");
const Product = require("../product");

const Bundle = data `Bundle` (
    filename => string );

Bundle.Request = parameterized (T =>
    Object.assign(data `Bundle.Request<${T}>` (
        product         => Product,
        compilations    => Map(string, T) ),
    {
        fromCompilationsInProduct: (compilations, product) =>
            fromCompilationsInProduct(T, compilations, product)
    }) );

Bundle.Response = data `Bundle.Response` (
    filename    => string );


const fromCompilationsInProduct = (function ()
{
    const treeReduce = require("./tree-reduce");
    const update = (compilations, [filename, compilation]) =>
        compilations.set(filename, compilation);

    return function fromCompilationsInProduct(Compilation, compilations, product)
    {
        const entryCache = { };
        const children = ([filename, compilation]) =>
            compilation
                .dependencies
                .map(filename =>
                    entryCache[filename] ||
                    (entryCache[filename] =
                        [filename, compilations.get(filename)]));

        const { entrypoint } = product;
        const entrypointCompilation = compilations.get(entrypoint);

        return Bundle.Request(Compilation)(
        {
            product,
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

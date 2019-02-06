const DEBUG = process.env.NODE_ENV !== "production"

const { data, string, number } = require("@algebraic/type");
const { List } = require("@algebraic/collections");
const PluginConfiguration = require("@isomorphic/plugin/configuration");
const Product = require("./product");

// FIXME: These lists should probaby be OrderedSets.
const Configuration = data `Build.Configuration` (
    root                    => string,
    cache                   => string,
    concurrency             => number,
    products                => List(Product),
    pluginConfigurations    => List(PluginConfiguration) );


Configuration.parse = (function ()
{
    const { resolve, basename, extname } = require("path");
    const flatMap = (f, array) => [].concat(...array.map(f));
    const dedupe = array => Array.from(new Set(array));

    // FIXME: This is legacy, we need to be able to define destinations in the
    // configuration. This currently ONLY works for javascript files.
    const FIXME_toDestination = (destination, entrypoint) =>
        `${destination}/${basename(entrypoint, extname(entrypoint))}.bundle.js`;

    return function parseConfiguration(options)
    {
        const cpus = require("os").cpus().length;
        const concurrency =
            options.concurrency === void(0) ?
            cpus : options.concurrency;
    
        if (DEBUG && options.concurrency > cpus)
            console.warn(
                `WARNING: concurrency of ${concurrency} chosen, but machine only ` +
                `has ${cpus} cpus. This usually results in degraded performance.`);
    
        // FIXME: There can be overlapping entrypoints.
        // FIXME: Explicit Products aren't checked for existence.
        const destination = options.entrypoints && resolve(options.destination);
        const entrypointProducts = List(Product)
            (dedupe(flatMap(glob, options.entrypoints || []))
            .map(entrypoint => Product(
            {
                entrypoint,
                destination: FIXME_toDestination(destination, entrypoint)
            })));
        const explicitProducts =
            List(Product)(options.products || []).map(Product);
        const products = entrypointProducts.concat(explicitProducts);
    
        if (products.size <= 0)
            return Error(`No products passed in.`);

        const root = resolve(options.root);
        const pluginConfigurations =
            List(PluginConfiguration)(options.plugins || [])
            .map(options => PluginConfiguration.parse(root, options));

        return Configuration(
        {
            root,
            cache: resolve(options.cache),
            concurrency,
            products,
            pluginConfigurations
        });
    }
})();

module.exports = Configuration;

const glob = (function ()
{
    const fastGlob = require("fast-glob");

    return function glob(pattern)
    {
        const results = fastGlob(pattern);

        if (DEBUG && result.length === 0)
            console.warn(
                `WARNING: The pattern "${pattern}" resulted in no files. ` +
                `Perhaps there is a typo in your pattern or you are running ` +
                `this from the wrong working directory.`);

        return results;
    }
})();
    
const DEBUG = process.env.NODE_ENV !== "production"

const { data, string, number } = require("@algebraic/type");
const { List } = require("@algebraic/collections");
const PluginConfiguration = require("./plugin/configuration");

// FIXME: These lists should probaby be OrderedSets.
const Configuration = data `Build.Configuration` (
    root                    => string,
    cache                   => string,
    concurrency             => number,
    entrypoints             => List(string),
    pluginConfigurations    => List(PluginConfiguration) );


Configuration.parse = (function ()
{
    const { resolve, basename, extname } = require("path");
    const flatMap = (f, array) => [].concat(...array.map(f));
    const dedupe = array => Array.from(new Set(array));

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

        const entrypoints = List(string)(
            [options.entrypoint, ...options.entrypoints]
            .filter(entrypoint => entrypoint !== void(0)))
            .map(path => resolve(path));

        if (entrypoints.size <= 0)
            return Error(`No entrypoints passed in.`);

        const root = resolve(options.root);
        const pluginConfigurations =
            List(PluginConfiguration)(options.plugins || [])
            .map(options => PluginConfiguration.parse(root, options));

        return Configuration(
        {
            root,
            cache: resolve(options.cache),
            concurrency,
            entrypoints,
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
    
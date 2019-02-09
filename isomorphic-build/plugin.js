const { data, string, serialize } = require("@algebraic/type");
const { Cause, field, event } = require("@cause/cause");
const Fork = require("@cause/fork");
const Package = require("@isomorphic/package");
const Compilation = require("./plugin/compilation");
const Bundle = require("./plugin/bundle");
const { execSync } = require("child_process");
const mkdirp = path => execSync(`mkdir -p ${JSON.stringify(path)}`) && path;


const Compile = data `Compile` (
    filename => string,
    cache    => string );

const Plugin = Cause(`Plugin`,
{
    [field `implementation`]: -1,
    [field `configuration`]: -1,
    [field `parentCache`]: -1,
    [field `cache`]: -1,

    init({ configuration, parentCache })
    {console.log("started... " + Date.now());
        const parentPackage = Package.for(configuration.filename);
        const cache = `${parentCache}/${parentPackage.checksum}`;

        mkdirp(cache);

        const constructor = require(configuration.filename);

        // This is currently necessary.
        console.log(Bundle.Request(constructor.Compilation));

        const implementation = constructor({ configuration, cache });

        return { configuration, cache, implementation };
    },

    [event.on (Cause.Start)]: function (plugin)
    {
        console.log("hi...");
        console.log(plugin.configuration);

        return [plugin, []];
    },

    [event._on (Compile)]: (plugin, parentCompile) =>
    {
        const compile = Compile({ ...parentCompile, cache: plugin.cache });
        const compilation = plugin.implementation.compile(compile, plugin.configuration);

        return [plugin, [compilation]];
    },

    [event.on `*`]: (plugin, bundleRequest) =>
    {
        const bundleResponse =
            plugin.implementation.bundle(bundleRequest, plugin.configuration);

        return [plugin, [bundleResponse]];
    }
});

Plugin.Plugin = Plugin;
Plugin.Compile = Compile;
Plugin.Compilation = Compilation;

module.exports = Plugin;

Plugin.fork = function ({ parentCache, configuration })
{
    return Fork.create({ type: Plugin, fields: { parentCache, configuration } });
}

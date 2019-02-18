const { extname } = require("path");
const { data, string, deserialize } = require("@algebraic/type");
const { Cause, field, event } = require("@cause/cause");
const Fork = require("@cause/fork");
const Package = require("@isomorphic/package");
const Compilation = require("./plugin/compilation");
const Bundle = require("./plugin/bundle");
const PluginConfiguration = require("./plugin/configuration");
const { execSync } = require("child_process");
const mkdirp = path => execSync(`mkdir -p ${JSON.stringify(path)}`) && path;
const Route = require("route-parser");
const uuid = require("uuid").v4;
const getSha512 = require("@isomorphic/package/get-sha-512");


const Compile = data `Compile` (
    filename => string,
    cache    => string );

const Plugin = Cause(`Plugin`,
{
    [field `implementation`]: -1,
    [field `configuration`]: -1,
    [field `parentCache`]: -1,
    [field `cache`]: -1,

    init({ configuration: serialized, parentCache })
    {
        console.log("started... " + Date.now());
        const configuration = deserialize(PluginConfiguration, serialized);
        const parentPackage = Package.for(configuration.filename);
        const cache = `${parentCache}/${parentPackage.checksum}`;

        mkdirp(cache);

        const constructor = require(configuration.filename);

        // FIXME: We have to instantiate this for this type to exist. Ideally we
        // make Plugin parameterized, then we pass this in, so that it is
        // created and we can use it instead of `*` in the handler.
        Bundle.Request(constructor.Compilation);

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
        const { entrypoint } = bundleRequest;
        const { matches } = plugin.configuration;
        const products = plugin.implementation.bundle(
            bundleRequest,
            toToDestination(matches, entrypoint));

        return [plugin, [Bundle.Response({ entrypoint, products })]];
    }
});

function toToDestination(matches, entrypoint)
{
    return function (integrity)
    {
        const hash = integrity.replace(/\//g, "_");

        return matches.reduce(function (destination, output, input)
        {
            if (destination)
                return destination;

            const values = (new Route(input)).match(entrypoint);

            return values && (new Route(output)).reverse({ ...values, hash });
        }, false);
    }
}

Plugin.Plugin = Plugin;
Plugin.Compile = Compile;
Plugin.Compilation = Compilation;
Plugin.Configuration = PluginConfiguration;

module.exports = Plugin;

Plugin.fork = function ({ parentCache, configuration })
{
    return Fork.create({ type: Plugin, fields: { parentCache, configuration } });
}

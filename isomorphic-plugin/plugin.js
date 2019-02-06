const { data, string, serialize } = require("@algebraic/type");
const { Cause, field, event } = require("@cause/cause");
const Fork = require("@cause/fork");
const Package = require("@isomorphic/package");
const Compilation = require("./compilation");
const { execSync } = require("child_process");
const mkdirp = path => execSync(`mkdir -p ${JSON.stringify(path)}`) && path;


const Compile = data `Compile` (
    filename => string,
    cache    => string );

const Bundle = data `Bundle` (
    destination     => string );

const Plugin = Cause(`Plugin`,
{
    [field `implementation`]: -1,
    [field `configuration`]: -1,
    [field `parentCache`]: -1,
    [field `cache`]: -1,

    init({ configuration, parentCache })
    {
        const parentPackage = Package.for(configuration.filename);
        const cache = `${parentCache}/${parentPackage.checksum}`;

        mkdirp(cache);

        const constructor = require(configuration.filename);
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
    }
});

Plugin.Plugin = Plugin;
Plugin.Compile = Compile;
Plugin.Compilation = Compilation;
Plugin.Bundle = Bundle;

module.exports = Plugin;

Plugin.fork = function ({ parentCache, configuration })
{
    return Fork.create({ type: Plugin, fields: { parentCache, configuration } });
}

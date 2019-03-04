const { readFileSync } = require("fs");
const { boolean, data, string, object, union } = require("@algebraic/type");
const { List, Set } = require("@algebraic/collections");
const Package = require("@isomorphic/package");
const getSha512 = require("@isomorphic/package/get-sha-512");


const Plugin = data `Plugin` (
    id          => string,
    filename    => string,
    package     => Package );

Plugin.resolve = function (plugins, filename)
{
    if (plugins.has(filename))
        return [plugins, plugins.get(filename)];

    const package = Package.for(filename);
    const fileChecksum = getSha512(readFileSync(filename));
    const packageChecksum = package.checksum;
    const id = getSha512(JSON.stringify({ fileChecksum, packageChecksum }));
    const plugin = Plugin({ id, filename, package });
    const plugins_ = plugins.set(filename, plugin);

    return [plugins_, plugin];
}

Plugin.Configuration = data `Plugin.Configuration` (
    destination => string,
    plugin      => Plugin,
    rules       => List(Rule),
    options     => object );

// FIXME: require(filename).Configuration.parse() for options.
Plugin.Configuration.parse = function (plugins, directory, data)
{
    const [plugins_, plugin] = Plugin.resolve(
        plugins,
        Package.resolve(directory, data.plugin));
    const destination = data.destination || "";
    const [plugins__, rules] = Object
        .entries(data.rules || { })
        .reduce(function ([plugins, rules], [pattern, data])
        {
            const [plugins_, rule] =
                Rule.parse(plugins, directory, data, pattern);

            return [plugins_, rules.push(rule)];
        }, [plugins_, List(Rule)()]);
    const configuration = Plugin.Configuration(
    {
        destination,
        plugin,
        rules,
        options: data.options || { }
    });

    return [plugins__, configuration];
}

const Action = union `Action` (
    data `Ignore` (),
    data `Recurse` (),
    data `CopyWithoutBuilding` (),
    Plugin.Configuration );

Action.parse = function (plugins, directory, data)
{
    return false ||
        data === ":ignore" ?
            [plugins, Action.Ignore] :
        data === ":recurse" ?
            [plugins, Action.Recurse] :
        data === ":copy-without-building" ?
            [plugins, Action.CopyWithoutBuilding] :
        Plugin.Configuration.parse(plugins, directory, data);
}

const Rule = data `Rule` (
    pattern => string,
    action  => Action );

Rule.parse = function (plugins, directory, data, pattern)
{
    const [plugins_, action] = Action.parse(plugins, directory, data, pattern);

    return [plugins_, Rule({ pattern, action })];
}

Rule.Plugin = Plugin;

module.exports = Rule;

const { loadOptions } = require("@babel/core");
const defaultPlugins = loadOptions(
{
    plugins:
    [
        require("./plugins/babel-plugin-metadata"),
//        require("./plugins/babel-plugin-entrypoints"),
        require("./plugins/babel-plugin-dependencies")
    ]
}).plugins;

module.exports = function getResolvedOptions(options)
{
    const { plugins, ...rest } = loadOptions(options);

    return { ...rest, plugins: plugins.concat(defaultPlugins) };
}


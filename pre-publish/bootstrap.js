const { dirname, join } = require("path");

const Module = require("module");
const oldResolveLookupPaths = Module._resolveLookupPaths;
const packages = dirname(__dirname);


Module._resolveLookupPaths = function(request, parent, newReturn)
{
    const result = oldResolveLookupPaths.apply(this, arguments);

    if (newReturn)
        return (result || []).concat(join(__dirname, "node_modules"), packages);

    return [result[0], result[1].concat(join(__dirname, "node_modules"), packages)];
}

require("isomorphic-preset");
require("babel-register")(
{
    presets: [
        ["isomorphic-preset", { node: "4.x.x", react: false }]
    ],
    plugins: [
        "generic-jsx/babel-plugin-transform-generic-jsx"
    ]
});

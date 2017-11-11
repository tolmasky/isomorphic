
const { dirname } = require("path");
const hasOwnProperty = Object.prototype.hasOwnProperty;
const transform = require("isomorphic-javascript");

const polyfills = Object.assign(require("node-libs-browser"),
{
    "module": require.resolve("./built-in/module.js")
});
const ignoredDependencies = { "module": /^(?!path).*$/ };
const resolve = require("isomorphic-compile/require-resolve");


module.exports = function builtIn({ path, cache, options })
{
    const include = reroute(path);

    return  <overwrite path = { path } >
                <resolve { ...{ root: dirname(include), keys:["dependencies"] } } >
                    <ignore dependencies = { ignoredDependencies[path] }>
                        <transform { ...{ path: include, cache, options } } />
                    </ignore>
                </resolve>
            </overwrite>
}

function ignore({ children:[metadata], ...rest })
{
    return Object.keys(rest)
        .filter(key => !!rest[key])
        .reduce((metadata, key) =>
        ({
            ...metadata,
            [key]: Array.from(metadata[key])
                .filter(path => !rest[key].test(path))
        }), metadata);
}

function overwrite({ children:[child], ...rest })
{
    return { ...child, ...rest };
}

function reroute(name)
{
    if (!hasOwnProperty.call(polyfills, name))
        throw new Error(`${name} is not a recognized core node module.`);

    if (!polyfills[name])
        return require.resolve("node-libs-browser/mock/empty");

    return polyfills[name];
}

module.exports.is = function (name)
{
    return hasOwnProperty.call(polyfills, name);
}

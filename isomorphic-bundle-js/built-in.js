
const polyfills = require("node-libs-browser");
const hasOwnProperty = Object.prototype.hasOwnProperty;


module.exports = function builtIn({ name })
{
    if (!hasOwnProperty.call(polyfills, name))
        throw new Error(`${name} is not a recognized core node module.`);

    if (!polyfills[name])
        return <empty name = { name }/>;

    return { include: polyfills[name], path: name };
}

function empty({ name })
{
    return { include: require.resolve("node-libs-browser/mock/empty"), path: name };
}

module.exports.is = function (name)
{
    return hasOwnProperty.call(polyfills, name);
}

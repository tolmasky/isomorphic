
const polyfills = require("node-libs-browser");
const hasOwnProperty = Object.prototype.hasOwnProperty;


module.exports = function builtIn({ name })
{
    if (!hasOwnProperty.call(polyfills, name))
        throw new Error(`${name} is not a recognized core node module.`);

    if (!polyfills[name])
        return <empty/>;

    return { include: polyfills[name] };
}

function empty()
{
    return { include: require.resolve("node-libs-browser/mock/empty") };
}

module.exports.is = function (name)
{
    return hasOwnProperty.call(polyfills, name);
}


const polyfills = require("node-libs-browser");
const hasOwnProperty = Object.prototype.hasOwnProperty;


module.exports = function(name)
{
    if (name === "module")
        return require.resolve("./module.js");

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

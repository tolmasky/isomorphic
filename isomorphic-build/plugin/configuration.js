const { readFileSync } = require("fs");
const { boolean, data, string, object } = require("@algebraic/type");
const { Map } = require("@algebraic/collections");
const Package = require("@isomorphic/package");
const getSha512 = require("@isomorphic/package/get-sha-512");


// FIXME: Would be nice to do something like Configuration<Options>.
const Configuration = data `Plugin.Configuration` (
    matches             => Map(string, string),
    filename            => string,
    checksum            => string,
    inlineSourceMapURL  => boolean,
    parentPackage       => Package,
    options             => object );


// FIXME: require(filename).Configuration.parse() for options.
Configuration.parse = function (directory, unparsedOptions)
{
    const { match, plugin, ...options } = unparsedOptions;

    const matches = Map(string, string)(match);
    const filename = Package.resolve(directory, plugin);
    const parentPackage = Package.for(filename);

    const fileChecksum = getSha512(readFileSync(filename));
    const checksum = getSha512(JSON.stringify(
        { fileChecksum, packageChecksum: parentPackage.checksum }));
    const inlineSourceMapURL = !!options.inlineSourceMapURL;

    return Configuration(
    {
        matches,
        checksum,
        filename,
        inlineSourceMapURL,
        parentPackage,
        options
    });
}

module.exports = Configuration;

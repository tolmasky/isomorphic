const { readFileSync } = require("fs");
const { data, string } = require("@algebraic/type");
const Package = require("@isomorphic/package");
const getSha512 = require("@isomorphic/package/get-sha-512");


// FIXME: Would be nice to do something like Configuration<Options>.
const Configuration = data `Plugin.Configuration` (
    entrypoint      => string,
    filename        => string,
    checksum        => string,
    parentPackage   => Package,
    options         => Object );

Configuration.parse = function (directory, unparsedOptions)
{
    const { entrypoint, plugin, ...options } = unparsedOptions;

    const filename = Package.resolve(directory, plugin);
    const parentPackage = Package.for(filename);

    const fileChecksum = getSha512(readFileSync(filename));
    const checksum = getSha512(JSON.stringify(
        { fileChecksum, packageChecksum: parentPackage.checksum }));

    return Configuration(
    {
        entrypoint,
        checksum,
        filename,
        parentPackage,
        options
    });
}

module.exports = Configuration;

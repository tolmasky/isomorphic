const { string } = require("@algebraic/type");
const { Set } = require("@algebraic/collections");
const Entered = require("@isomorphic/build/entered");

    
module.exports = function ({ configuration, cache })
{
//    const compile = () => console.log("compiling...");//require("./compile");
    const bundle = () => console.log("bundling...");//require("./bundle");

    const { options } = configuration;

//    mkdirp(`${cache}/contents`);
//    mkdirp(`${cache}/outputs`);
//    mkdirp(`${cache}/source-maps`);

    return { compile, bundle };
}

module.exports.Compilation = require("./compilation");

function compile(request, configuration)
{
    const { cache, filename } = request;
    const dependencies = Set(string)(readdir(filename));

    console.log("WILL RETURN " + Entered({ dependencies }));

    return Entered({ dependencies });
}

const readdir = (function ()
{
    const { join } = require("path");
    const { readdirSync } = require("fs");
    const tstat = require("@isomorphic/package/tstat");

    return function readdir(directory)
    {
        return readdirSync(directory)
            .map(child => join(directory, child))
            .map(child => tstat(child) === "directory" ?
                `${child}/` : child);
    }
})();

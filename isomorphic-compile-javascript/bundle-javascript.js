const mkdirp = require("./mkdirp");

    
module.exports = function ({ configuration, cache })
{
    const compile = require("./compile");
    const bundle = require("./bundle");

    const { options } = configuration;

    mkdirp(`${cache}/contents`);
    mkdirp(`${cache}/outputs`);

    return { compile, bundle };
}

module.exports.Compilation = require("./compilation");

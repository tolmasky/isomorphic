const { mkdirSync } = require("fs");

    
module.exports = function ({ configuration, cache })
{
    const compile = require("./compile");
    const bundle = require("./bundle");

    const { options } = configuration;

    mkdirSync(`${cache}/contents`, { recursive: true });
    mkdirSync(`${cache}/outputs`, { recursive: true });

    return { compile, bundle };
}

module.exports.Compilation = require("./compilation");

const compile = require("./compile");
const { execSync } = require("child_process");
const mkdirp = path => execSync(`mkdir -p ${JSON.stringify(path)}`) && path;


module.exports = function ({ configuration, cache })
{
    const { options } = configuration;

    mkdirp(`${cache}/contents`);
    mkdirp(`${cache}/outputs`);

    return { compile, bundle };
}

function bundle()
{
    console.log("bundle");
}

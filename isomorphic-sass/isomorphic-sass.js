
const { dirname, basename } = require("path");
const { writeFileSync } = require("fs");
const { execSync } = require("child_process");
const mkdirp = path => execSync(`mkdir -p ${JSON.stringify(path)}`);

const { renderSync } = require("node-sass");


module.exports = function isomorphicLess({ entrypoint, destination, options })
{
    const output = renderSync({ file: entrypoint }).css;

    mkdirp(dirname(destination));
    writeFileSync(destination, output, "utf-8");

    return { entrypoints: new Set(), path: entrypoint };
}

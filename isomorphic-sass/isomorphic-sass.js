
const { dirname, basename } = require("path");
const { mkdirp, write } = require("sf-fs");

const { renderSync } = require("node-sass");


module.exports = function isomorphicSass({ source, destination, options })
{
    const output = renderSync({ file: source }).css;

    mkdirp(dirname(destination));
    write(destination, output, "utf-8");

    return { };
}
